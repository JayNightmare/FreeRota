import {
	StyleSheet,
	Text,
	TextInput,
	type TextInputProps,
	View,
} from "react-native";
import { useTheme } from "../theme/useTheme";

interface FormFieldProps {
	label: string;
	value: string;
	onChangeText: (text: string) => void;
	placeholder?: string;
	secureTextEntry?: boolean;
	autoCapitalize?: "none" | "sentences" | "words" | "characters";
	keyboardType?: TextInputProps["keyboardType"];
}

export function FormField({
	label,
	value,
	onChangeText,
	placeholder,
	secureTextEntry,
	autoCapitalize = "none",
	keyboardType = "default",
}: FormFieldProps) {
	const { theme } = useTheme();

	const styles = StyleSheet.create({
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
			backgroundColor: theme.colors.surfaceElevated,
		},
	});

	return (
		<View style={styles.container}>
			<Text style={styles.label}>{label}</Text>
			<TextInput
				value={value}
				onChangeText={onChangeText}
				style={styles.input}
				autoCapitalize={autoCapitalize}
				keyboardType={keyboardType}
				placeholder={placeholder}
				placeholderTextColor={theme.colors.textMuted}
				secureTextEntry={secureTextEntry}
				returnKeyType="done"
			/>
		</View>
	);
}
