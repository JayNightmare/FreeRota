import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useMutation, useQuery } from "@apollo/client";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { FormField } from "../components/FormField";
import { ActionButton } from "../components/ActionButton";
import { StateNotice } from "../components/StateNotice";
import {
	CREATE_SHIFT_TYPE_MUTATION,
	DELETE_SHIFT_TYPE_MUTATION,
	MY_SHIFT_TYPES_QUERY,
	UPDATE_SHIFT_TYPE_MUTATION,
} from "../graphql/operations";
import { useTheme } from "../theme/useTheme";
import { toUserErrorMessage } from "../utils/errors";

interface ShiftTypeItem {
	id: string;
	name: string;
	color: string;
}

interface MyShiftTypesQuery {
	myShiftTypes: ShiftTypeItem[];
}

const COLOR_PRESETS = [
	"#1E3A8A",
	"#0F766E",
	"#92400E",
	"#BE123C",
	"#6D28D9",
	"#166534",
	"#334155",
	"#C2410C",
	"#0369A1",
	"#B45309",
	"#0E7490",
	"#4C1D95",
] as const;

export function SettingsScreen() {
	const { theme } = useTheme();
	const [editingId, setEditingId] = useState<string | null>(null);
	const [tagName, setTagName] = useState("");
	const [selectedColor, setSelectedColor] = useState<string | null>(null);
	const [customColor, setCustomColor] = useState("");
	const [actionError, setActionError] = useState<string | null>(null);

	const { data, loading, error, refetch } =
		useQuery<MyShiftTypesQuery>(MY_SHIFT_TYPES_QUERY);
	const [createShiftType, { loading: creating }] = useMutation(
		CREATE_SHIFT_TYPE_MUTATION,
	);
	const [updateShiftType, { loading: updating }] = useMutation(
		UPDATE_SHIFT_TYPE_MUTATION,
	);
	const [deleteShiftType] = useMutation(DELETE_SHIFT_TYPE_MUTATION);

	const mutationLoading = creating || updating;

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
				subtitle: {
					fontSize: theme.typography.caption,
					color: theme.colors.textMuted,
				},
				colorGrid: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
				colorChip: {
					width: 34,
					height: 34,
					borderRadius: theme.radius.pill,
					borderWidth: 1,
					borderColor: theme.colors.border,
				},
				colorChipSelected: {
					borderWidth: 3,
					borderColor: theme.colors.textPrimary,
				},
				shiftRow: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					gap: theme.spacing.md,
					borderWidth: 1,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.md,
					padding: theme.spacing.md,
					backgroundColor:
						theme.colors.surfaceElevated,
				},
				shiftInfo: {
					flexDirection: "row",
					alignItems: "center",
					gap: theme.spacing.sm,
					flex: 1,
				},
				swatch: {
					width: 18,
					height: 18,
					borderRadius: theme.radius.sm,
				},
				shiftName: {
					fontSize: theme.typography.body,
					fontWeight: "700",
					color: theme.colors.textPrimary,
				},
				row: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
			}),
		[theme],
	);

	const resetForm = () => {
		setEditingId(null);
		setTagName("");
		setSelectedColor(null);
		setCustomColor("");
		setActionError(null);
	};

	const saveShiftType = async () => {
		setActionError(null);
		if (!tagName.trim()) {
			setActionError("Tag name is required.");
			return;
		}

		const colorInput = customColor.trim() || selectedColor;

		try {
			if (editingId) {
				await updateShiftType({
					variables: {
						id: editingId,
						input: {
							name: tagName.trim(),
							color: colorInput,
						},
					},
				});
			} else {
				await createShiftType({
					variables: {
						input: {
							name: tagName.trim(),
							color: colorInput,
						},
					},
				});
			}
			resetForm();
			await refetch();
		} catch (mutationError) {
			setActionError(
				toUserErrorMessage(
					mutationError,
					"Unable to save shift type.",
				),
			);
		}
	};

	const editShiftType = (item: ShiftTypeItem) => {
		setEditingId(item.id);
		setTagName(item.name);
		setSelectedColor(item.color);
		setCustomColor(item.color);
		setActionError(null);
	};

	const removeShiftType = async (id: string) => {
		setActionError(null);
		try {
			await deleteShiftType({ variables: { id } });
			if (editingId === id) {
				resetForm();
			}
			await refetch();
		} catch (mutationError) {
			setActionError(
				toUserErrorMessage(
					mutationError,
					"Unable to delete shift type.",
				),
			);
		}
	};

	return (
		<ScreenScaffold>
			<ScrollView
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
			>
				<View style={styles.card}>
					<Text style={styles.title}>
						Shift Type
					</Text>
					<Text style={styles.subtitle}>
						Create tags for your shift
						chips. Tag name becomes the
						default shift title. Leave color
						blank for random assignment.
					</Text>
					<FormField
						label="Tag Name"
						value={tagName}
						onChangeText={setTagName}
						placeholder="e.g. Bar Shift"
						autoCapitalize="words"
					/>
					<FormField
						label="Color (hex)"
						value={customColor}
						onChangeText={setCustomColor}
						placeholder="#1E3A8A"
						autoCapitalize="none"
					/>
					<View style={styles.colorGrid}>
						{COLOR_PRESETS.map((color) => {
							const isSelected =
								selectedColor ===
									color &&
								!customColor.trim();
							return (
								<Pressable
									key={
										color
									}
									onPress={() => {
										setSelectedColor(
											color,
										);
										setCustomColor(
											"",
										);
									}}
									style={[
										styles.colorChip,
										{
											backgroundColor:
												color,
										},
										isSelected
											? styles.colorChipSelected
											: undefined,
									]}
								/>
							);
						})}
					</View>
					<View style={styles.row}>
						<ActionButton
							label={
								editingId
									? "Save Tag"
									: "Add Tag"
							}
							onPress={() =>
								void saveShiftType()
							}
							loading={
								mutationLoading
							}
						/>
						{editingId ? (
							<ActionButton
								label="Cancel"
								onPress={
									resetForm
								}
								variant="muted"
							/>
						) : null}
						<ActionButton
							label="Use Random Color"
							onPress={() => {
								setSelectedColor(
									null,
								);
								setCustomColor(
									"",
								);
							}}
							variant="muted"
						/>
					</View>
					{actionError ? (
						<StateNotice
							mode="error"
							message={actionError}
						/>
					) : null}
				</View>

				<View style={styles.card}>
					<Text style={styles.title}>
						Existing Tags
					</Text>
					{loading ? (
						<StateNotice
							mode="loading"
							message="Loading shift types..."
						/>
					) : null}
					{error ? (
						<StateNotice
							mode="error"
							message={toUserErrorMessage(
								error,
								"Unable to load shift types.",
							)}
						/>
					) : null}
					{!loading &&
					!error &&
					(data?.myShiftTypes?.length ?? 0) ===
						0 ? (
						<StateNotice
							mode="empty"
							message="No shift tags yet."
						/>
					) : null}
					{data?.myShiftTypes?.map((item) => (
						<View
							key={item.id}
							style={styles.shiftRow}
						>
							<View
								style={
									styles.shiftInfo
								}
							>
								<View
									style={[
										styles.swatch,
										{
											backgroundColor:
												item.color,
										},
									]}
								/>
								<Text
									style={
										styles.shiftName
									}
								>
									{
										item.name
									}
								</Text>
							</View>
							<View
								style={
									styles.row
								}
							>
								<ActionButton
									label="Edit"
									variant="muted"
									onPress={() =>
										editShiftType(
											item,
										)
									}
								/>
								<ActionButton
									label="Delete"
									variant="danger"
									onPress={() =>
										void removeShiftType(
											item.id,
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
