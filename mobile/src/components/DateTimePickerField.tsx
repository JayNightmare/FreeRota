import {
	createElement,
	type CSSProperties,
	useEffect,
	useMemo,
	useState,
} from "react";
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

function formatWebDateValue(value: Date): string {
	const year = value.getFullYear();
	const month = String(value.getMonth() + 1).padStart(2, "0");
	const day = String(value.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function formatWebTimeValue(value: Date): string {
	const hours = String(value.getHours()).padStart(2, "0");
	const minutes = String(value.getMinutes()).padStart(2, "0");
	return `${hours}:${minutes}`;
}

function parseWebDateInput(value: string): Date | null {
	const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) {
		return null;
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const next = new Date(year, month - 1, day);

	if (
		next.getFullYear() !== year ||
		next.getMonth() !== month - 1 ||
		next.getDate() !== day
	) {
		return null;
	}

	return next;
}

function parseWebTimeInput(value: string): Date | null {
	const match = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
	if (!match) {
		return null;
	}

	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	const next = new Date();
	next.setHours(hours, minutes, 0, 0);
	return next;
}

export function DateTimePickerField({
	label,
	value,
	onChangeValue,
	timezone,
}: DateTimePickerFieldProps) {
	const { theme, resolvedMode } = useTheme();
	const isWeb = Platform.OS === "web";
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);
	const [webDateInput, setWebDateInput] = useState("");
	const [webTimeInput, setWebTimeInput] = useState("");

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

	const webInputStyle = useMemo<CSSProperties>(
		() => ({
			minWidth: 148,
			height: 40,
			border: `1px solid ${theme.colors.border}`,
			borderRadius: theme.radius.md,
			padding: `0 ${theme.spacing.md}px`,
			fontSize: theme.typography.caption,
			fontWeight: 600,
			color: theme.colors.textPrimary,
			backgroundColor: theme.colors.surfaceMuted,
			colorScheme: resolvedMode === "dark" ? "dark" : "light",
		}),
		[resolvedMode, theme],
	);

	useEffect(() => {
		if (!isWeb) {
			return;
		}

		const nextParsedValue = parseIsoDate(value);

		setWebDateInput(formatWebDateValue(nextParsedValue));
		setWebTimeInput(formatWebTimeValue(nextParsedValue));
	}, [isWeb, value]);

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

			{isWeb ? (
				<View style={styles.row}>
					{createElement("input", {
						type: "date",
						value: webDateInput,
						onChange: (event: {
							target: {
								value: string;
							};
						}) => {
							const nextValue =
								event.target
									.value;
							setWebDateInput(
								nextValue,
							);

							const selectedDate =
								parseWebDateInput(
									nextValue,
								);
							if (!selectedDate) {
								return;
							}

							onChangeValue(
								updateIsoDatePart(
									value,
									selectedDate,
								),
							);
						},
						onBlur: () => {
							if (
								webDateInput.trim()
							) {
								return;
							}

							setWebDateInput(
								formatWebDateValue(
									parsedValue,
								),
							);
						},
						style: webInputStyle,
						"aria-label": `${label} date`,
					})}
					{createElement("input", {
						type: "time",
						value: webTimeInput,
						step: 60,
						onChange: (event: {
							target: {
								value: string;
							};
						}) => {
							const nextValue =
								event.target
									.value;
							setWebTimeInput(
								nextValue,
							);

							const selectedTime =
								parseWebTimeInput(
									nextValue,
								);
							if (!selectedTime) {
								return;
							}

							onChangeValue(
								updateIsoTimePart(
									value,
									selectedTime,
								),
							);
						},
						onBlur: () => {
							if (
								webTimeInput.trim()
							) {
								return;
							}

							setWebTimeInput(
								formatWebTimeValue(
									parsedValue,
								),
							);
						},
						style: webInputStyle,
						"aria-label": `${label} time`,
					})}
				</View>
			) : (
				<View style={styles.row}>
					<Pressable
						style={styles.pickerButton}
						onPress={() => {
							setShowDatePicker(true);
							setShowTimePicker(
								false,
							);
						}}
					>
						<Text
							style={
								styles.pickerButtonLabel
							}
						>
							Pick Date
						</Text>
					</Pressable>
					<Pressable
						style={styles.pickerButton}
						onPress={() => {
							setShowTimePicker(true);
							setShowDatePicker(
								false,
							);
						}}
					>
						<Text
							style={
								styles.pickerButtonLabel
							}
						>
							Pick Time
						</Text>
					</Pressable>
				</View>
			)}

			{!isWeb && showDatePicker ? (
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

			{!isWeb && showTimePicker ? (
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
