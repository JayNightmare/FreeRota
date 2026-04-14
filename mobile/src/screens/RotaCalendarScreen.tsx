import { useCallback, useMemo, useState } from "react";
import {
	Alert,
	Modal,
	PanResponder,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useMutation, useQuery } from "@apollo/client";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import * as Calendar from "expo-calendar";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { ActionButton } from "../components/ActionButton";

import { DateTimePickerField } from "../components/DateTimePickerField";
import { FormField } from "../components/FormField";
import { StateNotice } from "../components/StateNotice";
import {
	CREATE_ROTA_ENTRY_MUTATION,
	DELETE_ROTA_ENTRY_MUTATION,
	IMPORT_DEVICE_CALENDAR_MUTATION,
	IMPORT_ROTA_SCREENSHOT_MUTATION,
	ME_QUERY,
	MY_ROTA_QUERY,
	MY_SHIFT_TYPES_QUERY,
	PREVIEW_DEVICE_CALENDAR_IMPORT_MUTATION,
	PREVIEW_ROTA_SCREENSHOT_MUTATION,
	UPDATE_ROTA_ENTRY_MUTATION,
} from "../graphql/operations";
import { useTheme } from "../theme/useTheme";
import {
	addLocalDays,
	formatDateTime,
	formatDayNumber,
	formatMonthLabel,
	formatWeekdayShort,
	getDurationMinutes,
	getHourInTimezone,
	getSundayWeekDates,
	getZonedDateKey,
	parseIsoDate,
	startOfSundayWeek,
} from "../utils/time";
import { toUserErrorMessage } from "../utils/errors";

interface ShiftType {
	id: string;
	name: string;
	color: string;
}

interface RotaEntry {
	id: string;
	type: "WORK" | "FREE";
	startUtc: string;
	endUtc: string;
	note?: string;
	shiftTypeId?: string | null;
	shiftTitle?: string | null;
	shiftType?: ShiftType | null;
}

interface MyRotaQuery {
	myRota: RotaEntry[];
}

interface MeQuery {
	me: {
		timezone: string;
	};
}

interface MyShiftTypesQuery {
	myShiftTypes: ShiftType[];
}

interface PreviewImportEntry {
	type: "WORK" | "FREE";
	startUtc: string;
	endUtc: string;
	note?: string;
}

interface PreviewRotaScreenshotMutation {
	previewRotaScreenshot: {
		extractedText: string;
		entries: PreviewImportEntry[];
	};
}

interface ImportRotaScreenshotMutation {
	importRotaScreenshot: RotaEntry[];
}

type CalendarDuplicateMode =
	| "SKIP_DUPLICATES"
	| "KEEP_BOTH"
	| "REPLACE_CONFLICTS";

interface DeviceCalendarEventInput {
	eventId: string;
	calendarId: string;
	title?: string | null;
	notes?: string | null;
	status?: string | null;
	startUtc: string;
	endUtc: string;
	allDay?: boolean;
	recurrenceRule?: string | null;
}

interface CalendarImportPreviewEntry {
	eventId: string;
	calendarId: string;
	title?: string | null;
	type: "WORK" | "FREE";
	startUtc: string;
	endUtc: string;
	note?: string;
	sourceType: "ONE_OFF" | "RECURRING";
	recurrenceRule?: string | null;
	isDuplicate: boolean;
	isConflict: boolean;
}

interface PreviewDeviceCalendarImportMutation {
	previewDeviceCalendarImport: {
		entries: CalendarImportPreviewEntry[];
		totalCount: number;
		duplicateCount: number;
		conflictCount: number;
		skippedCancelledCount: number;
		skippedInvalidCount: number;
	};
}

interface ImportDeviceCalendarMutation {
	importDeviceCalendar: {
		created: RotaEntry[];
		totalConsidered: number;
		createdCount: number;
		skippedDuplicates: number;
		replacedConflicts: number;
		conflictCount: number;
	};
}

type DayState = "FREE" | "BUSY" | "EARLY";
type EntryModalMode = "PRESET" | "CUSTOM";

const WEEK_SWIPE_ACTIVATION_PX = 16;
const WEEK_SWIPE_TRIGGER_PX = 48;

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
] as const;

function dayKeyToDate(dayKey: string): Date {
	const [year, month, day] = dayKey.split("-").map(Number);
	if (!year || !month || !day) {
		return new Date();
	}

	return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatDurationLabel(minutes: number): string {
	const safeMinutes =
		Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
	const hours = Math.floor(safeMinutes / 60);
	const remainingMinutes = safeMinutes % 60;
	return `${hours}h ${remainingMinutes}m`;
}

function formatTimeLabel(value: string, timezone: string): string {
	try {
		return new Intl.DateTimeFormat("en-GB", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
			timeZone: timezone,
		}).format(parseIsoDate(value));
	} catch {
		return value;
	}
}

function parseDurationHours(value: string): number | null {
	const normalized = value.trim().replace(",", ".");
	if (!normalized) {
		return null;
	}

	const parsed = Number(normalized);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return null;
	}

	return parsed;
}

function formatDurationHoursValue(hours: number): string {
	if (Number.isInteger(hours)) {
		return String(hours);
	}

	return hours.toFixed(2).replace(/\.?0+$/, "");
}

function durationHoursFromRange(startUtc: string, endUtc: string): string {
	const minutes = getDurationMinutes(startUtc, endUtc);
	if (minutes <= 0) {
		return "8";
	}

	return formatDurationHoursValue(minutes / 60);
}

function buildEndUtcFromDuration(
	startUtc: string,
	durationHours: string,
): string | null {
	const parsedDuration = parseDurationHours(durationHours);
	if (!parsedDuration) {
		return null;
	}

	const startTime = parseIsoDate(startUtc).getTime();
	if (!Number.isFinite(startTime)) {
		return null;
	}

	return new Date(
		startTime + parsedDuration * 60 * 60 * 1000,
	).toISOString();
}

function getDayState(entries: RotaEntry[], timezone: string): DayState {
	if (
		entries.some(
			(entry) =>
				getHourInTimezone(entry.endUtc, timezone) < 17,
		)
	) {
		return "EARLY";
	}
	if (entries.length > 0) {
		return "BUSY";
	}

	return "FREE";
}

function toIsoOrNull(value: Date | string | null | undefined): string | null {
	if (!value) {
		return null;
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	return parsed.toISOString();
}

function serializeRecurrenceRule(value: unknown): string | null {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed || null;
	}

	if (!value) {
		return null;
	}

	try {
		return JSON.stringify(value);
	} catch {
		return null;
	}
}

function mapCalendarEventToImportInput(
	event: Calendar.Event,
): DeviceCalendarEventInput | null {
	const eventId = event.id?.trim();
	const calendarId = event.calendarId?.trim();
	if (!eventId || !calendarId) {
		return null;
	}

	const startUtc = toIsoOrNull(event.startDate);
	if (!startUtc) {
		return null;
	}

	const endUtc =
		toIsoOrNull(event.endDate) ??
		new Date(
			new Date(startUtc).getTime() +
				(event.allDay ? 24 : 1) * 60 * 60 * 1000,
		).toISOString();

	return {
		eventId,
		calendarId,
		title: event.title ?? null,
		notes: event.notes ?? null,
		status: event.status ? String(event.status) : null,
		startUtc,
		endUtc,
		allDay: Boolean(event.allDay),
		recurrenceRule: serializeRecurrenceRule(event.recurrenceRule),
	};
}

export function RotaScreen() {
	const { theme } = useTheme();
	const [selectedDate, setSelectedDate] = useState(() => new Date());
	const [activeDayKey, setActiveDayKey] = useState(() =>
		getZonedDateKey(new Date()),
	);
	const [isMonthModalVisible, setMonthModalVisible] = useState(false);
	const [monthPickerYear, setMonthPickerYear] = useState(() =>
		new Date().getFullYear(),
	);
	const [isEntryModalVisible, setEntryModalVisible] = useState(false);
	const [entryModalMode, setEntryModalMode] =
		useState<EntryModalMode>("PRESET");
	const [editingEntryId, setEditingEntryId] = useState<string | null>(
		null,
	);
	const [entryType, setEntryType] = useState<"WORK" | "FREE">("WORK");
	const [startUtc, setStartUtc] = useState(() =>
		new Date().toISOString(),
	);
	const [durationHours, setDurationHours] = useState("8");
	const [shiftTypeId, setShiftTypeId] = useState<string | null>(null);
	const [shiftTitle, setShiftTitle] = useState("");
	const [note, setNote] = useState("");
	const [formError, setFormError] = useState<string | null>(null);
	const [importNotice, setImportNotice] = useState<string | null>(null);

	const weekStartDate = useMemo(
		() => startOfSundayWeek(selectedDate),
		[selectedDate],
	);
	const weekEndDate = useMemo(
		() => addLocalDays(weekStartDate, 7),
		[weekStartDate],
	);
	const rangeStartUtc = useMemo(
		() => weekStartDate.toISOString(),
		[weekStartDate],
	);
	const rangeEndUtc = useMemo(
		() => weekEndDate.toISOString(),
		[weekEndDate],
	);
	const presetRangeStartUtc = useMemo(
		() => addLocalDays(weekStartDate, -90).toISOString(),
		[weekStartDate],
	);
	const presetRangeEndUtc = useMemo(
		() => weekStartDate.toISOString(),
		[weekStartDate],
	);

	const { data, loading, error, refetch } = useQuery<MyRotaQuery>(
		MY_ROTA_QUERY,
		{
			variables: { rangeStartUtc, rangeEndUtc },
		},
	);
	const { data: presetData } = useQuery<MyRotaQuery>(MY_ROTA_QUERY, {
		variables: {
			rangeStartUtc: presetRangeStartUtc,
			rangeEndUtc: presetRangeEndUtc,
		},
	});
	const { data: meData } = useQuery<MeQuery>(ME_QUERY);
	const { data: shiftTypeData } =
		useQuery<MyShiftTypesQuery>(MY_SHIFT_TYPES_QUERY);

	const [createRotaEntry, { loading: createLoading }] = useMutation(
		CREATE_ROTA_ENTRY_MUTATION,
	);
	const [updateRotaEntry, { loading: updateLoading }] = useMutation(
		UPDATE_ROTA_ENTRY_MUTATION,
	);
	const [deleteRotaEntry] = useMutation(DELETE_ROTA_ENTRY_MUTATION);
	const [previewRotaScreenshot, { loading: previewLoading }] =
		useMutation<PreviewRotaScreenshotMutation>(
			PREVIEW_ROTA_SCREENSHOT_MUTATION,
		);
	const [importRotaScreenshot, { loading: importLoading }] =
		useMutation<ImportRotaScreenshotMutation>(
			IMPORT_ROTA_SCREENSHOT_MUTATION,
		);
	const [
		previewDeviceCalendarImport,
		{ loading: calendarPreviewLoading },
	] = useMutation<PreviewDeviceCalendarImportMutation>(
		PREVIEW_DEVICE_CALENDAR_IMPORT_MUTATION,
	);
	const [importDeviceCalendar, { loading: calendarImportLoading }] =
		useMutation<ImportDeviceCalendarMutation>(
			IMPORT_DEVICE_CALENDAR_MUTATION,
		);

	const timezone = meData?.me?.timezone || "UTC";
	const mutationLoading = createLoading || updateLoading;
	const weekDates = useMemo(
		() => getSundayWeekDates(weekStartDate),
		[weekStartDate],
	);

	const shiftTypeById = useMemo(() => {
		const map = new Map<string, ShiftType>();
		for (const item of shiftTypeData?.myShiftTypes ?? []) {
			map.set(item.id, item);
		}
		return map;
	}, [shiftTypeData?.myShiftTypes]);

	const entries = data?.myRota ?? [];
	const workEntries = useMemo(
		() =>
			entries
				.filter((entry) => entry.type === "WORK")
				.slice()
				.sort(
					(a, b) =>
						new Date(a.startUtc).getTime() -
						new Date(b.startUtc).getTime(),
				),
		[entries],
	);

	const entriesByDayKey = useMemo(() => {
		const map = new Map<string, RotaEntry[]>();
		for (const entry of workEntries) {
			const dayKey = getZonedDateKey(
				entry.startUtc,
				timezone,
			);
			const existing = map.get(dayKey) ?? [];
			existing.push(entry);
			map.set(dayKey, existing);
		}
		return map;
	}, [workEntries, timezone]);

	const dayStateByKey = useMemo(() => {
		const map = new Map<string, DayState>();
		for (const day of weekDates) {
			const key = getZonedDateKey(day, timezone);
			const dayEntries = entriesByDayKey.get(key) ?? [];
			map.set(key, getDayState(dayEntries, timezone));
		}
		return map;
	}, [entriesByDayKey, timezone, weekDates]);

	const totalWorkMinutes = useMemo(
		() =>
			workEntries.reduce(
				(total, entry) =>
					total +
					getDurationMinutes(
						entry.startUtc,
						entry.endUtc,
					),
				0,
			),
		[workEntries],
	);

	const previousPresets = useMemo(() => {
		const source = (presetData?.myRota ?? []).filter(
			(entry) => entry.type === "WORK",
		);
		const sorted = source
			.slice()
			.sort(
				(a, b) =>
					new Date(b.startUtc).getTime() -
					new Date(a.startUtc).getTime(),
			);

		const unique: RotaEntry[] = [];
		const seen = new Set<string>();
		for (const entry of sorted) {
			const start = parseIsoDate(entry.startUtc);
			const end = parseIsoDate(entry.endUtc);
			const key = [
				entry.shiftTypeId ?? "none",
				entry.shiftTitle ?? "",
				`${start.getHours()}:${start.getMinutes()}`,
				`${end.getHours()}:${end.getMinutes()}`,
			].join("|");
			if (seen.has(key)) {
				continue;
			}
			seen.add(key);
			unique.push(entry);
			if (unique.length >= 8) {
				break;
			}
		}

		return unique;
	}, [presetData?.myRota]);

	const computedEndUtc = useMemo(
		() => buildEndUtcFromDuration(startUtc, durationHours),
		[startUtc, durationHours],
	);

	const styles = useMemo(
		() =>
			StyleSheet.create({
				root: {
					flex: 1,
					gap: theme.spacing.md,
				},
				scroll: {
					gap: theme.spacing.lg,
					paddingBottom: theme.spacing.md,
				},
				card: {
					backgroundColor:
						theme.colors.surfaceMuted,
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.lg,
					padding: theme.spacing.lg,
					gap: theme.spacing.md,
					...theme.shadowSm,
				},
				monthRow: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					gap: theme.spacing.sm,
				},
				monthButton: {
					flexDirection: "row",
					alignItems: "center",
					gap: theme.spacing.xs,
					paddingHorizontal: theme.spacing.md,
					paddingVertical: theme.spacing.sm,
					borderRadius: theme.radius.md,
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					backgroundColor:
						theme.colors.surfaceElevated,
					...theme.shadowSm,
				},
				monthButtonCurrent: {
					borderColor: theme.colors.accent,
					backgroundColor:
						theme.colors.surfaceElevated,
				},
				monthButtonText: {
					fontSize: theme.typography.body,
					fontWeight: "900",
					textTransform: "uppercase",
					color: theme.colors.textPrimary,
				},
				todayRow: {
					flexDirection: "row",
					justifyContent: "flex-end",
				},
				todayButton: {
					paddingHorizontal: theme.spacing.md,
					paddingVertical: theme.spacing.sm,
					borderRadius: theme.radius.md,
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					backgroundColor:
						theme.colors.surfaceElevated,
					...theme.shadowSm,
				},
				todayButtonLabel: {
					fontSize: theme.typography.caption,
					fontWeight: "900",
					textTransform: "uppercase",
					color: theme.colors.textPrimary,
				},
				weekRow: {
					alignItems: "stretch",
				},
				arrowButton: {
					width: 34,
					height: 34,
					borderRadius: theme.radius.md,
					alignItems: "center",
					justifyContent: "center",
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					backgroundColor:
						theme.colors.surfaceElevated,
					...theme.shadowSm,
				},
				daysRow: {
					width: "100%",
					flexDirection: "row",
					gap: theme.spacing.xs,
				},
				dayCell: {
					flex: 1,
					minWidth: 0,
					minHeight: 60,
					borderRadius: theme.radius.md,
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					paddingVertical: theme.spacing.sm,
					paddingHorizontal: 1,
					alignItems: "center",
					justifyContent: "center",
					gap: 2,
					backgroundColor: theme.colors.surface,
				},
				dayCellToday: {
					backgroundColor:
						theme.colors
							.accentTodayBackground,
					borderColor: theme.colors.accent,
				},
				dayCellActive: {
					borderColor: theme.colors.active,
				},
				dayLabel: {
					fontSize: theme.typography.tiny,
					fontWeight: "900",
					textTransform: "uppercase",
					letterSpacing: 0.4,
					color: theme.colors.textSecondary,
				},
				dayLabelTinted: {
					color: theme.colors.textPrimary,
				},
				dayLabelToday: {
					color: theme.colors.onAccent,
				},
				dayDate: {
					fontSize: theme.typography.caption,
					fontWeight: "900",
					color: theme.colors.textPrimary,
				},
				dayDateTinted: {
					color: theme.colors.textPrimary,
				},
				dayDateToday: {
					color: theme.colors.onAccent,
				},
				weekHint: {
					marginTop: theme.spacing.xs,
					fontSize: theme.typography.tiny,
					fontWeight: "700",
					textAlign: "center",
					color: theme.colors.textMuted,
				},
				totalHoursRow: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingHorizontal: theme.spacing.sm,
					paddingVertical: theme.spacing.sm,
					borderRadius: theme.radius.md,
					backgroundColor:
						theme.colors.surfaceMuted,
				},
				totalHoursLabel: {
					fontSize: theme.typography.caption,
					fontWeight: "900",
					textTransform: "uppercase",
					letterSpacing: 1,
					color: theme.colors.textMuted,
				},
				totalHoursValue: {
					fontSize: theme.typography.body,
					fontWeight: "900",
					color: theme.colors.accent,
				},
				busyTitle: {
					fontSize: theme.typography.heading,
					fontWeight: "900",
					textTransform: "uppercase",
					letterSpacing: -1,
					color: theme.colors.textPrimary,
				},
				shiftCard: {
					flexDirection: "row",
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.md,
					backgroundColor:
						theme.colors.surfaceMuted,
					overflow: "hidden",
					...theme.shadowSm,
				},
				shiftAccent: {
					width: 8,
				},
				shiftMain: {
					flex: 1,
					padding: theme.spacing.md,
					gap: theme.spacing.xs,
				},
				shiftTitle: {
					fontSize: theme.typography.body,
					fontWeight: "900",
					textTransform: "uppercase",
					color: theme.colors.accent,
				},
				shiftMeta: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					textTransform: "uppercase",
					color: theme.colors.textSecondary,
				},
				binButton: {
					width: 44,
					alignItems: "center",
					justifyContent: "center",
					borderLeftWidth: theme.borderWidth,
					borderColor: theme.colors.border,
				},
				bottomRow: {
					flexDirection: "row",
					justifyContent: "center",
					flex: 0,
					gap: theme.spacing.sm,
					width: "100%",
					marginBottom: 55,
				},
				modalBackdrop: {
					flex: 1,
					backgroundColor:
						theme.colors.background + "CC",
					justifyContent: "flex-end",
				},
				modalSheet: {
					backgroundColor: theme.colors.surface,
					borderTopLeftRadius: theme.radius.lg,
					borderTopRightRadius: theme.radius.lg,
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					maxHeight: "88%",
					paddingHorizontal: theme.spacing.lg,
					paddingTop: theme.spacing.lg,
					paddingBottom: theme.spacing.xxl,
					gap: theme.spacing.md,
				},
				modalHeader: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				modalTitle: {
					fontSize: theme.typography.heading,
					fontWeight: "900",
					textTransform: "uppercase",
					color: theme.colors.textPrimary,
				},
				modalSubtext: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					textTransform: "uppercase",
					color: theme.colors.textMuted,
				},
				modeRow: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
				durationAdjustRow: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
				durationHint: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					color: theme.colors.textSecondary,
				},
				presetRow: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
				presetChip: {
					paddingHorizontal: theme.spacing.md,
					paddingVertical: theme.spacing.sm,
					borderRadius: theme.radius.md,
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					backgroundColor:
						theme.colors.surfaceElevated,
					...theme.shadowSm,
				},
				presetLabel: {
					fontSize: theme.typography.caption,
					fontWeight: "900",
					textTransform: "uppercase",
					color: theme.colors.textPrimary,
				},
				chipSectionLabel: {
					fontSize: theme.typography.caption,
					fontWeight: "900",
					textTransform: "uppercase",
					letterSpacing: 1,
					color: theme.colors.textMuted,
				},
				shiftTypeChipRow: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
				shiftTypeChip: {
					flexDirection: "row",
					alignItems: "center",
					gap: theme.spacing.xs,
					paddingHorizontal: theme.spacing.md,
					paddingVertical: theme.spacing.sm,
					borderRadius: theme.radius.md,
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					backgroundColor:
						theme.colors.surfaceElevated,
					...theme.shadowSm,
				},
				shiftTypeChipActive: {
					borderColor: theme.colors.accent,
				},
				shiftTypeDot: {
					width: 10,
					height: 10,
					borderRadius: theme.radius.pill,
				},
				shiftTypeChipLabel: {
					fontSize: theme.typography.caption,
					fontWeight: "900",
					textTransform: "uppercase",
					color: theme.colors.textPrimary,
				},
				monthModalCard: {
					marginHorizontal: theme.spacing.xl,
					marginBottom: theme.spacing.xl,
					padding: theme.spacing.lg,
					gap: theme.spacing.md,
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.lg,
					backgroundColor: theme.colors.surface,
					...theme.shadowSm,
				},
				monthHeader: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				monthYearLabel: {
					fontSize: theme.typography.body,
					fontWeight: "900",
					textTransform: "uppercase",
					color: theme.colors.textPrimary,
				},
				monthGrid: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: theme.spacing.sm,
				},
				monthCell: {
					width: "31%",
					paddingVertical: theme.spacing.sm,
					alignItems: "center",
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.md,
					backgroundColor:
						theme.colors.surfaceElevated,
				},
				monthCellCurrent: {
					borderColor: theme.colors.accent,
					backgroundColor:
						theme.colors.surfaceElevated,
				},
				monthCellText: {
					fontSize: theme.typography.caption,
					fontWeight: "900",
					textTransform: "uppercase",
					color: theme.colors.textPrimary,
				},
			}),
		[theme],
	);

	const resetEntryFormForDay = (dayKey: string): void => {
		const targetDate = dayKeyToDate(dayKey);
		const defaultStart = new Date(targetDate);
		defaultStart.setHours(9, 0, 0, 0);

		setEditingEntryId(null);
		setEntryType("WORK");
		setStartUtc(defaultStart.toISOString());
		setDurationHours("8");
		setShiftTypeId(null);
		setShiftTitle("");
		setNote("");
		setFormError(null);
	};

	const openCreateModal = (dayKey: string): void => {
		setActiveDayKey(dayKey);
		setSelectedDate(dayKeyToDate(dayKey));
		setEntryModalMode("PRESET");
		resetEntryFormForDay(dayKey);
		setEntryModalVisible(true);
	};

	const openEditModal = (entry: RotaEntry): void => {
		const dayKey = getZonedDateKey(entry.startUtc, timezone);
		setActiveDayKey(dayKey);
		setSelectedDate(dayKeyToDate(dayKey));
		setEntryModalMode("CUSTOM");
		setEditingEntryId(entry.id);
		setEntryType(entry.type);
		setStartUtc(entry.startUtc);
		setDurationHours(
			durationHoursFromRange(entry.startUtc, entry.endUtc),
		);
		setShiftTypeId(entry.shiftTypeId ?? null);
		setShiftTitle(entry.shiftTitle ?? entry.shiftType?.name ?? "");
		setNote(entry.note ?? "");
		setFormError(null);
		setEntryModalVisible(true);
	};

	const closeEntryModal = (): void => {
		setEntryModalVisible(false);
		setFormError(null);
	};

	const applyPreset = (preset: RotaEntry): void => {
		const targetDate = dayKeyToDate(activeDayKey);
		const presetStart = parseIsoDate(preset.startUtc);

		const nextStart = new Date(targetDate);
		nextStart.setHours(
			presetStart.getHours(),
			presetStart.getMinutes(),
			0,
			0,
		);

		setEntryType(preset.type);
		setStartUtc(nextStart.toISOString());
		setDurationHours(
			durationHoursFromRange(preset.startUtc, preset.endUtc),
		);
		setShiftTypeId(
			preset.shiftTypeId ?? preset.shiftType?.id ?? null,
		);
		setShiftTitle(
			preset.shiftTitle ?? preset.shiftType?.name ?? "",
		);
		setEntryModalMode("CUSTOM");
	};

	const submitEntry = async (): Promise<void> => {
		setFormError(null);

		if (!startUtc) {
			setFormError("Start time is required.");
			return;
		}

		const resolvedEndUtc = buildEndUtcFromDuration(
			startUtc,
			durationHours,
		);
		if (!resolvedEndUtc) {
			setFormError("Duration must be greater than 0 hours.");
			return;
		}

		if (new Date(startUtc) >= new Date(resolvedEndUtc)) {
			setFormError(
				"Duration must result in an end time after start.",
			);
			return;
		}

		const normalizedTitle = shiftTitle.trim();
		const input = {
			type: entryType,
			startUtc,
			endUtc: resolvedEndUtc,
			note: note.trim(),
			shiftTypeId,
			shiftTitle: normalizedTitle ? normalizedTitle : null,
		};

		try {
			if (editingEntryId) {
				await updateRotaEntry({
					variables: {
						id: editingEntryId,
						input,
					},
				});
			} else {
				await createRotaEntry({
					variables: {
						input,
					},
				});
			}

			setEntryModalVisible(false);
			await refetch();
		} catch (mutationError) {
			setFormError(
				toUserErrorMessage(
					mutationError,
					"Unable to save rota entry.",
				),
			);
		}
	};

	const removeEntry = async (id: string): Promise<void> => {
		try {
			await deleteRotaEntry({ variables: { id } });
			if (editingEntryId === id) {
				closeEntryModal();
			}
			await refetch();
		} catch (mutationError) {
			setFormError(
				toUserErrorMessage(
					mutationError,
					"Unable to delete rota entry.",
				),
			);
		}
	};

	const confirmImportFromPreview = async (
		imageBase64: string,
	): Promise<void> => {
		try {
			const response = await importRotaScreenshot({
				variables: {
					imageBase64,
					referenceDate: rangeStartUtc,
				},
			});

			const importedCount =
				response.data?.importRotaScreenshot?.length ??
				0;
			await refetch();
			setImportNotice(
				`Imported ${importedCount} rota entr${
					importedCount === 1 ? "y" : "ies"
				}.`,
			);
		} catch (importError) {
			setFormError(
				toUserErrorMessage(
					importError,
					"Unable to import screenshot.",
				),
			);
		}
	};

	const importFromScreenshot = async (): Promise<void> => {
		setFormError(null);
		setImportNotice(null);

		const permission =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) {
			setFormError(
				"Photo permission is required to import a screenshot.",
			);
			return;
		}

		const pickerResult = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsMultipleSelection: false,
			quality: 1,
			base64: true,
		});

		if (pickerResult.canceled) {
			return;
		}

		const selectedAsset = pickerResult.assets[0];
		if (!selectedAsset?.base64) {
			setFormError(
				"Unable to read image data. Try selecting another screenshot.",
			);
			return;
		}

		const imageBase64 = selectedAsset.base64;

		try {
			const previewResponse = await previewRotaScreenshot({
				variables: {
					imageBase64,
					referenceDate: rangeStartUtc,
				},
			});

			const preview =
				previewResponse.data?.previewRotaScreenshot;
			const previewEntries = preview?.entries ?? [];

			if (previewEntries.length === 0) {
				const extractedSnippet = (
					preview?.extractedText ?? ""
				)
					.replace(/\s+/g, " ")
					.trim()
					.slice(0, 220);

				Alert.alert(
					"No shifts detected",
					extractedSnippet
						? `We couldn't find any valid day/time ranges. OCR saw: \"${extractedSnippet}\"`
						: "We couldn't find any valid day/time ranges in this screenshot.",
				);
				return;
			}

			const entryPreviewLines = previewEntries
				.slice(0, 6)
				.map(
					(entry, index) =>
						`${index + 1}. ${formatDateTime(
							entry.startUtc,
							timezone,
						)} - ${formatDateTime(
							entry.endUtc,
							timezone,
						)} (${entry.type})`,
				)
				.join("\n");

			const moreCount = previewEntries.length - 6;
			const previewMessage =
				moreCount > 0
					? `${entryPreviewLines}\n...and ${moreCount} more`
					: entryPreviewLines;

			Alert.alert("Review extracted shifts", previewMessage, [
				{
					text: "Cancel",
					style: "cancel",
				},
				{
					text: "Import",
					onPress: () => {
						void confirmImportFromPreview(
							imageBase64,
						);
					},
				},
			]);
		} catch (importError) {
			setFormError(
				toUserErrorMessage(
					importError,
					"Unable to import screenshot.",
				),
			);
		}
	};

	const confirmImportFromDeviceCalendar = async (
		events: DeviceCalendarEventInput[],
		duplicateMode: CalendarDuplicateMode,
	): Promise<void> => {
		try {
			const response = await importDeviceCalendar({
				variables: {
					events,
					duplicateMode,
				},
			});

			const result = response.data?.importDeviceCalendar;
			if (!result) {
				setFormError(
					"Unable to import calendar events.",
				);
				return;
			}

			await refetch();
			setImportNotice(
				`Calendar import complete: ${result.createdCount}/${result.totalConsidered} created, ${result.skippedDuplicates} duplicates skipped${
					result.replacedConflicts > 0
						? `, ${result.replacedConflicts} existing conflict${result.replacedConflicts === 1 ? "" : "s"} replaced`
						: ""
				}.`,
			);
		} catch (importError) {
			setFormError(
				toUserErrorMessage(
					importError,
					"Unable to import calendar events.",
				),
			);
		}
	};

	const importFromDeviceCalendar = async (): Promise<void> => {
		setFormError(null);
		setImportNotice(null);

		const permission =
			await Calendar.requestCalendarPermissionsAsync();
		if (!permission.granted) {
			setFormError(
				"Calendar permission is required to import device calendars.",
			);
			return;
		}

		try {
			const calendars = await Calendar.getCalendarsAsync(
				Calendar.EntityTypes.EVENT,
			);
			const calendarIds = calendars
				.filter(
					(calendar) =>
						Boolean(calendar.id) &&
						calendar.isVisible !== false,
				)
				.map((calendar) => calendar.id);

			if (calendarIds.length === 0) {
				setFormError(
					"No visible calendars were found on this device.",
				);
				return;
			}

			const events = await Calendar.getEventsAsync(
				calendarIds,
				new Date(rangeStartUtc),
				new Date(rangeEndUtc),
			);

			const importEvents = events
				.map((event) =>
					mapCalendarEventToImportInput(event),
				)
				.filter(
					(
						event,
					): event is DeviceCalendarEventInput =>
						Boolean(event),
				);

			if (importEvents.length === 0) {
				setImportNotice(
					"No importable calendar events were found for this week.",
				);
				return;
			}

			const previewResponse =
				await previewDeviceCalendarImport({
					variables: {
						events: importEvents,
					},
				});

			const preview =
				previewResponse.data
					?.previewDeviceCalendarImport;

			if (!preview || preview.totalCount === 0) {
				setImportNotice(
					"No valid calendar events were detected for import.",
				);
				return;
			}

			const entryPreviewLines = preview.entries
				.slice(0, 5)
				.map(
					(entry, index) =>
						`${index + 1}. ${formatDateTime(
							entry.startUtc,
							timezone,
						)} - ${formatDateTime(
							entry.endUtc,
							timezone,
						)} (${entry.type}${
							entry.isDuplicate
								? ", duplicate"
								: ""
						}${
							entry.isConflict
								? ", conflict"
								: ""
						})`,
				)
				.join("\n");

			const summaryLine = `Detected ${preview.totalCount} event${preview.totalCount === 1 ? "" : "s"}. Duplicates: ${preview.duplicateCount}. Conflicts: ${preview.conflictCount}.`;
			const skippedLine =
				preview.skippedCancelledCount > 0 ||
				preview.skippedInvalidCount > 0
					? `Skipped ${preview.skippedCancelledCount} cancelled and ${preview.skippedInvalidCount} invalid event${preview.skippedCancelledCount + preview.skippedInvalidCount === 1 ? "" : "s"}.`
					: "";
			const moreCount = preview.entries.length - 5;
			const previewMessage = [
				summaryLine,
				skippedLine,
				entryPreviewLines,
				moreCount > 0 ? `...and ${moreCount} more` : "",
			]
				.filter(Boolean)
				.join("\n\n");

			Alert.alert("Review calendar import", previewMessage, [
				{
					text: "Cancel",
					style: "cancel",
				},
				{
					text: "Skip Duplicates",
					onPress: () => {
						void confirmImportFromDeviceCalendar(
							importEvents,
							"SKIP_DUPLICATES",
						);
					},
				},
				{
					text: "Keep Both",
					onPress: () => {
						void confirmImportFromDeviceCalendar(
							importEvents,
							"KEEP_BOTH",
						);
					},
				},
				{
					text: "Replace Conflicts",
					style: "destructive",
					onPress: () => {
						void confirmImportFromDeviceCalendar(
							importEvents,
							"REPLACE_CONFLICTS",
						);
					},
				},
			]);
		} catch (importError) {
			setFormError(
				toUserErrorMessage(
					importError,
					"Unable to import from device calendars.",
				),
			);
		}
	};

	const openImportOptions = (): void => {
		Alert.alert("Import Rota", "Choose an import source.", [
			{
				text: "Cancel",
				style: "cancel",
			},
			{
				text: "Screenshot",
				onPress: () => {
					void importFromScreenshot();
				},
			},
			{
				text: "Device Calendar",
				onPress: () => {
					void importFromDeviceCalendar();
				},
			},
		]);
	};

	const moveByWeeks = useCallback(
		(deltaWeeks: number): void => {
			const nextWeekDate = addLocalDays(
				weekStartDate,
				deltaWeeks * 7,
			);
			setSelectedDate(nextWeekDate);
			setActiveDayKey(
				getZonedDateKey(nextWeekDate, timezone),
			);
		},
		[weekStartDate, timezone],
	);

	const goToPreviousWeek = useCallback((): void => {
		moveByWeeks(-1);
	}, [moveByWeeks]);

	const goToNextWeek = useCallback((): void => {
		moveByWeeks(1);
	}, [moveByWeeks]);

	const weekSwipeResponder = useMemo(
		() =>
			PanResponder.create({
				onMoveShouldSetPanResponder: (
					_,
					gestureState,
				) => {
					const horizontalDistance = Math.abs(
						gestureState.dx,
					);
					const verticalDistance = Math.abs(
						gestureState.dy,
					);
					return (
						horizontalDistance >
							WEEK_SWIPE_ACTIVATION_PX &&
						horizontalDistance >
							verticalDistance
					);
				},
				onPanResponderRelease: (_, gestureState) => {
					if (
						gestureState.dx >=
						WEEK_SWIPE_TRIGGER_PX
					) {
						goToPreviousWeek();
						return;
					}

					if (
						gestureState.dx <=
						-WEEK_SWIPE_TRIGGER_PX
					) {
						goToNextWeek();
					}
				},
			}),
		[goToNextWeek, goToPreviousWeek],
	);

	const openMonthPicker = (): void => {
		setMonthPickerYear(selectedDate.getFullYear());
		setMonthModalVisible(true);
	};

	const jumpToToday = (): void => {
		const today = new Date();
		setSelectedDate(today);
		setActiveDayKey(getZonedDateKey(today, timezone));
	};

	const adjustDurationHours = (deltaHours: number): void => {
		const current = parseDurationHours(durationHours) ?? 8;
		const adjusted = Math.max(0.25, current + deltaHours);
		setDurationHours(formatDurationHoursValue(adjusted));
	};

	const selectMonth = (monthIndex: number): void => {
		const nextDate = new Date(
			monthPickerYear,
			monthIndex,
			1,
			12,
			0,
			0,
			0,
		);
		setSelectedDate(nextDate);
		setActiveDayKey(getZonedDateKey(nextDate, timezone));
		setMonthModalVisible(false);
	};

	const monthLabel = formatMonthLabel(weekStartDate, timezone);
	const today = new Date();
	const todayDayKey = getZonedDateKey(today, timezone);
	const currentMonthIndex = today.getMonth();
	const currentYear = today.getFullYear();
	const isViewingCurrentMonth =
		weekStartDate.getMonth() === currentMonthIndex &&
		weekStartDate.getFullYear() === currentYear;

	return (
		<ScreenScaffold>
			<View style={styles.root}>
				<ScrollView
					contentContainerStyle={styles.scroll}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="on-drag"
				>
					<View style={styles.monthRow}>
						<Pressable
							style={[
								styles.monthButton,
								isViewingCurrentMonth
									? styles.monthButtonCurrent
									: undefined,
							]}
							onPress={
								openMonthPicker
							}
						>
							<Text
								style={
									styles.monthButtonText
								}
							>
								{monthLabel}
							</Text>
							<Ionicons
								name="chevron-down"
								size={16}
								color={
									theme
										.colors
										.textPrimary
								}
							/>
						</Pressable>
						<View style={styles.todayRow}>
							<Pressable
								style={
									styles.todayButton
								}
								onPress={
									jumpToToday
								}
							>
								<Text
									style={
										styles.todayButtonLabel
									}
								>
									Today
								</Text>
							</Pressable>
						</View>
					</View>

					<View
						style={styles.weekRow}
						{...weekSwipeResponder.panHandlers}
					>
						<View style={styles.daysRow}>
							{weekDates.map(
								(day) => {
									const dayKey =
										getZonedDateKey(
											day,
											timezone,
										);
									const dayState =
										dayStateByKey.get(
											dayKey,
										) ??
										"FREE";
									const isActive =
										dayKey ===
										activeDayKey;
									const isToday =
										dayKey ===
										todayDayKey;
									const hasTintedBackground =
										dayState !==
										"FREE";

									return (
										<Pressable
											key={
												dayKey
											}
											style={[
												styles.dayCell,
												{
													backgroundColor:
														dayState ===
														"EARLY"
															? theme
																	.colors
																	.accentEarlyBackground
															: dayState ===
																  "BUSY"
																? theme
																		.colors
																		.accentBusyBackground
																: theme
																		.colors
																		.surface,
												},
												isToday
													? styles.dayCellToday
													: undefined,
												isActive &&
												!isToday
													? styles.dayCellActive
													: undefined,
											]}
											onPress={() =>
												openCreateModal(
													dayKey,
												)
											}
										>
											<Text
												style={[
													styles.dayLabel,
													hasTintedBackground
														? styles.dayLabelTinted
														: undefined,
													isToday
														? styles.dayLabelToday
														: undefined,
												]}
											>
												{formatWeekdayShort(
													day,
													timezone,
												)}
											</Text>
											<Text
												style={[
													styles.dayDate,
													hasTintedBackground
														? styles.dayDateTinted
														: undefined,
													isToday
														? styles.dayDateToday
														: undefined,
												]}
											>
												{formatDayNumber(
													day,
													timezone,
												)}
											</Text>
										</Pressable>
									);
								},
							)}
						</View>
						<Text style={styles.weekHint}>
							Swipe left or right to
							change week
						</Text>
					</View>

					<View style={styles.totalHoursRow}>
						<Text
							style={
								styles.totalHoursLabel
							}
						>
							Total Working Hours
						</Text>
						<Text
							style={
								styles.totalHoursValue
							}
						>
							{formatDurationLabel(
								totalWorkMinutes,
							)}
						</Text>
					</View>

					{importNotice ? (
						<StateNotice
							mode="empty"
							message={importNotice}
						/>
					) : null}

					{/* <View style={styles.card}> */}
					<Text style={styles.busyTitle}>
						Busy on...
					</Text>
					{loading ? (
						<StateNotice
							mode="loading"
							message="Loading rota entries..."
						/>
					) : null}
					{error ? (
						<StateNotice
							mode="error"
							message={toUserErrorMessage(
								error,
								"Unable to load rota entries.",
							)}
						/>
					) : null}
					{!loading &&
					!error &&
					workEntries.length === 0 ? (
						<StateNotice
							mode="empty"
							message="No work shifts in this week yet."
						/>
					) : null}

					{workEntries.map((entry) => {
						const mappedShiftType =
							entry.shiftTypeId
								? shiftTypeById.get(
										entry.shiftTypeId,
									)
								: undefined;
						const tagColor =
							entry.shiftType
								?.color ||
							mappedShiftType?.color ||
							theme.colors.accent;
						const displayTitle =
							entry.shiftTitle?.trim() ||
							entry.shiftType?.name ||
							mappedShiftType?.name ||
							"Shift";

						return (
							<View
								key={entry.id}
								style={
									styles.shiftCard
								}
							>
								<View
									style={[
										styles.shiftAccent,
										{
											backgroundColor:
												tagColor,
										},
									]}
								/>
								<Pressable
									style={
										styles.shiftMain
									}
									onPress={() =>
										openEditModal(
											entry,
										)
									}
								>
									<Text
										style={
											styles.shiftTitle
										}
									>
										{
											displayTitle
										}
									</Text>
									<Text
										style={
											styles.shiftMeta
										}
									>
										{formatDateTime(
											entry.startUtc,
											timezone,
										)}{" "}
										-{" "}
										{formatDateTime(
											entry.endUtc,
											timezone,
										)}
									</Text>
									<Text
										style={
											styles.shiftMeta
										}
									>
										Duration:{" "}
										{formatDurationLabel(
											getDurationMinutes(
												entry.startUtc,
												entry.endUtc,
											),
										)}
									</Text>
								</Pressable>
								<Pressable
									style={
										styles.binButton
									}
									onPress={() =>
										void removeEntry(
											entry.id,
										)
									}
								>
									<Ionicons
										name="trash-outline"
										size={
											18
										}
										color={
											theme
												.colors
												.textSecondary
										}
									/>
								</Pressable>
							</View>
						);
					})}
					{/* </View> */}
				</ScrollView>

				<View style={styles.bottomRow}>
					<ActionButton
						label="Add Rota"
						onPress={() =>
							openCreateModal(
								activeDayKey,
							)
						}
					/>
					<ActionButton
						label="Import"
						variant="muted"
						onPress={() =>
							openImportOptions()
						}
						loading={
							previewLoading ||
							importLoading ||
							calendarPreviewLoading ||
							calendarImportLoading
						}
					/>
				</View>
			</View>

			<Modal
				visible={isEntryModalVisible}
				transparent
				animationType="slide"
				onRequestClose={closeEntryModal}
			>
				<View style={styles.modalBackdrop}>
					<Pressable
						style={StyleSheet.absoluteFill}
						onPress={closeEntryModal}
					/>
					<View style={styles.modalSheet}>
						<View
							style={
								styles.modalHeader
							}
						>
							<Text
								style={
									styles.modalTitle
								}
							>
								{editingEntryId
									? "Edit Shift"
									: "Add Shift"}
							</Text>
							<Pressable
								onPress={
									closeEntryModal
								}
							>
								<Ionicons
									name="close"
									size={
										22
									}
									color={
										theme
											.colors
											.textPrimary
									}
								/>
							</Pressable>
						</View>
						<Text
							style={
								styles.modalSubtext
							}
						>
							Day: {activeDayKey}
						</Text>

						<View style={styles.modeRow}>
							<ActionButton
								label="Preset"
								onPress={() =>
									setEntryModalMode(
										"PRESET",
									)
								}
								variant={
									entryModalMode ===
									"PRESET"
										? "primary"
										: "muted"
								}
							/>
							<ActionButton
								label="Custom"
								onPress={() =>
									setEntryModalMode(
										"CUSTOM",
									)
								}
								variant={
									entryModalMode ===
									"CUSTOM"
										? "primary"
										: "muted"
								}
							/>
						</View>

						{entryModalMode === "PRESET" ? (
							<>
								<Text
									style={
										styles.chipSectionLabel
									}
								>
									Presets
									from
									previous
									shifts
								</Text>
								<View
									style={
										styles.presetRow
									}
								>
									{previousPresets.map(
										(
											preset,
										) => {
											const presetTitle =
												preset.shiftTitle?.trim() ||
												preset
													.shiftType
													?.name ||
												"Shift";
											return (
												<Pressable
													key={
														preset.id
													}
													style={
														styles.presetChip
													}
													onPress={() =>
														applyPreset(
															preset,
														)
													}
												>
													<Text
														style={
															styles.presetLabel
														}
													>
														{
															presetTitle
														}{" "}
														{formatTimeLabel(
															preset.startUtc,
															timezone,
														)}

														-
														{formatTimeLabel(
															preset.endUtc,
															timezone,
														)}
													</Text>
												</Pressable>
											);
										},
									)}
								</View>
								{previousPresets.length ===
								0 ? (
									<StateNotice
										mode="empty"
										message="No preset shifts found yet. Switch to custom to create one."
									/>
								) : null}
							</>
						) : null}

						{entryModalMode === "CUSTOM" ||
						editingEntryId ? (
							<ScrollView
								keyboardShouldPersistTaps="handled"
								contentContainerStyle={{
									gap: theme
										.spacing
										.md,
								}}
							>
								<View
									style={
										styles.modeRow
									}
								>
									{(
										[
											"WORK",
											"FREE",
										] as const
									).map(
										(
											option,
										) => (
											<ActionButton
												key={
													option
												}
												label={
													option
												}
												onPress={() =>
													setEntryType(
														option,
													)
												}
												variant={
													entryType ===
													option
														? "primary"
														: "muted"
												}
											/>
										),
									)}
								</View>

								<DateTimePickerField
									label="Starts"
									value={
										startUtc
									}
									onChangeValue={
										setStartUtc
									}
									timezone={
										timezone
									}
								/>

								<FormField
									label="Shift Duration (hours)"
									value={
										durationHours
									}
									onChangeText={
										setDurationHours
									}
									placeholder="e.g. 7.5"
									keyboardType="decimal-pad"
								/>

								<View
									style={
										styles.durationAdjustRow
									}
								>
									<ActionButton
										label="-30m"
										variant="muted"
										onPress={() =>
											adjustDurationHours(
												-0.5,
											)
										}
									/>
									<ActionButton
										label="+30m"
										variant="muted"
										onPress={() =>
											adjustDurationHours(
												0.5,
											)
										}
									/>
									<ActionButton
										label="+1h"
										variant="muted"
										onPress={() =>
											adjustDurationHours(
												1,
											)
										}
									/>
								</View>

								<Text
									style={
										styles.durationHint
									}
								>
									{computedEndUtc
										? `Ends at ${formatDateTime(computedEndUtc, timezone)}`
										: "Enter a valid duration to calculate end time."}
								</Text>

								<Text
									style={
										styles.chipSectionLabel
									}
								>
									Shift
									Type
								</Text>
								<View
									style={
										styles.shiftTypeChipRow
									}
								>
									{shiftTypeData?.myShiftTypes?.map(
										(
											item,
										) => (
											<Pressable
												key={
													item.id
												}
												style={[
													styles.shiftTypeChip,
													shiftTypeId ===
													item.id
														? styles.shiftTypeChipActive
														: undefined,
												]}
												onPress={() => {
													setShiftTypeId(
														item.id,
													);
													if (
														!shiftTitle.trim()
													) {
														setShiftTitle(
															item.name,
														);
													}
												}}
											>
												<View
													style={[
														styles.shiftTypeDot,
														{
															backgroundColor:
																item.color,
														},
													]}
												/>
												<Text
													style={
														styles.shiftTypeChipLabel
													}
												>
													{
														item.name
													}
												</Text>
											</Pressable>
										),
									)}
									<ActionButton
										label="No Tag"
										variant="muted"
										onPress={() =>
											setShiftTypeId(
												null,
											)
										}
									/>
								</View>

								<FormField
									label="Shift Title (optional)"
									value={
										shiftTitle
									}
									onChangeText={
										setShiftTitle
									}
									placeholder="Defaults to tag name"
									autoCapitalize="words"
								/>
								<FormField
									label="Notes"
									value={
										note
									}
									onChangeText={
										setNote
									}
									autoCapitalize="sentences"
								/>

								{formError ? (
									<StateNotice
										mode="error"
										message={
											formError
										}
									/>
								) : null}

								<View
									style={
										styles.modeRow
									}
								>
									<ActionButton
										label={
											editingEntryId
												? "Save Update"
												: "Create Shift"
										}
										onPress={() =>
											void submitEntry()
										}
										loading={
											mutationLoading
										}
									/>
									<ActionButton
										label="Cancel"
										variant="muted"
										onPress={
											closeEntryModal
										}
									/>
								</View>
							</ScrollView>
						) : null}
					</View>
				</View>
			</Modal>

			<Modal
				visible={isMonthModalVisible}
				transparent
				animationType="fade"
				onRequestClose={() =>
					setMonthModalVisible(false)
				}
			>
				<View style={styles.modalBackdrop}>
					<Pressable
						style={StyleSheet.absoluteFill}
						onPress={() =>
							setMonthModalVisible(
								false,
							)
						}
					/>
					<View style={styles.monthModalCard}>
						<View
							style={
								styles.monthHeader
							}
						>
							<Pressable
								style={
									styles.arrowButton
								}
								onPress={() =>
									setMonthPickerYear(
										(
											current,
										) =>
											current -
											1,
									)
								}
							>
								<Ionicons
									name="chevron-back"
									size={
										18
									}
									color={
										theme
											.colors
											.textPrimary
									}
								/>
							</Pressable>
							<Text
								style={
									styles.monthYearLabel
								}
							>
								{
									monthPickerYear
								}
							</Text>
							<Pressable
								style={
									styles.arrowButton
								}
								onPress={() =>
									setMonthPickerYear(
										(
											current,
										) =>
											current +
											1,
									)
								}
							>
								<Ionicons
									name="chevron-forward"
									size={
										18
									}
									color={
										theme
											.colors
											.textPrimary
									}
								/>
							</Pressable>
						</View>
						<View style={styles.monthGrid}>
							{MONTHS.map(
								(
									monthName,
									monthIndex,
								) => (
									<Pressable
										key={
											monthName
										}
										style={[
											styles.monthCell,
											monthPickerYear ===
												currentYear &&
											monthIndex ===
												currentMonthIndex
												? styles.monthCellCurrent
												: undefined,
										]}
										onPress={() =>
											selectMonth(
												monthIndex,
											)
										}
									>
										<Text
											style={
												styles.monthCellText
											}
										>
											{monthName.slice(
												0,
												3,
											)}
										</Text>
									</Pressable>
								),
							)}
						</View>
					</View>
				</View>
			</Modal>
		</ScreenScaffold>
	);
}
