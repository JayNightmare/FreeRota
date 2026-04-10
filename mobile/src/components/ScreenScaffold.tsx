import { type ReactNode } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	View,
	type ViewStyle,
} from "react-native";
import { useTheme } from "../theme/useTheme";

interface ScreenScaffoldProps {
	children: ReactNode;
	style?: ViewStyle;
}

export function ScreenScaffold({ children, style }: ScreenScaffoldProps) {
	const { theme } = useTheme();

	const styles = StyleSheet.create({
		root: {
			flex: 1,
		},
		container: {
			flex: 1,
			paddingHorizontal: theme.spacing.xl,
			marginTop: theme.spacing.xl,
			marginBottom: theme.spacing.xxl,
			backgroundColor: theme.colors.background,
		},
	});

	return (
		<KeyboardAvoidingView
			style={styles.root}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<View style={[styles.container, style]}>
				{children}
			</View>
		</KeyboardAvoidingView>
	);
}
