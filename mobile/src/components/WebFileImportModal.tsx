/**
 * WebFileImportModal
 *
 * A React Native Modal (web-only) that lets the user pick a schedule file
 * (.ics, .csv, .txt, .xlsx, .pdf), previews the detected shifts, then
 * submits them via the existing previewDeviceCalendarImport /
 * importDeviceCalendar GraphQL mutations.
 */

import { useRef, useState } from "react";
import {
	ActivityIndicator,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useMutation } from "@apollo/client";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
	IMPORT_DEVICE_CALENDAR_MUTATION,
	PREVIEW_DEVICE_CALENDAR_IMPORT_MUTATION,
} from "../graphql/operations";
import { useTheme } from "../theme/useTheme";
import { formatDateTime } from "../utils/time";
import {
	getAcceptAttribute,
	parseFile,
	type ParsedCalendarEvent,
} from "../utils/fileImportParser";
import { toUserErrorMessage } from "../utils/errors";
import { ActionButton } from "./ActionButton";
import { StateNotice } from "./StateNotice";

// ─── GraphQL mutation response types ────────────────────────────────────────

interface CalendarImportPreviewEntry {
	eventId: string;
	calendarId: string;
	title?: string | null;
	type: "WORK" | "FREE";
	startUtc: string;
	endUtc: string;
	note?: string;
	sourceType: string;
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

interface RotaEntry {
	id: string;
	type: "WORK" | "FREE";
	startUtc: string;
	endUtc: string;
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

// ─── Component props ─────────────────────────────────────────────────────────

interface WebFileImportModalProps {
	visible: boolean;
	timezone: string;
	onClose: () => void;
	onImportComplete: (notice: string) => void;
	onError: (message: string) => void;
	onRefetch: () => Promise<unknown>;
}

type ModalStep = "select" | "preview" | "importing";

const MAX_PREVIEW_ENTRIES = 50;

// ─────────────────────────────────────────────────────────────────────────────

export function WebFileImportModal({
	visible,
	timezone,
	onClose,
	onImportComplete,
	onError,
	onRefetch,
}: WebFileImportModalProps) {
	const { theme } = useTheme();

	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const [step, setStep] = useState<ModalStep>("select");
	const [fileName, setFileName] = useState<string | null>(null);
	const [parsing, setParsing] = useState(false);
	const [parseError, setParseError] = useState<string | null>(null);
	const [previewEntries, setPreviewEntries] = useState<CalendarImportPreviewEntry[]>([]);
	const [previewMeta, setPreviewMeta] = useState<{
		totalCount: number;
		duplicateCount: number;
		conflictCount: number;
	} | null>(null);

	const [previewDeviceCalendarImport, { loading: previewLoading }] =
		useMutation<PreviewDeviceCalendarImportMutation>(
			PREVIEW_DEVICE_CALENDAR_IMPORT_MUTATION,
		);
	const [importDeviceCalendar, { loading: importLoading }] =
		useMutation<ImportDeviceCalendarMutation>(
			IMPORT_DEVICE_CALENDAR_MUTATION,
		);

	const isLoading = parsing || previewLoading || importLoading;

	// ── Reset state when modal closes ─────────────────────────────────────────

	function handleClose() {
		if (isLoading) return;
		setStep("select");
		setFileName(null);
		setParseError(null);
		setPreviewEntries([]);
		setPreviewMeta(null);
		onClose();
	}

	// ── File selection (hidden HTML input) ───────────────────────────────────

	function openFilePicker() {
		fileInputRef.current?.click();
	}

	async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		// Reset the input so the same file can be reselected after an error
		e.target.value = "";

		setFileName(file.name);
		setParseError(null);
		setPreviewEntries([]);
		setPreviewMeta(null);
		setParsing(true);

		let parsed: ParsedCalendarEvent[];
		try {
			parsed = await parseFile(file);
		} catch (err) {
			setParseError(
				err instanceof Error
					? err.message
					: "Unable to parse the selected file.",
			);
			setParsing(false);
			return;
		}

		if (parsed.length === 0) {
			setParseError(
				"No calendar events were detected in this file. " +
					"Make sure the file contains dates and times.",
			);
			setParsing(false);
			return;
		}

		// Send to backend for preview
		try {
			const resp = await previewDeviceCalendarImport({
				variables: { events: parsed },
			});

			const preview = resp.data?.previewDeviceCalendarImport;
			if (!preview || preview.totalCount === 0) {
				setParseError(
					"No valid shifts were detected in this file.",
				);
				setParsing(false);
				return;
			}

			setPreviewEntries(preview.entries);
			setPreviewMeta({
				totalCount: preview.totalCount,
				duplicateCount: preview.duplicateCount,
				conflictCount: preview.conflictCount,
			});
			setStep("preview");
		} catch (err) {
			setParseError(
				toUserErrorMessage(err, "Failed to preview import."),
			);
		} finally {
			setParsing(false);
		}
	}

	// ── Confirm import ────────────────────────────────────────────────────────

	async function handleConfirmImport() {
		if (!previewEntries.length) return;
		setStep("importing");
		try {
			const resp = await importDeviceCalendar({
				variables: {
					events: previewEntries.map((e) => ({
						eventId: e.eventId,
						calendarId: e.calendarId,
						title: e.title,
						notes: e.note,
						status: null,
						startUtc: e.startUtc,
						endUtc: e.endUtc,
						allDay: false,
						recurrenceRule: e.recurrenceRule,
					})),
					duplicateMode: "SKIP_DUPLICATES",
				},
			});

			const result = resp.data?.importDeviceCalendar;
			if (!result) {
				onError("Import failed. Please try again.");
				handleClose();
				return;
			}

			await onRefetch();
			onImportComplete(
				`File import complete: ${result.createdCount}/${result.totalConsidered} created` +
					(result.skippedDuplicates > 0
						? `, ${result.skippedDuplicates} duplicate${result.skippedDuplicates === 1 ? "" : "s"} skipped`
						: "") +
					".",
			);
			handleClose();
		} catch (err) {
			onError(toUserErrorMessage(err, "Import failed. Please try again."));
			handleClose();
		}
	}

	// ── Styles ────────────────────────────────────────────────────────────────

	const styles = StyleSheet.create({
		backdrop: {
			flex: 1,
			backgroundColor: "rgba(0,0,0,0.6)",
			justifyContent: "center",
			alignItems: "center",
		},
		sheet: {
			backgroundColor: theme.colors.surface,
			borderRadius: theme.radius.lg,
			borderWidth: theme.borderWidth,
			borderColor: theme.colors.border,
			padding: theme.spacing.xl,
			width: "90%",
			maxWidth: 480,
			gap: theme.spacing.md,
			...theme.shadow,
		},
		header: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
		},
		title: {
			fontSize: theme.typography.heading,
			fontWeight: "900",
			color: theme.colors.textPrimary,
		},
		subtitle: {
			fontSize: theme.typography.caption,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		divider: {
			height: theme.borderWidth,
			backgroundColor: theme.colors.border,
		},
		fileBox: {
			backgroundColor: theme.colors.surfaceMuted,
			borderRadius: theme.radius.md,
			borderWidth: theme.borderWidth,
			borderColor: theme.colors.border,
			borderStyle: "dashed" as const,
			padding: theme.spacing.lg,
			alignItems: "center",
			gap: theme.spacing.sm,
		},
		fileBoxText: {
			fontSize: theme.typography.body,
			color: theme.colors.textSecondary,
			textAlign: "center",
		},
		fileNameText: {
			fontSize: theme.typography.body,
			fontWeight: "700",
			color: theme.colors.accent,
			textAlign: "center",
		},
		supportedText: {
			fontSize: theme.typography.tiny,
			color: theme.colors.textMuted,
			textAlign: "center",
		},
		previewScrollArea: {
			maxHeight: 240,
		},
		previewRow: {
			flexDirection: "row",
			gap: theme.spacing.sm,
			paddingVertical: theme.spacing.xs,
			borderBottomWidth: theme.borderWidth,
			borderBottomColor: theme.colors.border,
		},
		previewBadge: {
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: 2,
			borderRadius: theme.radius.sm,
			alignSelf: "flex-start",
			marginTop: 2,
		},
		previewBadgeText: {
			fontSize: theme.typography.tiny,
			fontWeight: "900",
			textTransform: "uppercase" as const,
		},
		previewInfo: {
			flex: 1,
		},
		previewTitle: {
			fontSize: theme.typography.caption,
			fontWeight: "700",
			color: theme.colors.textPrimary,
		},
		previewMeta: {
			fontSize: theme.typography.tiny,
			color: theme.colors.textSecondary,
		},
		metaRow: {
			flexDirection: "row",
			flexWrap: "wrap" as const,
			gap: theme.spacing.sm,
		},
		metaChip: {
			backgroundColor: theme.colors.surfaceElevated,
			borderRadius: theme.radius.sm,
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: 2,
		},
		metaChipText: {
			fontSize: theme.typography.tiny,
			color: theme.colors.textSecondary,
		},
		buttonRow: {
			flexDirection: "row",
			gap: theme.spacing.md,
			marginTop: theme.spacing.sm,
		},
		loadingRow: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			gap: theme.spacing.sm,
			paddingVertical: theme.spacing.lg,
		},
		loadingText: {
			fontSize: theme.typography.body,
			color: theme.colors.textSecondary,
		},
	});

	// ── Render ────────────────────────────────────────────────────────────────

	const WORK_COLOR = theme.colors.accent;
	const FREE_COLOR = theme.colors.tertiary;

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={handleClose}
		>
			{/* Hidden HTML file input – react-native-web renders this as a native DOM input element */}
			<input
				ref={fileInputRef}
				type="file"
				accept={getAcceptAttribute()}
				aria-label="Select schedule file to import"
				style={{ display: "none" }}
				onChange={handleFileChange}
			/>

			<View style={styles.backdrop}>
				<Pressable
					style={StyleSheet.absoluteFill}
					onPress={handleClose}
				/>
				<View style={styles.sheet}>
					{/* ── Header ── */}
					<View style={styles.header}>
						<View>
							<Text style={styles.title}>Import Rota from File</Text>
							<Text style={styles.subtitle}>
								{step === "select"
									? "Choose a schedule file to import"
									: step === "preview"
										? "Review detected shifts before importing"
										: "Importing shifts…"}
							</Text>
						</View>
						<Pressable onPress={handleClose} disabled={isLoading}>
							<Ionicons
								name="close"
								size={22}
								color={theme.colors.textPrimary}
							/>
						</Pressable>
					</View>

					<View style={styles.divider} />

					{/* ── Select step ── */}
					{step === "select" && (
						<>
							{parsing ? (
								<View style={styles.loadingRow}>
									<ActivityIndicator
										color={theme.colors.accent}
										size="small"
									/>
									<Text style={styles.loadingText}>
										Parsing {fileName ?? "file"}…
									</Text>
								</View>
							) : (
								<Pressable
									style={styles.fileBox}
									onPress={openFilePicker}
								>
									<Ionicons
										name="cloud-upload-outline"
										size={32}
										color={theme.colors.textMuted}
									/>
									{fileName ? (
										<Text style={styles.fileNameText}>
											{fileName}
										</Text>
									) : (
										<Text style={styles.fileBoxText}>
											Tap to choose a file
										</Text>
									)}
									<Text style={styles.supportedText}>
										Supported: .ics, .csv, .txt, .xlsx,
										.pdf
									</Text>
								</Pressable>
							)}

							{parseError ? (
								<StateNotice
									mode="error"
									message={parseError}
								/>
							) : null}

							<View style={styles.buttonRow}>
								<ActionButton
									label="Choose File"
									onPress={openFilePicker}
									loading={parsing}
									disabled={parsing}
								/>
								<ActionButton
									label="Cancel"
									variant="muted"
									onPress={handleClose}
									disabled={parsing}
								/>
							</View>
						</>
					)}

					{/* ── Preview step ── */}
					{step === "preview" && (
						<>
							{previewMeta && (
								<View style={styles.metaRow}>
									<View style={styles.metaChip}>
										<Text style={styles.metaChipText}>
											{previewMeta.totalCount} shift
											{previewMeta.totalCount !== 1
												? "s"
												: ""}{" "}
											detected
										</Text>
									</View>
									{previewMeta.duplicateCount > 0 && (
										<View style={styles.metaChip}>
											<Text style={styles.metaChipText}>
												{previewMeta.duplicateCount}{" "}
												duplicate
												{previewMeta.duplicateCount !==
												1
													? "s"
													: ""}
											</Text>
										</View>
									)}
									{previewMeta.conflictCount > 0 && (
										<View style={styles.metaChip}>
											<Text style={styles.metaChipText}>
												{previewMeta.conflictCount}{" "}
												conflict
												{previewMeta.conflictCount !== 1
													? "s"
													: ""}
											</Text>
										</View>
									)}
								</View>
							)}

							<ScrollView
								style={styles.previewScrollArea}
								showsVerticalScrollIndicator
							>
								{previewEntries
									.slice(0, MAX_PREVIEW_ENTRIES)
									.map((entry, idx) => {
										const isWork =
											entry.type === "WORK";
										const badgeBg = isWork
											? WORK_COLOR
											: FREE_COLOR;
										const badgeText = isWork
											? theme.colors.onAccent
											: theme.colors.onTertiary;
										return (
											<View
												key={`${entry.eventId}-${idx}`}
												style={styles.previewRow}
											>
												<View
													style={[
														styles.previewBadge,
														{
															backgroundColor:
																badgeBg,
														},
													]}
												>
													<Text
														style={[
															styles.previewBadgeText,
															{
																color: badgeText,
															},
														]}
													>
														{entry.type}
													</Text>
												</View>
												<View
													style={
														styles.previewInfo
													}
												>
													{entry.title ? (
														<Text
															style={
																styles.previewTitle
															}
														>
															{entry.title}
														</Text>
													) : null}
													<Text
														style={
															styles.previewMeta
														}
													>
														{formatDateTime(
															entry.startUtc,
															timezone,
														)}{" "}
														–{" "}
														{formatDateTime(
															entry.endUtc,
															timezone,
														)}
													</Text>
													{entry.isDuplicate && (
														<Text
															style={[
																styles.previewMeta,
																{
																	color: theme
																		.colors
																		.textMuted,
																},
															]}
														>
															Will be
															skipped
															(duplicate)
														</Text>
													)}
												</View>
											</View>
										);
									})}
								{previewEntries.length > MAX_PREVIEW_ENTRIES && (
									<Text
										style={[
											styles.previewMeta,
											{
												paddingVertical:
													theme.spacing.sm,
												color: theme.colors
													.textMuted,
											},
										]}
									>
										…and{" "}
										{previewEntries.length - MAX_PREVIEW_ENTRIES} more
									</Text>
								)}
							</ScrollView>

							<View style={styles.buttonRow}>
								<ActionButton
									label="Import"
									onPress={() =>
										void handleConfirmImport()
									}
									loading={importLoading}
								/>
								<ActionButton
									label="Cancel"
									variant="muted"
									onPress={handleClose}
									disabled={importLoading}
								/>
							</View>
						</>
					)}

					{/* ── Importing step ── */}
					{step === "importing" && (
						<View style={styles.loadingRow}>
							<ActivityIndicator
								color={theme.colors.accent}
								size="small"
							/>
							<Text style={styles.loadingText}>
								Importing shifts…
							</Text>
						</View>
					)}
				</View>
			</View>
		</Modal>
	);
}
