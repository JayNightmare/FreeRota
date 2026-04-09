export interface DateRange {
    startIso: string;
    endIso: string;
}

export function nowIso(): string {
    return new Date().toISOString();
}

export function addDaysIso(days: number): string {
    const value = new Date();
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString();
}

export function getDeviceTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
        return "UTC";
    }
}

export function parseIsoDate(value: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return new Date();
    }

    return parsed;
}

export function updateIsoDatePart(currentIso: string, selectedDate: Date): string {
    const base = parseIsoDate(currentIso);
    base.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    return base.toISOString();
}

export function updateIsoTimePart(currentIso: string, selectedTime: Date): string {
    const base = parseIsoDate(currentIso);
    base.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes(),
        selectedTime.getSeconds(),
        selectedTime.getMilliseconds(),
    );
    return base.toISOString();
}

export function formatDateTime(value: string, timezone?: string): string {
    const date = parseIsoDate(value);

    try {
        return new Intl.DateTimeFormat("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: timezone,
        }).format(date);
    } catch {
        return date.toLocaleString();
    }
}

export function getTimezoneOffsetLabel(timezone: string, referenceDate?: Date): string {
    try {
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            timeZoneName: "shortOffset",
        });
        const parts = formatter.formatToParts(referenceDate ?? new Date());
        const timezonePart = parts.find((part) => part.type === "timeZoneName");
        if (timezonePart?.value) {
            return timezonePart.value.replace("GMT", "UTC");
        }
    } catch {
        // Fallback below.
    }

    return "UTC";
}

export function formatTimezoneNow(timezone: string): string {
    try {
        return new Intl.DateTimeFormat("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: timezone,
        }).format(new Date());
    } catch {
        return new Date().toLocaleString();
    }
}

export function buildWeekRange(offsetWeeks = 0): DateRange {
    const now = new Date();
    const start = new Date(now);
    const mondayIndex = (now.getDay() + 6) % 7;
    start.setDate(now.getDate() - mondayIndex + offsetWeeks * 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return {
        startIso: start.toISOString(),
        endIso: end.toISOString(),
    };
}

export function startOfSundayWeek(referenceDate: Date): Date {
    const start = new Date(referenceDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    return start;
}

export function buildSundayWeekRange(offsetWeeks = 0, referenceDate?: Date): DateRange {
    const baseDate = referenceDate ?? new Date();
    const start = startOfSundayWeek(baseDate);
    start.setDate(start.getDate() + offsetWeeks * 7);

    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return {
        startIso: start.toISOString(),
        endIso: end.toISOString(),
    };
}

export function addLocalDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

export function getSundayWeekDates(referenceDate: Date): Date[] {
    const start = startOfSundayWeek(referenceDate);
    return Array.from({ length: 7 }, (_unused, index) => addLocalDays(start, index));
}

export function formatMonthLabel(value: Date, timezone?: string): string {
    try {
        return new Intl.DateTimeFormat("en-GB", {
            month: "long",
            year: "numeric",
            timeZone: timezone,
        }).format(value);
    } catch {
        return value.toLocaleDateString();
    }
}

export function formatWeekdayShort(value: Date, timezone?: string): string {
    try {
        return new Intl.DateTimeFormat("en-GB", {
            weekday: "short",
            timeZone: timezone,
        }).format(value);
    } catch {
        return value.toLocaleDateString(undefined, { weekday: "short" });
    }
}

export function formatDayNumber(value: Date, timezone?: string): string {
    try {
        return new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            timeZone: timezone,
        }).format(value);
    } catch {
        return String(value.getDate()).padStart(2, "0");
    }
}

export function getZonedDateKey(value: string | Date, timezone?: string): string {
    const date = typeof value === "string" ? parseIsoDate(value) : value;

    try {
        const formatter = new Intl.DateTimeFormat("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            timeZone: timezone,
        });
        const parts = formatter.formatToParts(date);
        const year = parts.find((part) => part.type === "year")?.value;
        const month = parts.find((part) => part.type === "month")?.value;
        const day = parts.find((part) => part.type === "day")?.value;
        if (year && month && day) {
            return `${year}-${month}-${day}`;
        }
    } catch {
        // Fall back to device local value.
    }

    const local = typeof value === "string" ? parseIsoDate(value) : value;
    const year = local.getFullYear();
    const month = String(local.getMonth() + 1).padStart(2, "0");
    const day = String(local.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function getHourInTimezone(value: string, timezone?: string): number {
    const date = parseIsoDate(value);

    try {
        const formatter = new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit",
            hour12: false,
            timeZone: timezone,
        });
        const parts = formatter.formatToParts(date);
        const hour = parts.find((part) => part.type === "hour")?.value;
        if (!hour) {
            return date.getHours();
        }
        const parsed = Number(hour);
        return Number.isFinite(parsed) ? parsed : date.getHours();
    } catch {
        return date.getHours();
    }
}

export function getDurationMinutes(startUtc: string, endUtc: string): number {
    const start = parseIsoDate(startUtc).getTime();
    const end = parseIsoDate(endUtc).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return 0;
    }

    return Math.round((end - start) / 60000);
}

export function toLocalDateTime(value: string): string {
    return formatDateTime(value);
}
