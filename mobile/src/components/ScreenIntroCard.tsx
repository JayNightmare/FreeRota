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
			backgroundColor: theme.colors.surfaceMuted,
			borderRadius: theme.radius.lg,
			paddingHorizontal: theme.spacing.lg,
			paddingVertical: theme.spacing.xl,
			borderWidth: theme.borderWidth,
			borderColor: theme.colors.border,
			gap: theme.spacing.md,
			...theme.shadowSm,
		},
		title: {
			fontSize: 40,
			lineHeight: 46,
			fontWeight: "900",
			letterSpacing: -2,
			textTransform: "uppercase",
			color: theme.colors.textPrimary,
		},
		description: {
			fontSize: theme.typography.body,
			lineHeight: 28,
			fontWeight: "500",
			textTransform: "uppercase",
			letterSpacing: 0.5,
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
