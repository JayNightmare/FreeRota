/**
 * fileImportParser.ts
 *
 * Parses uploaded files (.ics, .csv, .txt, .xlsx, .pdf) into an array of
 * DeviceCalendarEventInput objects that can be passed to the backend's
 * importDeviceCalendar / previewDeviceCalendarImport GraphQL mutations.
 *
 * Supported formats:
 *   .ics  – iCalendar (Google/Apple Calendar exports)
 *   .csv  – Comma-separated values with date/time columns
 *   .txt  – Plain text with recognisable date/time patterns
 *   .xlsx – Excel Open XML workbook (parsed via fflate + DOMParser)
 *   .pdf  – Portable Document Format (basic text-stream extraction)
 */

import { strFromU8, unzipSync } from "fflate";
import Papa from "papaparse";

export interface ParsedCalendarEvent {
	eventId: string;
	calendarId: string;
	title: string | null;
	notes: string | null;
	status: string | null;
	startUtc: string;
	endUtc: string;
	allDay: boolean;
	recurrenceRule: string | null;
}

const ONE_HOUR_MS = 3_600_000;
const MS_PER_MINUTE = 60_000;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

let _eventCounter = 0;
function nextEventId(source: string): string {
	_eventCounter += 1;
	return `file-import-${source}-${Date.now()}-${_eventCounter}`;
}

const CALENDAR_ID = "file-import";

/**
 * Attempt to parse a value as a Date and return an ISO-8601 UTC string.
 * Returns null if the value cannot be interpreted as a date.
 */
function toUtcIso(value: unknown): string | null {
	if (!value) return null;
	const d = new Date(value as string);
	if (isNaN(d.getTime())) return null;
	return d.toISOString();
}

/** Collapse consecutive whitespace and trim. */
function normalise(s: string): string {
	return s.replace(/\s+/g, " ").trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// .ics  (iCalendar)
// ─────────────────────────────────────────────────────────────────────────────

/** Unfold iCal line continuations (RFC 5545 §3.1). */
function unfoldIcal(raw: string): string {
	return raw.replace(/\r?\n[ \t]/g, "");
}

/** Parse an iCal DTSTART / DTEND value to a UTC ISO-8601 string. */
function parseIcalDate(value: string, tzid?: string): string | null {
	// DATE-TIME with UTC suffix: 20240115T090000Z
	if (/^\d{8}T\d{6}Z$/.test(value)) {
		const y = value.slice(0, 4);
		const mo = value.slice(4, 6);
		const d = value.slice(6, 8);
		const h = value.slice(9, 11);
		const mi = value.slice(11, 13);
		const s = value.slice(13, 15);
		return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`).toISOString();
	}
	// DATE-TIME without suffix (floating / local): 20240115T090000
	if (/^\d{8}T\d{6}$/.test(value)) {
		const y = value.slice(0, 4);
		const mo = value.slice(4, 6);
		const d = value.slice(6, 8);
		const h = value.slice(9, 11);
		const mi = value.slice(11, 13);
		const s = value.slice(13, 15);
		// Interpret using tzid if present (best-effort: just use JS Date)
		const tzSuffix = tzid ? ` (${tzid})` : "";
		const parsed = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${tzSuffix ? "" : "Z"}`);
		return isNaN(parsed.getTime()) ? null : parsed.toISOString();
	}
	// DATE only: 20240115
	if (/^\d{8}$/.test(value)) {
		const y = value.slice(0, 4);
		const mo = value.slice(4, 6);
		const d = value.slice(6, 8);
		return new Date(`${y}-${mo}-${d}T00:00:00Z`).toISOString();
	}
	return null;
}

/** Decode iCal property parameter map from a property line. */
function parseIcalProperty(line: string): { name: string; params: Record<string, string>; value: string } {
	const colonIdx = line.indexOf(":");
	if (colonIdx < 0) return { name: line, params: {}, value: "" };

	const nameAndParams = line.slice(0, colonIdx);
	const value = line.slice(colonIdx + 1);

	const parts = nameAndParams.split(";");
	const name = (parts[0] ?? "").toUpperCase();
	const params: Record<string, string> = {};
	for (let i = 1; i < parts.length; i++) {
		const eq = parts[i]?.indexOf("=") ?? -1;
		if (eq >= 0) {
			const k = parts[i]!.slice(0, eq).toUpperCase();
			const v = parts[i]!.slice(eq + 1);
			params[k] = v;
		}
	}
	return { name, params, value };
}

export function parseIcs(text: string): ParsedCalendarEvent[] {
	const unfolded = unfoldIcal(text);
	const lines = unfolded.split(/\r?\n/);

	const events: ParsedCalendarEvent[] = [];
	let inEvent = false;
	let current: Partial<ParsedCalendarEvent> & { _dtStartRaw?: string; _dtEndRaw?: string; _rrule?: string | null } = {};

	for (const rawLine of lines) {
		const trimmed = rawLine.trim();
		if (trimmed === "BEGIN:VEVENT") {
			inEvent = true;
			current = {};
			continue;
		}
		if (trimmed === "END:VEVENT") {
			inEvent = false;
			if (current._dtStartRaw) {
				const startUtc = parseIcalDate(current._dtStartRaw);
				const endUtc = current._dtEndRaw
					? parseIcalDate(current._dtEndRaw)
					: startUtc
						? new Date(new Date(startUtc).getTime() + 3600_000).toISOString()
						: null;

				if (startUtc && endUtc) {
					events.push({
						eventId: current.eventId ?? nextEventId("ics"),
						calendarId: CALENDAR_ID,
						title: current.title ?? null,
						notes: current.notes ?? null,
						status: current.status ?? null,
						startUtc,
						endUtc,
						allDay: Boolean(current.allDay),
						recurrenceRule: current._rrule ?? null,
					});
				}
			}
			current = {};
			continue;
		}
		if (!inEvent) continue;

		const { name, params, value } = parseIcalProperty(trimmed);

		switch (name) {
			case "UID":
				current.eventId = value.trim();
				break;
			case "SUMMARY":
				current.title = value.trim() || null;
				break;
			case "DESCRIPTION":
				current.notes = value.replace(/\\n/g, "\n").trim() || null;
				break;
			case "STATUS":
				current.status = value.trim() || null;
				break;
			case "DTSTART": {
				current._dtStartRaw = value.trim();
				if (params["VALUE"] === "DATE") current.allDay = true;
				break;
			}
			case "DTEND": {
				current._dtEndRaw = value.trim();
				break;
			}
			case "DURATION": {
				// Only used as fallback when DTEND is absent
				if (!current._dtEndRaw && current._dtStartRaw) {
					// Parse ISO 8601 duration (e.g. PT8H, P1DT2H)
					const dur = value.trim();
					const hours =
						(parseInt((/(\d+)H/.exec(dur) ?? [])[1] ?? "0") || 0) +
						(parseInt((/(\d+)D/.exec(dur) ?? [])[1] ?? "0") || 0) * 24 +
						(parseInt((/(\d+)W/.exec(dur) ?? [])[1] ?? "0") || 0) * 168;
					const minutes = parseInt((/(\d+)M/.exec(dur) ?? [])[1] ?? "0") || 0;
					const totalMs = (hours * 60 + minutes) * MS_PER_MINUTE;
					if (totalMs > 0 && current._dtStartRaw) {
						const start = parseIcalDate(current._dtStartRaw);
						if (start) {
							current._dtEndRaw = new Date(
								new Date(start).getTime() + totalMs,
							).toISOString();
						}
					}
				}
				break;
			}
			case "RRULE":
				current._rrule = value.trim() || null;
				break;
			default:
				break;
		}
	}

	return events;
}

// ─────────────────────────────────────────────────────────────────────────────
// .csv
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the value of the first CSV column whose header matches one of the given keywords, or null. */
function findField(
	headers: string[],
	row: Record<string, string>,
	keywords: string[],
): string | null {
	for (const kw of keywords) {
		const match = headers.find((h) =>
			h.toLowerCase().includes(kw.toLowerCase()),
		);
		if (match && row[match]) return row[match]!;
	}
	return null;
}

export function parseCsv(text: string): ParsedCalendarEvent[] {
	const result = Papa.parse<Record<string, string>>(text, {
		header: true,
		skipEmptyLines: true,
	});

	if (!result.data.length) return [];

	const headers = result.meta.fields ?? [];
	const events: ParsedCalendarEvent[] = [];

	for (const row of result.data) {
		const startRaw =
			findField(headers, row, ["start", "begin", "from", "date"]) ??
			findField(headers, row, ["date"]);
		const endRaw =
			findField(headers, row, ["end", "finish", "to"]) ?? startRaw;
		const title =
			findField(headers, row, ["title", "subject", "summary", "event", "name", "shift"]) ?? null;
		const notes = findField(headers, row, ["notes", "description", "note", "detail"]) ?? null;

		const startUtc = toUtcIso(startRaw);
		if (!startUtc) continue;

		const endUtc = toUtcIso(endRaw) ?? new Date(new Date(startUtc).getTime() + ONE_HOUR_MS).toISOString();

		events.push({
			eventId: nextEventId("csv"),
			calendarId: CALENDAR_ID,
			title,
			notes,
			status: null,
			startUtc,
			endUtc,
			allDay: false,
			recurrenceRule: null,
		});
	}

	return events;
}

// ─────────────────────────────────────────────────────────────────────────────
// .txt  (plain text – regex-based extraction)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Common date patterns (regex capture groups: year?, month, day)
 * and time patterns (hour, minute).
 */
const DATE_PATTERNS: RegExp[] = [
	// ISO-style: 2024-01-15 or 2024/01/15
	/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,
	// UK/EU: 15/01/2024 or 15-01-2024
	/(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})/,
	// US: 01/15/2024
	/(\d{1,2})\/(\d{1,2})\/(\d{4})/,
	// Long: 15 January 2024, January 15 2024
	/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
	/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})[,\s]+(\d{4})/i,
];

const MONTH_NAMES: Record<string, number> = {
	january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
	july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

const TIME_PATTERN = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i;

function parseTextDate(str: string): Date | null {
	for (const pattern of DATE_PATTERNS) {
		const m = pattern.exec(str);
		if (!m) continue;

		let year: number, month: number, day: number;

		if (typeof m[1] === "string" && /^[a-z]/i.test(m[1])) {
			// e.g. "January 15 2024"
			month = MONTH_NAMES[m[1].toLowerCase()] ?? 0;
			day = parseInt(m[2] ?? "0");
			year = parseInt(m[3] ?? "0");
		} else if (
			typeof m[2] === "string" &&
			/^[a-z]/i.test(m[2])
		) {
			// e.g. "15 January 2024"
			day = parseInt(m[1] ?? "0");
			month = MONTH_NAMES[m[2].toLowerCase()] ?? 0;
			year = parseInt(m[3] ?? "0");
		} else if ((m[1]?.length ?? 0) === 4) {
			// ISO style: 2024-01-15
			year = parseInt(m[1] ?? "0");
			month = parseInt(m[2] ?? "0");
			day = parseInt(m[3] ?? "0");
		} else if (parseInt(m[3] ?? "0") > 1000) {
			// Day-first: 15/01/2024
			day = parseInt(m[1] ?? "0");
			month = parseInt(m[2] ?? "0");
			year = parseInt(m[3] ?? "0");
		} else {
			continue;
		}

		if (!year || !month || !day) continue;
		if (month < 1 || month > 12) continue;
		if (day < 1 || day > 31) continue;

		// Parse accompanying time if any
		const timeM = TIME_PATTERN.exec(str.slice((m.index ?? 0) + m[0].length));
		let hour = 0;
		let minute = 0;
		if (timeM) {
			hour = parseInt(timeM[1] ?? "0");
			minute = parseInt(timeM[2] ?? "0");
			const ampm = timeM[4]?.toLowerCase();
			if (ampm === "pm" && hour < 12) hour += 12;
			if (ampm === "am" && hour === 12) hour = 0;
		}

		const d = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
		if (!isNaN(d.getTime())) return d;
	}
	return null;
}

/**
 * Parse a block of plain text looking for date/time ranges such as:
 *   Monday 15 Jan 2024 09:00–17:00
 *   2024-01-15 09:00 to 17:00
 *   15/01/2024 09:00 - 17:00 (Title text)
 */
export function parseTxt(text: string): ParsedCalendarEvent[] {
	const events: ParsedCalendarEvent[] = [];
	const lines = text.split(/\r?\n/);

	for (const rawLine of lines) {
		const line = normalise(rawLine);
		if (!line) continue;

		const startDate = parseTextDate(line);
		if (!startDate) continue;

		// Look for an end time on the same line (after a dash, "to", "–", "—")
		const endTimeMatch = /(?:[-–—]|to)\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]m)?)/i.exec(
			line.slice(line.indexOf(":") + 1),
		);

		let endDate: Date;
		if (endTimeMatch?.[1]) {
			const timeM = TIME_PATTERN.exec(endTimeMatch[1]);
			if (timeM) {
				let h = parseInt(timeM[1] ?? "0");
				const mi = parseInt(timeM[2] ?? "0");
				const ampm = timeM[4]?.toLowerCase();
				if (ampm === "pm" && h < 12) h += 12;
				if (ampm === "am" && h === 12) h = 0;
				endDate = new Date(
					Date.UTC(
						startDate.getUTCFullYear(),
						startDate.getUTCMonth(),
						startDate.getUTCDate(),
						h,
						mi,
					),
				);
			} else {
				endDate = new Date(startDate.getTime() + ONE_HOUR_MS);
			}
		} else {
			endDate = new Date(startDate.getTime() + ONE_HOUR_MS);
		}

		// Extract a title from the remainder of the line (strip dates and times)
		const stripped = DATE_PATTERNS.reduce((s, p) => s.replace(p, ""), line);
		const title = stripped
			.replace(/\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]m)?/gi, "")
			.replace(/[-–—to]+/g, " ")
			.trim() || null;

		events.push({
			eventId: nextEventId("txt"),
			calendarId: CALENDAR_ID,
			title,
			notes: null,
			status: null,
			startUtc: startDate.toISOString(),
			endUtc: endDate.toISOString(),
			allDay: false,
			recurrenceRule: null,
		});
	}

	return events;
}

// ─────────────────────────────────────────────────────────────────────────────
// .xlsx  (Excel Open XML – fflate ZIP + DOMParser)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Excel stores dates as serial numbers (days since 1899-12-30).
 * Excel incorrectly treats 1900 as a leap year: serial 60 represents the
 * fictional 1900-02-29.  For any serial > 60 we subtract 1 to account for
 * this off-by-one error and maintain compatibility with Excel date values.
 */
function excelSerialToDate(serial: number): Date {
	// Excel serial date 1 = 1900-01-01, but Excel has a leap-year bug for 1900
	// so we subtract 1 for serials > 60.
	const offsetDays = serial > 60 ? serial - 1 : serial;
	const wholeDays = Math.floor(offsetDays);
	const fractionalDay = offsetDays - wholeDays;
	const baseMs = Date.UTC(1899, 11, 30);
	const dayMs = wholeDays * 86_400_000;
	const fracMs = Math.round(fractionalDay * 86_400_000);
	return new Date(baseMs + dayMs + fracMs);
}

/** True when a value looks like an Excel date serial (positive integer or decimal). */
function isExcelDateSerial(v: number, formatCode?: string): boolean {
	if (!Number.isFinite(v) || v <= 0) return false;
	if (formatCode) {
		// Common date format codes contain 'd', 'm', 'y', 'h' etc.
		const lower = formatCode.toLowerCase();
		if (/[ymd]/.test(lower) || lower.includes("h:")) return true;
	}
	// Heuristic: serial between 1 and 73050 ≈ year 1900–2099
	return v < 73_050 && v >= 1;
}

function getXmlText(xmlDoc: Document, tagName: string): string[] {
	const nodes = xmlDoc.getElementsByTagName(tagName);
	const result: string[] = [];
	for (let i = 0; i < nodes.length; i++) {
		result.push(nodes.item(i)?.textContent ?? "");
	}
	return result;
}

export function parseXlsx(buffer: ArrayBuffer): ParsedCalendarEvent[] {
	let files: ReturnType<typeof unzipSync>;
	try {
		files = unzipSync(new Uint8Array(buffer));
	} catch {
		throw new Error("Unable to read .xlsx file: it may be corrupt, password-protected, or in an older Excel format (.xls is not supported — please re-save as .xlsx).");
	}

	const decoder = new TextDecoder("utf-8");

	// ── Shared strings ────────────────────────────────────────────────────────
	const sharedStrings: string[] = [];
	const ssFile = files["xl/sharedStrings.xml"];
	if (ssFile) {
		const ssXml = new DOMParser().parseFromString(
			decoder.decode(ssFile),
			"text/xml",
		);
		const siNodes = ssXml.getElementsByTagName("si");
		for (let i = 0; i < siNodes.length; i++) {
			sharedStrings.push(siNodes.item(i)?.textContent ?? "");
		}
	}

	// ── Number formats (for date detection) ──────────────────────────────────
	const numFmtById: Record<number, string> = {};
	const stylesFile = files["xl/styles.xml"];
	if (stylesFile) {
		const stylesXml = new DOMParser().parseFromString(
			decoder.decode(stylesFile),
			"text/xml",
		);
		const numFmtNodes = stylesXml.getElementsByTagName("numFmt");
		for (let i = 0; i < numFmtNodes.length; i++) {
			const node = numFmtNodes.item(i)!;
			const id = parseInt(node.getAttribute("numFmtId") ?? "-1");
			const code = node.getAttribute("formatCode") ?? "";
			if (id >= 0) numFmtById[id] = code;
		}
		// Built-in Excel date format IDs: 14–22, 164+
		const BUILTIN_DATE_IDS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22]);
		const xfNodes = stylesXml.getElementsByTagName("xf");
		for (let i = 0; i < xfNodes.length; i++) {
			const node = xfNodes.item(i)!;
			const fmtId = parseInt(node.getAttribute("numFmtId") ?? "0");
			if (BUILTIN_DATE_IDS.has(fmtId) && !numFmtById[fmtId]) {
				numFmtById[fmtId] = "date";
			}
		}
	}

	// ── Find worksheets ──────────────────────────────────────────────────────
	const worksheetFiles = Object.keys(files).filter(
		(k) => k.startsWith("xl/worksheets/sheet") && k.endsWith(".xml"),
	);
	worksheetFiles.sort(); // sheet1.xml first

	const events: ParsedCalendarEvent[] = [];

	for (const wsPath of worksheetFiles) {
		const wsXml = new DOMParser().parseFromString(
			decoder.decode(files[wsPath]!),
			"text/xml",
		);

		const rows = wsXml.getElementsByTagName("row");

		// Read header row (first row) to map column letters to field names
		const headerMap: Record<string, string> = {};
		let headerRead = false;

		for (let ri = 0; ri < rows.length; ri++) {
			const row = rows.item(ri)!;
			const cells = row.getElementsByTagName("c");

			if (!headerRead) {
				headerRead = true;
				for (let ci = 0; ci < cells.length; ci++) {
					const cell = cells.item(ci)!;
					const colRef = (cell.getAttribute("r") ?? "").replace(/\d/g, "");
					const t = cell.getAttribute("t");
					const vNode = cell.getElementsByTagName("v").item(0);
					let val = "";
					if (t === "s") {
						val = sharedStrings[parseInt(vNode?.textContent ?? "0")] ?? "";
					} else {
						val = vNode?.textContent ?? "";
					}
					headerMap[colRef] = val.toLowerCase().trim();
				}
				continue;
			}

			// Data rows
			const rowData: Record<string, { raw: string; isShared: boolean; numFmtId?: number }> = {};
			for (let ci = 0; ci < cells.length; ci++) {
				const cell = cells.item(ci)!;
				const colRef = (cell.getAttribute("r") ?? "").replace(/\d/g, "");
				const t = cell.getAttribute("t");
				const s = parseInt(cell.getAttribute("s") ?? "-1");
				const vNode = cell.getElementsByTagName("v").item(0);
				const rawVal = vNode?.textContent ?? "";
				rowData[colRef] = { raw: rawVal, isShared: t === "s", numFmtId: s >= 0 ? s : undefined };
			}

			// Resolve cell values
			function cellValue(col: string): string {
				const d = rowData[col];
				if (!d) return "";
				if (d.isShared) return sharedStrings[parseInt(d.raw)] ?? "";
				return d.raw;
			}

			// Find columns by header name
			function findCol(keywords: string[]): string | null {
				for (const [col, hdr] of Object.entries(headerMap)) {
					if (keywords.some((kw) => hdr.includes(kw))) return col;
				}
				return null;
			}

			const startCol = findCol(["start", "begin", "from", "date"]);
			const endCol = findCol(["end", "finish", "to"]);
			const titleCol = findCol(["title", "subject", "summary", "event", "name", "shift"]);
			const notesCol = findCol(["notes", "description", "note"]);

			const startRaw = startCol ? cellValue(startCol) : null;
			if (!startRaw) continue;

			// Detect Excel date serial
			const startNum = parseFloat(startRaw);
			let startUtc: string | null = null;

			const startFmtId = startCol ? (rowData[startCol]?.numFmtId ?? -1) : -1;
			const startFmtCode = startFmtId >= 0 ? (numFmtById[startFmtId] ?? "") : "";

			if (!isNaN(startNum) && isExcelDateSerial(startNum, startFmtCode)) {
				startUtc = excelSerialToDate(startNum).toISOString();
			} else {
				startUtc = toUtcIso(startRaw);
			}
			if (!startUtc) continue;

			const endRaw = endCol ? cellValue(endCol) : null;
			let endUtc: string | null = null;
			if (endRaw) {
				const endNum = parseFloat(endRaw);
				const endFmtId = endCol ? (rowData[endCol]?.numFmtId ?? -1) : -1;
				const endFmtCode = endFmtId >= 0 ? (numFmtById[endFmtId] ?? "") : "";
				if (!isNaN(endNum) && isExcelDateSerial(endNum, endFmtCode)) {
					endUtc = excelSerialToDate(endNum).toISOString();
				} else {
					endUtc = toUtcIso(endRaw);
				}
			}
			endUtc ??= new Date(new Date(startUtc).getTime() + ONE_HOUR_MS).toISOString();

			events.push({
				eventId: nextEventId("xlsx"),
				calendarId: CALENDAR_ID,
				title: titleCol ? cellValue(titleCol) || null : null,
				notes: notesCol ? cellValue(notesCol) || null : null,
				status: null,
				startUtc,
				endUtc,
				allDay: false,
				recurrenceRule: null,
			});
		}
	}

	return events;
}

// ─────────────────────────────────────────────────────────────────────────────
// .pdf  (basic text-stream extraction – digitally created PDFs only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts visible text strings from a PDF binary using a simple regex over
 * PDF content-stream operators.  Works for most digitally-created PDFs; will
 * not work for scanned / image-only PDFs.
 */
function extractPdfText(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	const decoder = new TextDecoder("latin1");
	const raw = decoder.decode(bytes);

	const lines: string[] = [];

	// Match parenthesised string literals followed by Tj or TJ operators
	const re = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|'|")/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(raw)) !== null) {
		const decoded = (m[1] ?? "")
			.replace(/\\n/g, "\n")
			.replace(/\\r/g, "\r")
			.replace(/\\t/g, "\t")
			.replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
			.replace(/\\(.)/g, "$1");
		lines.push(decoded);
	}

	// Also handle TJ arrays: [(text) 10 (more text)] TJ
	const tjRe = /\[([^\]]+)\]\s*TJ/g;
	while ((m = tjRe.exec(raw)) !== null) {
		const inner = m[1] ?? "";
		const pieces: string[] = [];
		const pRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
		let pm: RegExpExecArray | null;
		while ((pm = pRe.exec(inner)) !== null) {
			pieces.push(
				(pm[1] ?? "")
					.replace(/\\n/g, "\n")
					.replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
					.replace(/\\(.)/g, "$1"),
			);
		}
		if (pieces.length) lines.push(pieces.join(""));
	}

	return lines.join("\n");
}

export function parsePdf(buffer: ArrayBuffer): ParsedCalendarEvent[] {
	const text = extractPdfText(buffer);
	return parseTxt(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────────────

export type SupportedFileExtension = "ics" | "csv" | "txt" | "xlsx" | "pdf";

export function getSupportedExtensions(): SupportedFileExtension[] {
	return ["ics", "csv", "txt", "xlsx", "pdf"];
}

export function getAcceptAttribute(): string {
	return ".ics,.csv,.txt,.xlsx,.pdf,text/calendar,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,application/pdf";
}

/**
 * Read a browser File object and return the parsed calendar events.
 * Throws with a user-friendly message on parse failure.
 */
export async function parseFile(file: File): Promise<ParsedCalendarEvent[]> {
	const ext = file.name.split(".").pop()?.toLowerCase() as SupportedFileExtension | undefined;

	if (!ext) {
		throw new Error(
			"Unable to detect file type. Please use a .ics, .csv, .txt, .xlsx, or .pdf file.",
		);
	}

	if (ext === "xlsx") {
		const buffer = await file.arrayBuffer();
		return parseXlsx(buffer);
	}

	if (ext === "pdf") {
		const buffer = await file.arrayBuffer();
		return parsePdf(buffer);
	}

	const text = await file.text();

	switch (ext) {
		case "ics":
			return parseIcs(text);
		case "csv":
			return parseCsv(text);
		case "txt":
			return parseTxt(text);
		default:
			throw new Error(
				`Unsupported file type ".${ext}". Supported formats: ${getSupportedExtensions().join(", ")}.`,
			);
	}
}
