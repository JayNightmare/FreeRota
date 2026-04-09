import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, {
	type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useTheme } from "../theme/useTheme";
import {
	formatDateTime,
	parseIsoDate,
	updateIsoDatePart,
	updateIsoTimePart,
} from "../utils/time";

interface DateTimePickerFieldProps {
	label: string;
	value: string;
	onChangeValue: (value: string) => void;
	timezone?: string;
}

export function DateTimePickerField({
	label,
	value,
	onChangeValue,
	timezone,
}: DateTimePickerFieldProps) {
	const { theme, resolvedMode } = useTheme();
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);

	const parsedValue = parseIsoDate(value);

	const styles = useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: theme.spacing.xs,
				},
				label: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					color: theme.colors.textSecondary,
				},
				valueContainer: {
					borderWidth: 1,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.md,
					paddingHorizontal: theme.spacing.md,
					paddingVertical: theme.spacing.sm,
					backgroundColor:
						theme.colors.surfaceElevated,
				},
				valueText: {
					fontSize: theme.typography.body,
					color: theme.colors.textPrimary,
					fontWeight: "600",
				},
				row: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
				pickerButton: {
					paddingHorizontal: theme.spacing.md,
					paddingVertical: theme.spacing.sm,
					borderWidth: 1,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.md,
					backgroundColor:
						theme.colors.surfaceMuted,
				},
				pickerButtonLabel: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					color: theme.colors.textPrimary,
				},
			}),
		[theme],
	);

	const handleDateChange = (
		event: DateTimePickerEvent,
		selectedDate?: Date,
	): void => {
		if (Platform.OS !== "ios") {
			setShowDatePicker(false);
		}

		if (event.type !== "set" || !selectedDate) {
			return;
		}

		onChangeValue(updateIsoDatePart(value, selectedDate));
	};

	const handleTimeChange = (
		event: DateTimePickerEvent,
		selectedTime?: Date,
	): void => {
		if (Platform.OS !== "ios") {
			setShowTimePicker(false);
		}

		if (event.type !== "set" || !selectedTime) {
			return;
		}

		onChangeValue(updateIsoTimePart(value, selectedTime));
	};

	const pickerThemeVariant = resolvedMode === "dark" ? "dark" : "light";

	return (
		<View style={styles.container}>
			<Text style={styles.label}>{label}</Text>
			<View style={styles.valueContainer}>
				<Text style={styles.valueText}>
					{formatDateTime(value, timezone)}
				</Text>
			</View>
			<View style={styles.row}>
				<Pressable
					style={styles.pickerButton}
					onPress={() => {
						setShowDatePicker(true);
						setShowTimePicker(false);
					}}
				>
					<Text style={styles.pickerButtonLabel}>
						Pick Date
					</Text>
				</Pressable>
				<Pressable
					style={styles.pickerButton}
					onPress={() => {
						setShowTimePicker(true);
						setShowDatePicker(false);
					}}
				>
					<Text style={styles.pickerButtonLabel}>
						Pick Time
					</Text>
				</Pressable>
			</View>

			{showDatePicker ? (
				<DateTimePicker
					mode="date"
					value={parsedValue}
					onChange={handleDateChange}
					themeVariant={pickerThemeVariant}
					textColor={theme.colors.textPrimary}
					display={
						Platform.OS === "ios"
							? "spinner"
							: "default"
					}
				/>
			) : null}

			{showTimePicker ? (
				<DateTimePicker
					mode="time"
					value={parsedValue}
					onChange={handleTimeChange}
					themeVariant={pickerThemeVariant}
					textColor={theme.colors.textPrimary}
					display={
						Platform.OS === "ios"
							? "spinner"
							: "default"
					}
				/>
			) : null}
		</View>
	);
}
