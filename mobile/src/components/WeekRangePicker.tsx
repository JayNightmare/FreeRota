import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/useTheme";
import { buildWeekRange } from "../utils/time";
import { DateTimePickerField } from "./DateTimePickerField";

interface WeekRangePickerProps {
	rangeStartUtc: string;
	rangeEndUtc: string;
	onChangeRange: (next: {
		rangeStartUtc: string;
		rangeEndUtc: string;
	}) => void;
	timezone?: string;
}

export function WeekRangePicker({
	rangeStartUtc,
	rangeEndUtc,
	onChangeRange,
	timezone,
}: WeekRangePickerProps) {
	const { theme } = useTheme();

	const styles = useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: theme.spacing.md,
				},
				presetRow: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
				presetButton: {
					paddingHorizontal: theme.spacing.md,
					paddingVertical: theme.spacing.sm,
					borderRadius: theme.radius.pill,
					borderWidth: 1,
					borderColor: theme.colors.border,
					backgroundColor:
						theme.colors.surfaceMuted,
				},
				presetLabel: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					color: theme.colors.textPrimary,
				},
			}),
		[theme],
	);

	const applyWeekPreset = (offsetWeeks: number): void => {
		const range = buildWeekRange(offsetWeeks);
		onChangeRange({
			rangeStartUtc: range.startIso,
			rangeEndUtc: range.endIso,
		});
	};

	return (
		<View style={styles.container}>
			<View style={styles.presetRow}>
				<Pressable
					style={styles.presetButton}
					onPress={() => applyWeekPreset(0)}
				>
					<Text style={styles.presetLabel}>
						This Week
					</Text>
				</Pressable>
				<Pressable
					style={styles.presetButton}
					onPress={() => applyWeekPreset(1)}
				>
					<Text style={styles.presetLabel}>
						Next Week
					</Text>
				</Pressable>
				<Pressable
					style={styles.presetButton}
					onPress={() => applyWeekPreset(2)}
				>
					<Text style={styles.presetLabel}>
						In 2 Weeks
					</Text>
				</Pressable>
			</View>

			<DateTimePickerField
				label="Range Start"
				value={rangeStartUtc}
				onChangeValue={(next) =>
					onChangeRange({
						rangeStartUtc: next,
						rangeEndUtc,
					})
				}
				timezone={timezone}
			/>
			<DateTimePickerField
				label="Range End"
				value={rangeEndUtc}
				onChangeValue={(next) =>
					onChangeRange({
						rangeStartUtc,
						rangeEndUtc: next,
					})
				}
				timezone={timezone}
			/>
		</View>
	);
}
