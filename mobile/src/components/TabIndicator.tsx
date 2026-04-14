import React, { useRef } from "react";
import { Pressable, Animated, Keyboard } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export function TabIndicator({ tab, activeTab, onSelect, theme, styles }: any) {
	const active = tab.key === activeTab;
	const iconColor = active ? theme.colors.accent : theme.colors.textTab;
	const scaleAnim = useRef(new Animated.Value(1)).current;

	const handlePressIn = () => {
		Animated.spring(scaleAnim, {
			toValue: 0.85,
			useNativeDriver: true,
		}).start();
	};

	const handlePressOut = () => {
		Animated.spring(scaleAnim, {
			toValue: 1,
			useNativeDriver: true,
		}).start();
	};

	return (
		<Pressable
			onPress={() => {
				Keyboard.dismiss();
				onSelect(tab.key);
			}}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			style={[
				styles.tabButton,
				active ? styles.tabButtonActive : undefined,
			]}
		>
			<Animated.View
				style={{ transform: [{ scale: scaleAnim }] }}
			>
				<Ionicons
					name={tab.icon}
					size={22}
					color={iconColor}
				/>
			</Animated.View>
		</Pressable>
	);
}
