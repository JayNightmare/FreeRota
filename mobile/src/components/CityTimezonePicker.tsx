import { useEffect, useMemo, useState } from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import {
	MAJOR_CITY_TIMEZONES,
	type TimezoneOption,
} from "../constants/timezones";
import { useTheme } from "../theme/useTheme";
import { formatTimezoneNow, getTimezoneOffsetLabel } from "../utils/time";

interface CityTimezonePickerProps {
	label: string;
	value: string;
	onChangeValue: (timezone: string) => void;
	placeholder?: string;
}

function buildTimezoneLabel(option: TimezoneOption): string {
	return `${option.city}, ${option.region}`;
}

export function CityTimezonePicker({
	label,
	value,
	onChangeValue,
	placeholder,
}: CityTimezonePickerProps) {
	const { theme } = useTheme();
	const [query, setQuery] = useState("");
	const [isFocused, setIsFocused] = useState(false);

	const selectedOption = useMemo(
		() =>
			MAJOR_CITY_TIMEZONES.find(
				(option) => option.zone === value,
			),
		[value],
	);

	useEffect(() => {
		if (!isFocused && selectedOption) {
			setQuery(buildTimezoneLabel(selectedOption));
		}
		if (!isFocused && !selectedOption && value) {
			setQuery(value);
		}
		if (!isFocused && !value) {
			setQuery("");
		}
	}, [isFocused, selectedOption, value]);

	const filteredOptions = useMemo(() => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) {
			return MAJOR_CITY_TIMEZONES.slice(0, 8);
		}

		return MAJOR_CITY_TIMEZONES.filter((option) => {
			const haystack =
				`${option.city} ${option.region} ${option.zone}`.toLowerCase();
			return haystack.includes(normalized);
		}).slice(0, 10);
	}, [query]);

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
				input: {
					borderWidth: 1,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.md,
					paddingHorizontal: theme.spacing.md,
					paddingVertical: theme.spacing.sm,
					fontSize: theme.typography.body,
					color: theme.colors.textPrimary,
					backgroundColor:
						theme.colors.surfaceElevated,
				},
				resultContainer: {
					maxHeight: 180,
					borderWidth: 1,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.md,
					backgroundColor: theme.colors.surface,
				},
				option: {
					paddingHorizontal: theme.spacing.md,
					paddingVertical: theme.spacing.sm,
					borderBottomWidth: 1,
					borderBottomColor: theme.colors.border,
					gap: theme.spacing.xs,
				},
				optionTitle: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					color: theme.colors.textPrimary,
				},
				optionMeta: {
					fontSize: theme.typography.tiny,
					color: theme.colors.textMuted,
				},
				selectedMeta: {
					fontSize: theme.typography.tiny,
					color: theme.colors.textSecondary,
				},
			}),
		[theme],
	);

	return (
		<View style={styles.container}>
			<Text style={styles.label}>{label}</Text>
			<TextInput
				value={query}
				onChangeText={setQuery}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				style={styles.input}
				placeholder={
					placeholder ?? "Search city or timezone"
				}
				placeholderTextColor={theme.colors.textMuted}
				autoCapitalize="words"
			/>

			{isFocused ? (
				<View style={styles.resultContainer}>
					<ScrollView keyboardShouldPersistTaps="handled">
						{filteredOptions.map(
							(option) => (
								<Pressable
									key={
										option.zone
									}
									style={
										styles.option
									}
									onPress={() => {
										onChangeValue(
											option.zone,
										);
										setQuery(
											buildTimezoneLabel(
												option,
											),
										);
										setIsFocused(
											false,
										);
									}}
								>
									<Text
										style={
											styles.optionTitle
										}
									>
										{buildTimezoneLabel(
											option,
										)}
									</Text>
									<Text
										style={
											styles.optionMeta
										}
									>
										{
											option.zone
										}{" "}
										·{" "}
										{getTimezoneOffsetLabel(
											option.zone,
										)}
									</Text>
								</Pressable>
							),
						)}
					</ScrollView>
				</View>
			) : null}

			{value ? (
				<Text style={styles.selectedMeta}>
					Current: {value} ·{" "}
					{formatTimezoneNow(value)}
				</Text>
			) : null}
		</View>
	);
}
