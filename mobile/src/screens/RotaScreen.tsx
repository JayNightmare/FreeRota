import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery } from "@apollo/client";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { FormField } from "../components/FormField";
import { ActionButton } from "../components/ActionButton";
import { StateNotice } from "../components/StateNotice";
import { DateTimePickerField } from "../components/DateTimePickerField";
import { WeekRangePicker } from "../components/WeekRangePicker";
import {
	CREATE_ROTA_ENTRY_MUTATION,
	DELETE_ROTA_ENTRY_MUTATION,
	ME_QUERY,
	MY_ROTA_QUERY,
	UPDATE_ROTA_ENTRY_MUTATION,
} from "../graphql/operations";
import { useTheme } from "../theme/useTheme";
import { addDaysIso, formatDateTime, nowIso } from "../utils/time";
import { toUserErrorMessage } from "../utils/errors";

interface RotaEntry {
	id: string;
	type: "WORK" | "FREE";
	startUtc: string;
	endUtc: string;
	note?: string;
}

interface MyRotaQuery {
	myRota: RotaEntry[];
}

interface MeQuery {
	me: {
		timezone: string;
	};
}

export function RotaScreen() {
	const { theme } = useTheme();
	const [rangeStartUtc, setRangeStartUtc] = useState(nowIso());
	const [rangeEndUtc, setRangeEndUtc] = useState(addDaysIso(14));
	const [editingEntryId, setEditingEntryId] = useState<string | null>(
		null,
	);
	const [type, setType] = useState<"WORK" | "FREE">("WORK");
	const [startUtc, setStartUtc] = useState(nowIso());
	const [endUtc, setEndUtc] = useState(addDaysIso(1));
	const [note, setNote] = useState("");
	const [formError, setFormError] = useState<string | null>(null);

	const { data, loading, error, refetch } = useQuery<MyRotaQuery>(
		MY_ROTA_QUERY,
		{
			variables: { rangeStartUtc, rangeEndUtc },
		},
	);
	const { data: meData } = useQuery<MeQuery>(ME_QUERY);

	const [createRotaEntry, { loading: createLoading }] = useMutation(
		CREATE_ROTA_ENTRY_MUTATION,
	);
	const [updateRotaEntry, { loading: updateLoading }] = useMutation(
		UPDATE_ROTA_ENTRY_MUTATION,
	);
	const [deleteRotaEntry] = useMutation(DELETE_ROTA_ENTRY_MUTATION);

	const mutationLoading = createLoading || updateLoading;

	const styles = useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: theme.spacing.lg,
				},
				card: {
					backgroundColor: theme.colors.surface,
					borderWidth: 1,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.lg,
					padding: theme.spacing.lg,
					gap: theme.spacing.md,
				},
				title: {
					fontSize: theme.typography.heading,
					fontWeight: "800",
					color: theme.colors.textPrimary,
				},
				typeRow: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
				entryCard: {
					borderWidth: 1,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.md,
					padding: theme.spacing.md,
					gap: theme.spacing.sm,
					backgroundColor:
						theme.colors.surfaceElevated,
				},
				entryTitle: {
					fontSize: theme.typography.body,
					fontWeight: "700",
					color: theme.colors.textPrimary,
				},
				entryMeta: {
					fontSize: theme.typography.caption,
					color: theme.colors.textSecondary,
				},
				row: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
				mutedText: {
					fontSize: theme.typography.caption,
					color: theme.colors.textMuted,
				},
			}),
		[theme],
	);

	const resetForm = (): void => {
		setEditingEntryId(null);
		setType("WORK");
		setStartUtc(nowIso());
		setEndUtc(addDaysIso(1));
		setNote("");
	};

	const selectForEdit = (entry: RotaEntry): void => {
		setEditingEntryId(entry.id);
		setType(entry.type);
		setStartUtc(entry.startUtc);
		setEndUtc(entry.endUtc);
		setNote(entry.note ?? "");
		setFormError(null);
	};

	const submitEntry = async (): Promise<void> => {
		setFormError(null);

		if (!startUtc || !endUtc) {
			setFormError("Start and end are required.");
			return;
		}

		if (new Date(startUtc) >= new Date(endUtc)) {
			setFormError("Start must be before end.");
			return;
		}

		try {
			if (editingEntryId) {
				await updateRotaEntry({
					variables: {
						id: editingEntryId,
						input: {
							type,
							startUtc,
							endUtc,
							note,
						},
					},
				});
			} else {
				await createRotaEntry({
					variables: {
						input: {
							type,
							startUtc,
							endUtc,
							note,
						},
					},
				});
			}

			resetForm();
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
				resetForm();
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

	const timezone = meData?.me?.timezone || "UTC";

	return (
		<ScreenScaffold>
			<ScrollView
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
			>
				<View style={styles.card}>
					<Text style={styles.title}>
						Rota Range
					</Text>
					<WeekRangePicker
						rangeStartUtc={rangeStartUtc}
						rangeEndUtc={rangeEndUtc}
						onChangeRange={({
							rangeStartUtc:
								nextStart,
							rangeEndUtc: nextEnd,
						}) => {
							setRangeStartUtc(
								nextStart,
							);
							setRangeEndUtc(nextEnd);
						}}
						timezone={timezone}
					/>
				</View>

				<View style={styles.card}>
					<Text style={styles.title}>
						{editingEntryId
							? "Update Entry"
							: "Create Entry"}
					</Text>
					<View style={styles.typeRow}>
						{(
							[
								"WORK",
								"FREE",
							] as const
						).map((option) => (
							<ActionButton
								key={option}
								label={option}
								onPress={() =>
									setType(
										option,
									)
								}
								variant={
									type ===
									option
										? "primary"
										: "muted"
								}
							/>
						))}
					</View>
					<DateTimePickerField
						label="Starts"
						value={startUtc}
						onChangeValue={setStartUtc}
						timezone={timezone}
					/>
					<DateTimePickerField
						label="Ends"
						value={endUtc}
						onChangeValue={setEndUtc}
						timezone={timezone}
					/>
					<FormField
						label="Note"
						value={note}
						onChangeText={setNote}
						autoCapitalize="sentences"
					/>
					{formError ? (
						<StateNotice
							mode="error"
							message={formError}
						/>
					) : null}
					<View style={styles.row}>
						<ActionButton
							label={
								editingEntryId
									? "Save Update"
									: "Create Entry"
							}
							onPress={() =>
								void submitEntry()
							}
							loading={
								mutationLoading
							}
						/>
						{editingEntryId ? (
							<ActionButton
								label="Cancel Edit"
								onPress={
									resetForm
								}
								variant="muted"
							/>
						) : null}
					</View>
				</View>

				<View style={styles.card}>
					<Text style={styles.title}>
						Entries
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
					(data?.myRota?.length ?? 0) === 0 ? (
						<StateNotice
							mode="empty"
							message="No entries for this range yet."
						/>
					) : null}
					{data?.myRota?.map((entry) => (
						<View
							key={entry.id}
							style={styles.entryCard}
						>
							<Text
								style={
									styles.entryTitle
								}
							>
								{entry.type}
							</Text>
							<Text
								style={
									styles.entryMeta
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
							{entry.note ? (
								<Text
									style={
										styles.mutedText
									}
								>
									{
										entry.note
									}
								</Text>
							) : null}
							<View
								style={
									styles.row
								}
							>
								<ActionButton
									label="Edit"
									variant="muted"
									onPress={() =>
										selectForEdit(
											entry,
										)
									}
								/>
								<ActionButton
									label="Delete"
									variant="danger"
									onPress={() =>
										void removeEntry(
											entry.id,
										)
									}
								/>
							</View>
						</View>
					))}
				</View>
			</ScrollView>
		</ScreenScaffold>
	);
}
