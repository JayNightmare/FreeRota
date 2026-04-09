import { DateTime } from 'luxon';
import Tesseract from 'tesseract.js';
import { AppError } from '../utils/errors.js';
import { rotaService, type RotaInput } from './rotaService.js';

interface ParsedImportEntry {
    type: 'WORK' | 'FREE';
    startUtc: string;
    endUtc: string;
    note: string;
}

interface ParsedTimeRange {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
}

export interface RotaImportPreview {
    extractedText: string;
    entries: ParsedImportEntry[];
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const weekdayToIndex: Record<string, number> = {
    monday: 0,
    mon: 0,
    tuesday: 1,
    tue: 1,
    tues: 1,
    wednesday: 2,
    wed: 2,
    thursday: 3,
    thu: 3,
    thur: 3,
    thurs: 3,
    friday: 4,
    fri: 4,
    saturday: 5,
    sat: 5,
    sunday: 6,
    sun: 6
};

const freeKeywords = ['off', 'free', 'holiday', 'leave', 'vacation', 'pto'];

function decodeImageBase64(imageBase64: string): Buffer {
    const normalized = imageBase64.includes(',') ? imageBase64.split(',').pop() ?? '' : imageBase64;
    const buffer = Buffer.from(normalized, 'base64');

    if (!buffer.length) {
        throw new AppError('Imported screenshot is empty or unreadable', 'BAD_USER_INPUT', 400);
    }

    if (buffer.length > MAX_IMAGE_BYTES) {
        throw new AppError('Screenshot is too large. Please choose an image under 8MB.', 'BAD_USER_INPUT', 400);
    }

    return buffer;
}

function parseClockValue(hoursRaw: string, minutesRaw: string | undefined, meridiem: string | undefined): { hour: number; minute: number } {
    let hour = Number(hoursRaw);
    const minute = Number(minutesRaw ?? '0');

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
        throw new Error('Invalid time component');
    }

    if (meridiem) {
        const normalizedMeridiem = meridiem.toLowerCase();
        if (normalizedMeridiem === 'pm' && hour < 12) {
            hour += 12;
        }
        if (normalizedMeridiem === 'am' && hour === 12) {
            hour = 0;
        }
    }

    return { hour, minute };
}

function parseTimeRanges(line: string): ParsedTimeRange[] {
    const ranges: Array<ParsedTimeRange & { index: number }> = [];
    const rangePattern = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi;
    const compactPattern = /\b(\d{3,4})\s*(?:-|–|—|to)\s*(\d{3,4})\b/g;

    for (const match of line.matchAll(rangePattern)) {
        const startHourRaw = match[1];
        const endHourRaw = match[4];

        if (!startHourRaw || !endHourRaw) {
            continue;
        }

        const inferredMeridiem = match[3] ?? match[6] ?? undefined;
        const start = parseClockValue(startHourRaw, match[2], match[3] ?? inferredMeridiem);
        const end = parseClockValue(endHourRaw, match[5], match[6] ?? inferredMeridiem);

        ranges.push({
            startHour: start.hour,
            startMinute: start.minute,
            endHour: end.hour,
            endMinute: end.minute,
            index: match.index ?? 0
        });
    }

    const parseCompact = (value: string): { hour: number; minute: number } => {
        const normalized = value.padStart(4, '0');
        return {
            hour: Number(normalized.slice(0, 2)),
            minute: Number(normalized.slice(2, 4))
        };
    };

    for (const match of line.matchAll(compactPattern)) {
        const startRaw = match[1];
        const endRaw = match[2];
        if (!startRaw || !endRaw) {
            continue;
        }

        const start = parseCompact(startRaw);
        const end = parseCompact(endRaw);

        ranges.push({
            startHour: start.hour,
            startMinute: start.minute,
            endHour: end.hour,
            endMinute: end.minute,
            index: match.index ?? 0
        });
    }

    const uniqueBySignature = new Map<string, ParsedTimeRange & { index: number }>();
    for (const range of ranges) {
        const signature = `${range.startHour}:${range.startMinute}-${range.endHour}:${range.endMinute}-${range.index}`;
        if (!uniqueBySignature.has(signature)) {
            uniqueBySignature.set(signature, range);
        }
    }

    return Array.from(uniqueBySignature.values())
        .sort((a, b) => a.index - b.index)
        .map(({ index: _index, ...range }) => range);
}

function getWeekStart(referenceDate: DateTime): DateTime {
    const weekDayIndex = referenceDate.weekday - 1; // Monday=1 in Luxon
    return referenceDate.minus({ days: weekDayIndex }).startOf('day');
}

function resolveDateForLine(line: string, referenceDate: DateTime): DateTime | null {
    const zone = referenceDate.zoneName ?? 'UTC';

    const isoMatch = line.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
    if (isoMatch) {
        const date = DateTime.fromObject(
            {
                year: Number(isoMatch[1]),
                month: Number(isoMatch[2]),
                day: Number(isoMatch[3])
            },
            { zone }
        );
        return date.isValid ? date.startOf('day') : null;
    }

    const slashMatch = line.match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/);
    if (slashMatch) {
        const day = Number(slashMatch[1]);
        const month = Number(slashMatch[2]);
        const yearRaw = slashMatch[3];
        const year = yearRaw ? (yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw)) : referenceDate.year;

        const date = DateTime.fromObject(
            { year, month, day },
            { zone }
        );

        return date.isValid ? date.startOf('day') : null;
    }

    const dayMatch = line.match(/\b(mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/i);
    if (!dayMatch) {
        return null;
    }

    const key = dayMatch[1].toLowerCase();
    const index = weekdayToIndex[key];
    if (index === undefined) {
        return null;
    }

    const weekStart = getWeekStart(referenceDate);
    return weekStart.plus({ days: index }).startOf('day');
}

function parseEntries(text: string, timezone: string, referenceDateIso?: string): ParsedImportEntry[] {
    const referenceDate = referenceDateIso
        ? DateTime.fromISO(referenceDateIso, { zone: timezone })
        : DateTime.now().setZone(timezone);

    const effectiveReferenceDate = referenceDate.isValid ? referenceDate : DateTime.now().setZone(timezone);

    const lines = text
        .split(/\r?\n/)
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter((line) => line.length > 0);

    const parsed: ParsedImportEntry[] = [];

    let activeDate: DateTime | null = null;

    for (const line of lines) {
        const date = resolveDateForLine(line, effectiveReferenceDate);
        if (date) {
            activeDate = date;
        }

        const ranges = parseTimeRanges(line);
        if (!activeDate || ranges.length === 0) {
            continue;
        }

        const lowerLine = line.toLowerCase();
        const type: 'WORK' | 'FREE' = freeKeywords.some((keyword) => lowerLine.includes(keyword))
            ? 'FREE'
            : 'WORK';

        for (const range of ranges) {
            let start = activeDate.set({
                hour: range.startHour,
                minute: range.startMinute,
                second: 0,
                millisecond: 0
            });

            let end = activeDate.set({
                hour: range.endHour,
                minute: range.endMinute,
                second: 0,
                millisecond: 0
            });

            if (!start.isValid || !end.isValid) {
                continue;
            }

            if (end <= start) {
                end = end.plus({ days: 1 });
            }

            parsed.push({
                type,
                startUtc: start.toUTC().toISO() ?? '',
                endUtc: end.toUTC().toISO() ?? '',
                note: `Imported: ${line}`
            });
        }
    }

    return parsed.filter((entry) => entry.startUtc && entry.endUtc);
}

class RotaImportService {
    private async extractTextFromScreenshot(imageBase64: string): Promise<string> {
        const image = decodeImageBase64(imageBase64);
        try {
            const result = await Tesseract.recognize(image, 'eng');
            return result.data.text ?? '';
        } catch {
            throw new AppError('Failed to read text from screenshot. Try a clearer image.', 'BAD_USER_INPUT', 400);
        }
    }

    async previewFromScreenshot(input: {
        timezone: string;
        imageBase64: string;
        referenceDate?: string;
    }): Promise<RotaImportPreview> {
        const extractedText = await this.extractTextFromScreenshot(input.imageBase64);
        const entries = parseEntries(extractedText, input.timezone || 'UTC', input.referenceDate);
        return { extractedText, entries };
    }

    async importFromScreenshot(input: {
        userId: string;
        timezone: string;
        imageBase64: string;
        referenceDate?: string;
    }) {
        const preview = await this.previewFromScreenshot(input);
        const entries = preview.entries;
        if (entries.length === 0) {
            throw new AppError('No valid rota rows were found. Include day/date and a time range, like "Mon 09:00-17:00".', 'BAD_USER_INPUT', 400);
        }

        const created = [];
        for (const entry of entries) {
            const createdEntry = await rotaService.createEntry(input.userId, entry as RotaInput);
            created.push(createdEntry);
        }

        return created;
    }
}

export const rotaImportService = new RotaImportService();
