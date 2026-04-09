import { createHash } from 'node:crypto';
import { rotaRepository } from '../repositories/rotaRepository.js';
import { AppError } from '../utils/errors.js';
import { rotaService, type RotaInput } from './rotaService.js';

const FREE_KEYWORDS = ['off', 'free', 'holiday', 'leave', 'vacation', 'pto'];
const INTEGRATION_SOURCE = 'DEVICE_CALENDAR';
const MAX_EVENTS_PER_IMPORT = 5000;

type DuplicateMode = 'SKIP_DUPLICATES' | 'KEEP_BOTH' | 'REPLACE_CONFLICTS';

export interface DeviceCalendarEventInput {
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

interface InternalCalendarImportEntry {
    eventId: string;
    calendarId: string;
    title: string | null;
    type: 'WORK' | 'FREE';
    startUtc: string;
    endUtc: string;
    note: string;
    sourceType: 'ONE_OFF' | 'RECURRING';
    recurrenceRule: string | null;
    importFingerprint: string;
    isDuplicate: boolean;
    isConflict: boolean;
    conflictingExistingIds: string[];
}

export interface CalendarImportPreviewEntry {
    eventId: string;
    calendarId: string;
    title: string | null;
    type: 'WORK' | 'FREE';
    startUtc: string;
    endUtc: string;
    note: string;
    sourceType: 'ONE_OFF' | 'RECURRING';
    recurrenceRule: string | null;
    isDuplicate: boolean;
    isConflict: boolean;
}

export interface CalendarImportPreview {
    entries: CalendarImportPreviewEntry[];
    totalCount: number;
    duplicateCount: number;
    conflictCount: number;
    skippedCancelledCount: number;
    skippedInvalidCount: number;
}

export interface CalendarImportResult {
    created: Array<Awaited<ReturnType<typeof rotaService.createEntry>>>;
    totalConsidered: number;
    createdCount: number;
    skippedDuplicates: number;
    replacedConflicts: number;
    conflictCount: number;
}

interface InternalCalendarImportPreview {
    entries: InternalCalendarImportEntry[];
    totalCount: number;
    duplicateCount: number;
    conflictCount: number;
    skippedCancelledCount: number;
    skippedInvalidCount: number;
}

function normalizeDuplicateMode(mode?: string | null): DuplicateMode {
    if (mode === 'KEEP_BOTH' || mode === 'REPLACE_CONFLICTS' || mode === 'SKIP_DUPLICATES') {
        return mode;
    }

    return 'SKIP_DUPLICATES';
}

function normalizeOptionalText(value: string | null | undefined, maxLength: number): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    return trimmed.slice(0, maxLength);
}

function parseIsoOrNull(value: string): Date | null {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
}

function buildFingerprint(input: {
    calendarId: string;
    eventId: string;
    startUtc: string;
    endUtc: string;
    type: 'WORK' | 'FREE';
}): string {
    const payload = [input.calendarId, input.eventId, input.startUtc, input.endUtc, input.type].join('|');
    return createHash('sha256').update(payload).digest('hex');
}

function isFreeEvent(title: string | null, notes: string | null): boolean {
    const text = `${title ?? ''} ${notes ?? ''}`.toLowerCase();
    return FREE_KEYWORDS.some((keyword) => text.includes(keyword));
}

function rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
    return startA < endB && endA > startB;
}

function mapEvent(event: DeviceCalendarEventInput):
    | { kind: 'ok'; value: Omit<InternalCalendarImportEntry, 'isDuplicate' | 'isConflict' | 'conflictingExistingIds'> }
    | { kind: 'skipped-cancelled' }
    | { kind: 'skipped-invalid' } {
    const eventId = normalizeOptionalText(event.eventId, 256);
    const calendarId = normalizeOptionalText(event.calendarId, 256);

    if (!eventId || !calendarId) {
        return { kind: 'skipped-invalid' };
    }

    const status = normalizeOptionalText(event.status, 64)?.toLowerCase();
    if (status?.includes('cancel')) {
        return { kind: 'skipped-cancelled' };
    }

    const start = parseIsoOrNull(event.startUtc);
    let end = parseIsoOrNull(event.endUtc);

    if (!start || !end) {
        return { kind: 'skipped-invalid' };
    }

    if (end <= start) {
        if (event.allDay) {
            end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        } else {
            return { kind: 'skipped-invalid' };
        }
    }

    const title = normalizeOptionalText(event.title, 256);
    const notes = normalizeOptionalText(event.notes, 1024);
    const recurrenceRule = normalizeOptionalText(event.recurrenceRule, 512);
    const type: 'WORK' | 'FREE' = isFreeEvent(title, notes) ? 'FREE' : 'WORK';

    const startUtc = start.toISOString();
    const endUtc = end.toISOString();
    const sourceType: 'ONE_OFF' | 'RECURRING' = recurrenceRule ? 'RECURRING' : 'ONE_OFF';

    return {
        kind: 'ok',
        value: {
            eventId,
            calendarId,
            title,
            type,
            startUtc,
            endUtc,
            note: `Calendar import: ${title ?? 'Untitled event'}`,
            sourceType,
            recurrenceRule,
            importFingerprint: buildFingerprint({
                calendarId,
                eventId,
                startUtc,
                endUtc,
                type
            })
        }
    };
}

class CalendarImportService {
    private async buildInternalPreview(userId: string, events: DeviceCalendarEventInput[]): Promise<InternalCalendarImportPreview> {
        if (!Array.isArray(events) || events.length === 0) {
            throw new AppError('No calendar events were provided for import.', 'BAD_USER_INPUT', 400);
        }

        if (events.length > MAX_EVENTS_PER_IMPORT) {
            throw new AppError(`Too many events in one import. Limit is ${MAX_EVENTS_PER_IMPORT}.`, 'BAD_USER_INPUT', 400);
        }

        const mappedEntries: Array<Omit<InternalCalendarImportEntry, 'isDuplicate' | 'isConflict' | 'conflictingExistingIds'>> = [];
        let skippedCancelledCount = 0;
        let skippedInvalidCount = 0;

        for (const event of events) {
            const mapped = mapEvent(event);
            if (mapped.kind === 'skipped-cancelled') {
                skippedCancelledCount += 1;
                continue;
            }

            if (mapped.kind === 'skipped-invalid') {
                skippedInvalidCount += 1;
                continue;
            }

            mappedEntries.push(mapped.value);
        }

        if (mappedEntries.length === 0) {
            return {
                entries: [],
                totalCount: 0,
                duplicateCount: 0,
                conflictCount: 0,
                skippedCancelledCount,
                skippedInvalidCount
            };
        }

        let minStart = parseIsoOrNull(mappedEntries[0].startUtc) as Date;
        let maxEnd = parseIsoOrNull(mappedEntries[0].endUtc) as Date;

        for (const entry of mappedEntries) {
            const start = parseIsoOrNull(entry.startUtc) as Date;
            const end = parseIsoOrNull(entry.endUtc) as Date;

            if (start < minStart) {
                minStart = start;
            }
            if (end > maxEnd) {
                maxEnd = end;
            }
        }

        const existingEntries = await rotaRepository.listForUserInRange(userId, minStart, maxEnd);
        const entries: InternalCalendarImportEntry[] = [];
        let duplicateCount = 0;
        let conflictCount = 0;

        for (const mappedEntry of mappedEntries) {
            const candidateStart = parseIsoOrNull(mappedEntry.startUtc) as Date;
            const candidateEnd = parseIsoOrNull(mappedEntry.endUtc) as Date;

            const overlappingEntries = existingEntries.filter((existing) =>
                rangesOverlap(candidateStart, candidateEnd, existing.startUtc, existing.endUtc)
            );

            const isDuplicate = existingEntries.some(
                (existing) => existing.importFingerprint && existing.importFingerprint === mappedEntry.importFingerprint
            );

            const conflictingExistingIds = overlappingEntries
                .filter((existing) => existing.importFingerprint !== mappedEntry.importFingerprint)
                .map((existing) => String(existing._id));

            const isConflict = conflictingExistingIds.length > 0;

            if (isDuplicate) {
                duplicateCount += 1;
            }
            if (isConflict) {
                conflictCount += 1;
            }

            entries.push({
                ...mappedEntry,
                isDuplicate,
                isConflict,
                conflictingExistingIds
            });
        }

        return {
            entries,
            totalCount: entries.length,
            duplicateCount,
            conflictCount,
            skippedCancelledCount,
            skippedInvalidCount
        };
    }

    async previewFromDeviceCalendar(input: {
        userId: string;
        events: DeviceCalendarEventInput[];
    }): Promise<CalendarImportPreview> {
        const preview = await this.buildInternalPreview(input.userId, input.events);

        return {
            entries: preview.entries.map((entry) => ({
                eventId: entry.eventId,
                calendarId: entry.calendarId,
                title: entry.title,
                type: entry.type,
                startUtc: entry.startUtc,
                endUtc: entry.endUtc,
                note: entry.note,
                sourceType: entry.sourceType,
                recurrenceRule: entry.recurrenceRule,
                isDuplicate: entry.isDuplicate,
                isConflict: entry.isConflict
            })),
            totalCount: preview.totalCount,
            duplicateCount: preview.duplicateCount,
            conflictCount: preview.conflictCount,
            skippedCancelledCount: preview.skippedCancelledCount,
            skippedInvalidCount: preview.skippedInvalidCount
        };
    }

    async importFromDeviceCalendar(input: {
        userId: string;
        events: DeviceCalendarEventInput[];
        duplicateMode?: string | null;
    }): Promise<CalendarImportResult> {
        const duplicateMode = normalizeDuplicateMode(input.duplicateMode);
        const preview = await this.buildInternalPreview(input.userId, input.events);

        const created: Array<Awaited<ReturnType<typeof rotaService.createEntry>>> = [];
        let skippedDuplicates = 0;
        let replacedConflicts = 0;
        const deletedIds = new Set<string>();

        for (const entry of preview.entries) {
            if (duplicateMode !== 'KEEP_BOTH' && entry.isDuplicate) {
                skippedDuplicates += 1;
                continue;
            }

            if (duplicateMode === 'REPLACE_CONFLICTS' && entry.conflictingExistingIds.length > 0) {
                const idsToDelete = entry.conflictingExistingIds.filter((id) => !deletedIds.has(id));

                if (idsToDelete.length > 0) {
                    const deletedCount = await rotaRepository.deleteByIdsForUser(input.userId, idsToDelete);
                    replacedConflicts += deletedCount;
                    idsToDelete.forEach((id) => {
                        deletedIds.add(id);
                    });
                }
            }

            const createInput: RotaInput = {
                type: entry.type,
                startUtc: entry.startUtc,
                endUtc: entry.endUtc,
                note: entry.note,
                sourceType: entry.sourceType,
                recurrenceRule: entry.recurrenceRule,
                integrationSource: INTEGRATION_SOURCE,
                externalEventId: entry.eventId,
                externalCalendarId: entry.calendarId,
                externalInstanceStartUtc: entry.startUtc,
                importFingerprint: entry.importFingerprint
            };

            const createdEntry = await rotaService.createEntry(input.userId, createInput);
            created.push(createdEntry);
        }

        return {
            created,
            totalConsidered: preview.totalCount,
            createdCount: created.length,
            skippedDuplicates,
            replacedConflicts,
            conflictCount: preview.conflictCount
        };
    }
}

export const calendarImportService = new CalendarImportService();
