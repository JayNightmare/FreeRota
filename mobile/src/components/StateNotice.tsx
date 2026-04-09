import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/useTheme";

interface StateNoticeProps {
	mode: "loading" | "error" | "empty";
	message: string;
}

export function StateNotice({ mode, message }: StateNoticeProps) {
	const { theme } = useTheme();

	const styles = StyleSheet.create({
		container: {
			padding: theme.spacing.md,
			borderRadius: theme.radius.md,
			borderWidth: 1,
			borderColor: mode === "error" ? "#C94A4A" : theme.colors.border,
			backgroundColor: mode === "error" ? "#3B1A1A" : theme.colors.surface,
			flexDirection: "row",
			alignItems: "center",
			gap: theme.spacing.sm
		},
		text: {
			flex: 1,
			fontSize: theme.typography.caption,
			color: mode === "error" ? "#F9D4D4" : theme.colors.textSecondary
		}
	});

	return (
		<View style={styles.container}>
			{mode === "loading" ? <ActivityIndicator color={theme.colors.accent} size="small" /> : null}
			<Text style={styles.text}>{message}</Text>
		</View>
	);
}
