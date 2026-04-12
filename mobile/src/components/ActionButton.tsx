import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "../theme/useTheme";

interface ActionButtonProps {
	label: string;
	onPress: () => void;
	loading?: boolean;
	disabled?: boolean;
	variant?: "primary" | "muted" | "danger";
}

export function ActionButton({
	label,
	onPress,
	loading,
	disabled,
	variant = "primary",
}: ActionButtonProps) {
	const { theme } = useTheme();
	const dangerColor = "#C94A4A";

	const styles = StyleSheet.create({
		button: {
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.sm,
			height: 40,
			borderRadius: theme.radius.md,
			alignItems: "center",
			justifyContent: "center",
			borderWidth: 1,
			borderColor:
				variant === "danger"
					? dangerColor
					: variant === "muted"
						? theme.colors.border
						: theme.colors.accent,
			backgroundColor:
				variant === "danger"
					? dangerColor
					: variant === "muted"
						? theme.colors.surfaceMuted
						: theme.colors.accent,
			opacity: disabled ? 0.55 : 1,
		},
		label: {
			fontSize: theme.typography.caption,
			fontWeight: "700",
			color:
				variant === "muted"
					? theme.colors.textPrimary
					: theme.colors.onAccent,
		},
	});

	return (
		<Pressable
			style={styles.button}
			onPress={onPress}
			disabled={disabled || loading}
		>
			{loading ? (
				<ActivityIndicator
					color={theme.colors.onAccent}
					size="small"
				/>
			) : (
				<Text style={styles.label}>{label}</Text>
			)}
		</Pressable>
	);
}
