import { useEffect, useMemo, useState } from "react";
import {
	Keyboard,
	StatusBar,
	Pressable,
	StyleSheet,
	Text,
	View,
	ActivityIndicator,
	Platform,
	useWindowDimensions,
	Animated,
} from "react-native";
import { useRef } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ApolloProvider } from "@apollo/client";
import Ionicons from "@expo/vector-icons/Ionicons";
import { apolloClient } from "./src/graphql/client";
import { AuthProvider, useAuth } from "./src/auth/AuthProvider";
import { RotaScreen } from "./src/screens/RotaScreen";
import { FriendsScreen } from "./src/screens/FriendsScreen";
import { FreeTimeScreen } from "./src/screens/FreeTimeScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { ThemeProvider } from "./src/theme/ThemeProvider";
import { useTheme } from "./src/theme/useTheme";
import { TabIndicator } from "./src/components/TabIndicator";

type TabKey = "ROTA" | "FRIENDS" | "FREE" | "PROFILE" | "SETTINGS";

const tabs: Array<{
	key: TabKey;
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
}> = [
	{ key: "ROTA", label: "Rota", icon: "calendar-outline" },
	{ key: "FRIENDS", label: "Friends", icon: "people-outline" },
	{ key: "FREE", label: "Free Time", icon: "time-outline" },
	{ key: "PROFILE", label: "Profile", icon: "person-outline" },
];

function ActiveScreen({ tab }: { tab: TabKey }) {
	switch (tab) {
		case "ROTA":
			return <RotaScreen />;
		case "FRIENDS":
			return <FriendsScreen />;
		case "FREE":
			return <FreeTimeScreen />;
		case "PROFILE":
			return <ProfileScreen />;
		case "SETTINGS":
			return <SettingsScreen />;
		default:
			return <RotaScreen />;
	}
}

function AppShell() {
	const { theme, resolvedMode, toggleColorMode } = useTheme();
	const { token, isBootstrapping } = useAuth();
	const { width, height } = useWindowDimensions();
	const [activeTab, setActiveTab] = useState<TabKey>("ROTA");
	const isWeb = Platform.OS === "web";
	const isPortrait = height >= width;
	const isDesktopViewport = width >= 900;
	const shouldBlockWebUsage = isWeb && (!isPortrait || isDesktopViewport);

	useEffect(() => {
		if (isWeb && typeof document !== "undefined") {
			document.body.style.backgroundColor =
				theme.colors.background;
			document.body.style.margin = "0";
			document.body.style.padding = "0";
			document.body.style.height = "100%";
			document.documentElement.style.height = "100%";
		}
	}, [isWeb, theme.colors.background]);

	const activeLabel = useMemo(
		() =>
			tabs.find((item) => item.key === activeTab)?.label ??
			"Rota",
		[activeTab],
	);

	const fadeAnim = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		fadeAnim.setValue(0.75);
		Animated.timing(fadeAnim, {
			toValue: 1,
			duration: 250,
			useNativeDriver: true,
		}).start();
	}, [activeTab]);

	const statusBarStyle =
		resolvedMode === "dark" ? "light-content" : "dark-content";
	const themeIconName = resolvedMode === "dark" ? "moon" : "sunny";
	const isAuthenticated = Boolean(token);

	const styles = useMemo(
		() =>
			StyleSheet.create({
				root: {
					display: "flex",
					flex: 1,
					backgroundColor:
						theme.colors.background,
				},
				body: {
					backgroundColor:
						theme.colors.background,
				},
				header: {
					paddingHorizontal: theme.spacing.xl,
					paddingTop: theme.spacing.md,
					paddingBottom: theme.spacing.md,
					borderBottomWidth: 1,
					borderBottomColor: theme.colors.border,
					backgroundColor:
						theme.colors.background,
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					columnGap: theme.spacing.md,
				},
				headerCopy: {
					flex: 1,
					flexDirection: "row",
					alignItems: "center",
					gap: theme.spacing.md,
				},
				title: {
					fontSize: theme.typography.heading - 12,
					lineHeight: 28,
					fontWeight: "900",
					letterSpacing: -1,
					textTransform: "uppercase",
					color: theme.colors.accent,
				},
				subtitle: {
					fontSize: theme.typography.caption,
					lineHeight: 20,
					fontWeight: "700",
					textTransform: "uppercase",
					letterSpacing: 1,
					color: theme.colors.textMuted,
				},
				headerActions: {
					flexDirection: "row",
					alignItems: "center",
					gap: theme.spacing.sm,
				},
				themeIconButton: {
					width: 40,
					height: 40,
					borderRadius: theme.radius.md,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor:
						theme.colors.surfaceMuted,
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
				},
				themeIconButtonActive: {
					borderColor: theme.colors.accent,
				},
				screenContainer: {
					flex: 1,
				},
				bootContainer: {
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor:
						theme.colors.background,
				},
				blockedContainer: {
					flex: 1,
					backgroundColor:
						theme.colors.background,
					paddingHorizontal: theme.spacing.xl,
					alignItems: "center",
					justifyContent: "center",
				},
				blockedCard: {
					width: "100%",
					maxWidth: 420,
					borderRadius: theme.radius.lg,
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					backgroundColor: theme.colors.surface,
					padding: theme.spacing.lg,
					gap: theme.spacing.md,
					...theme.shadowSm,
				},
				blockedTitle: {
					fontSize: theme.typography.heading,
					fontWeight: "900",
					textTransform: "uppercase",
					color: theme.colors.textPrimary,
				},
				blockedSubtitle: {
					fontSize: theme.typography.caption,
					lineHeight: 22,
					fontWeight: "700",
					textTransform: "uppercase",
					letterSpacing: 0.5,
					color: theme.colors.textSecondary,
				},
				tabBar: {
					flexDirection: "row",
					backgroundColor:
						theme.colors.surfaceTab,
					borderTopWidth: 2,
					borderTopColor: theme.colors.surface,
					paddingBottom: 6,
				},
				tabButton: {
					flex: 1,
					paddingTop: theme.spacing.sm,
					paddingBottom: theme.spacing.xs,
					flexDirection: "column",
					alignItems: "center",
					gap: 2,
					borderTopWidth: 2,
					borderTopColor: "transparent",
				},
				tabButtonActive: {
					borderTopColor: theme.colors.accent,
				},
			}),
		[theme],
	);

	if (shouldBlockWebUsage) {
		const blockedMessage = isDesktopViewport
			? "FreeRota web access is limited to portrait screens. Please open this on a mobile device"
			: "FreeRota supports portrait mode only. Rotate your device to portrait to continue";

		return (
			<SafeAreaView
				style={styles.blockedContainer}
				edges={["top", "left", "right", "bottom"]}
			>
				<StatusBar
					barStyle={statusBarStyle}
					backgroundColor={
						theme.colors.background
					}
				/>
				<View style={styles.blockedCard}>
					<Text style={styles.blockedTitle}>
						Mobile Portrait Only
					</Text>
					<Text style={styles.blockedSubtitle}>
						{blockedMessage}
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (isBootstrapping) {
		return (
			<SafeAreaView
				style={styles.bootContainer}
				edges={["top", "left", "right", "bottom"]}
			>
				<ActivityIndicator
					color={theme.colors.accent}
					size="large"
				/>
			</SafeAreaView>
		);
	}

	if (!isAuthenticated) {
		return <AuthScreen />;
	}

	return (
		<SafeAreaView
			style={styles.root}
			edges={["top", "left", "right", "bottom"]}
		>
			<StatusBar
				barStyle={statusBarStyle}
				backgroundColor={theme.colors.surface}
			/>

			<View style={styles.header}>
				<View style={styles.headerCopy}>
					<Pressable
						onPress={() =>
							setActiveTab("ROTA")
						}
					>
						<Text style={styles.title}>
							FreeRota
						</Text>
					</Pressable>
					<Text style={styles.subtitle}>
						{activeLabel}
					</Text>
				</View>

				<View style={styles.headerActions}>
					<Pressable
						style={[
							styles.themeIconButton,
							activeTab === "SETTINGS"
								? styles.themeIconButtonActive
								: undefined,
						]}
						onPress={() =>
							setActiveTab("SETTINGS")
						}
					>
						<Ionicons
							name="settings-outline"
							size={20}
							color={
								theme.colors
									.textPrimary
							}
						/>
					</Pressable>
					<Pressable
						style={styles.themeIconButton}
						onPress={toggleColorMode}
					>
						<Ionicons
							name={themeIconName}
							size={20}
							color={
								theme.colors
									.textPrimary
							}
						/>
					</Pressable>
				</View>
			</View>

			<Animated.View
				style={[
					styles.screenContainer,
					{ opacity: fadeAnim },
				]}
			>
				<ActiveScreen tab={activeTab} />
			</Animated.View>

			<View style={styles.tabBar}>
				{tabs.map((tab) => (
					<TabIndicator
						key={tab.key}
						tab={tab}
						activeTab={activeTab}
						onSelect={setActiveTab}
						theme={theme}
						styles={styles}
					/>
				))}
			</View>
		</SafeAreaView>
	);
}

export default function App() {
	return (
		<ApolloProvider client={apolloClient}>
			<AuthProvider>
				<ThemeProvider>
					<SafeAreaProvider>
						<AppShell />
					</SafeAreaProvider>
				</ThemeProvider>
			</AuthProvider>
		</ApolloProvider>
	);
}
