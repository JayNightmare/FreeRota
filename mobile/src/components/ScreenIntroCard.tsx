import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/useTheme";

interface ScreenIntroCardProps {
	title: string;
	description: string;
}

export function ScreenIntroCard({
	title,
	description,
}: ScreenIntroCardProps) {
	const { theme } = useTheme();

	const styles = StyleSheet.create({
		card: {
			backgroundColor: theme.colors.surface,
			borderRadius: theme.radius.lg,
			paddingHorizontal: theme.spacing.lg,
			paddingVertical: theme.spacing.xl,
			borderWidth: 1,
			borderColor: theme.colors.border,
			shadowColor: "#000000",
			shadowOpacity: 0.07,
			shadowRadius: 12,
			shadowOffset: { width: 0, height: 5 },
			elevation: 4,
			gap: theme.spacing.md,
		},
		title: {
			fontSize: 40,
			lineHeight: 46,
			fontWeight: "800",
			letterSpacing: -1,
			color: theme.colors.textPrimary,
		},
		description: {
			fontSize: theme.typography.body,
			lineHeight: 28,
			color: theme.colors.textSecondary,
		},
	});

	return (
		<View style={styles.card}>
			<Text style={styles.title}>{title}</Text>
			<Text style={styles.description}>{description}</Text>
		</View>
	);
}
