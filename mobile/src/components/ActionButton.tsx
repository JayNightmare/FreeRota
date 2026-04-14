import { useRef } from "react";
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	Animated,
} from "react-native";
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

	const scaleValue = useRef(new Animated.Value(1)).current;

	const handlePressIn = () => {
		Animated.spring(scaleValue, {
			toValue: 0.96,
			useNativeDriver: true,
		}).start();
	};

	const handlePressOut = () => {
		Animated.spring(scaleValue, {
			toValue: 1,
			useNativeDriver: true,
		}).start();
	};

	const bg =
		variant === "danger"
			? dangerColor
			: variant === "muted"
				? theme.colors.surfaceElevated
				: theme.colors.accent;

	const textColor =
		variant === "danger"
			? "#FFFFFF"
			: variant === "muted"
				? theme.colors.accent
				: theme.colors.onAccent;

	const borderColor =
		variant === "muted" ? theme.colors.border : "#000000";

	const styles = StyleSheet.create({
		button: {
			height: 44,
			borderRadius: theme.radius.md,
			alignItems: "center",
			justifyContent: "center",
			borderWidth: theme.borderWidth,
			borderColor,
			backgroundColor: bg,
			opacity: disabled ? 0.55 : 1,
			...theme.shadowSm,
		},
		label: {
			fontSize: theme.typography.caption,
			fontWeight: "900",
			textTransform: "uppercase",
			letterSpacing: 0.5,
			color: textColor,
		},
		pressable: {
			paddingHorizontal: theme.spacing.lg,
			paddingVertical: theme.spacing.sm + 2,
			flex: 1,
			width: "100%",
			alignItems: "center",
			justifyContent: "center",
		},
	});

	return (
		<>
			<Animated.View
				style={[
					styles.button,
					{ transform: [{ scale: scaleValue }] },
				]}
			>
				<Pressable
					style={styles.pressable}
					onPress={onPress}
					onPressIn={handlePressIn}
					onPressOut={handlePressOut}
					disabled={disabled || loading}
				>
					{loading ? (
						<ActivityIndicator
							color={textColor}
							size="small"
						/>
					) : (
						<Text style={styles.label}>
							{label}
						</Text>
					)}
				</Pressable>
			</Animated.View>
		</>
	);
}
