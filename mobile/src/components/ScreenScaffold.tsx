import { type ReactNode } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	View,
	type ViewStyle,
} from "react-native";
import { useTheme } from "../theme/useTheme";
import { ScrollView } from "react-native";

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
			backgroundColor: theme.colors.background,
		},
		childrenContent: {
			paddingHorizontal: theme.spacing.xl,
			paddingVertical: theme.spacing.xl,
			flexGrow: 1,
		},
	});

	return (
		<KeyboardAvoidingView
			style={styles.root}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<ScrollView
				style={styles.container}
				contentContainerStyle={[
					styles.childrenContent,
					style,
				]}
				showsVerticalScrollIndicator={false}
			>
				{children}
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
