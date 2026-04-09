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

export function toLocalDateTime(value: string): string {
    return formatDateTime(value);
}
