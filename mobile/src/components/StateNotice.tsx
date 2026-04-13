import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, Animated } from "react-native";
import { useTheme } from "../theme/useTheme";

interface StateNoticeProps {
	mode: "loading" | "error" | "empty";
	message: string;
}

export function StateNotice({ mode, message }: StateNoticeProps) {
	const { theme } = useTheme();

	const animValue = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		animValue.setValue(0);
		Animated.timing(animValue, {
			toValue: 1,
			duration: 200,
			useNativeDriver: true,
		}).start();
	}, [mode, message, animValue]);

	const translateY = animValue.interpolate({
		inputRange: [0, 1],
		outputRange: [5, 0],
	});

	const styles = StyleSheet.create({
		container: {
			padding: theme.spacing.md,
			borderRadius: theme.radius.md,
			borderWidth: theme.borderWidth,
			borderColor: mode === "error" ? theme.colors.error : theme.colors.border,
			backgroundColor: mode === "error" ? "#1a0505" : theme.colors.surface,
			flexDirection: "row",
			alignItems: "center",
			gap: theme.spacing.sm,
		},
		text: {
			flex: 1,
			fontSize: theme.typography.caption,
			fontWeight: "700",
			textTransform: "uppercase",
			letterSpacing: 0.5,
			color: mode === "error" ? theme.colors.error : theme.colors.textSecondary,
		},
	});

	return (
		<Animated.View style={[styles.container, { opacity: animValue, transform: [{ translateY }] }]}>
			{mode === "loading" ? <ActivityIndicator color={theme.colors.accent} size="small" /> : null}
			<Text style={styles.text}>{message}</Text>
		</Animated.View>
	);
}
