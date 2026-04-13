import { useRef } from "react";
import {
	Animated,
	StyleSheet,
	Text,
	TextInput,
	type TextInputProps,
	View,
} from "react-native";
import { useTheme } from "../theme/useTheme";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

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

	const focusAnim = useRef(new Animated.Value(0)).current;

	const handleFocus = () => {
		Animated.timing(focusAnim, {
			toValue: 1,
			duration: 200,
			useNativeDriver: false,
		}).start();
	};

	const handleBlur = () => {
		Animated.timing(focusAnim, {
			toValue: 0,
			duration: 250,
			useNativeDriver: false,
		}).start();
	};

	const animatedBorderColor = focusAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [theme.colors.border, theme.colors.tertiary],
	});
	
	const animatedBgColor = focusAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [theme.colors.surfaceMuted, theme.colors.surfaceElevated],
	});

	const styles = StyleSheet.create({
		container: {
			gap: theme.spacing.xs,
		},
		label: {
			fontSize: theme.typography.tiny,
			fontWeight: "900",
			textTransform: "uppercase",
			letterSpacing: 1,
			color: theme.colors.textMuted,
		},
		input: {
			borderWidth: theme.borderWidth,
			borderRadius: theme.radius.md,
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.sm,
			fontSize: theme.typography.body,
			fontWeight: "500",
			color: theme.colors.textPrimary,
		},
	});

	return (
		<View style={styles.container}>
			<Text style={styles.label}>{label}</Text>
			<AnimatedTextInput
				value={value}
				onChangeText={onChangeText}
				onFocus={handleFocus}
				onBlur={handleBlur}
				style={[
					styles.input,
					{
						borderColor: animatedBorderColor as unknown as string,
						backgroundColor: animatedBgColor as unknown as string,
					},
				]}
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
