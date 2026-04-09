import { useMemo, useState } from "react";
import {
	Keyboard,
	StatusBar,
	Pressable,
	StyleSheet,
	Text,
	View,
	ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ApolloProvider } from "@apollo/client";
import Ionicons from "@expo/vector-icons/Ionicons";
import { apolloClient } from "./src/graphql/client";
import { AuthProvider, useAuth } from "./src/auth/AuthProvider";
import { RotaScreen } from "./src/screens/RotaScreen";
import { FriendsScreen } from "./src/screens/FriendsScreen";
import { FreeTimeScreen } from "./src/screens/FreeTimeScreen";
import { MessagesScreen } from "./src/screens/MessagesScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { ThemeProvider } from "./src/theme/ThemeProvider";
import { useTheme } from "./src/theme/useTheme";

type TabKey = "ROTA" | "FRIENDS" | "FREE" | "MESSAGES" | "PROFILE" | "SETTINGS";

const tabs: Array<{
	key: TabKey;
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
}> = [
	{ key: "ROTA", label: "Rota", icon: "calendar-outline" },
	{ key: "FRIENDS", label: "Friends", icon: "people-outline" },
	{ key: "FREE", label: "Free Time", icon: "time-outline" },
	{
		key: "MESSAGES",
		label: "Messages",
		icon: "chatbubble-ellipses-outline",
	},
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
		case "MESSAGES":
			return <MessagesScreen />;
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
	const [activeTab, setActiveTab] = useState<TabKey>("ROTA");

	const activeLabel = useMemo(
		() =>
			tabs.find((item) => item.key === activeTab)?.label ??
			"Rota",
		[activeTab],
	);

	const statusBarStyle =
		resolvedMode === "dark" ? "light-content" : "dark-content";
	const themeIconName = resolvedMode === "dark" ? "moon" : "sunny";
	const isAuthenticated = Boolean(token);

	const styles = useMemo(
		() =>
			StyleSheet.create({
				root: {
					flex: 1,
					backgroundColor:
						theme.colors.background,
				},
				header: {
					paddingHorizontal: theme.spacing.xl,
					paddingTop: theme.spacing.lg,
					paddingBottom: theme.spacing.md,
					borderBottomWidth: 1,
					borderBottomColor: theme.colors.border,
					backgroundColor: theme.colors.surface,
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "flex-start",
					columnGap: theme.spacing.md,
				},
				headerCopy: {
					flex: 1,
					gap: theme.spacing.xs,
				},
				title: {
					fontSize: theme.typography.display,
					lineHeight: 50,
					fontWeight: "800",
					letterSpacing: -1.4,
					color: theme.colors.textPrimary,
				},
				subtitle: {
					fontSize: theme.typography.caption,
					lineHeight: 20,
					fontWeight: "500",
					color: theme.colors.textMuted,
				},
				headerActions: {
					flexDirection: "row",
					alignItems: "flex-end",
					gap: theme.spacing.sm,
				},
				themeIconButton: {
					width: 44,
					height: 44,
					borderRadius: theme.radius.md,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor:
						theme.colors.surfaceMuted,
					borderWidth: 1,
					borderColor: theme.colors.border,
				},
				screenContainer: {
					flex: 1,
					paddingBottom: theme.spacing.sm,
				},
				bootContainer: {
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor:
						theme.colors.background,
				},
				tabBar: {
					flexDirection: "row",
					gap: theme.spacing.xs,
					paddingHorizontal: theme.spacing.sm,
					paddingVertical: theme.spacing.sm,
					marginHorizontal: theme.spacing.lg,
					marginBottom: theme.spacing.md,
					borderWidth: 1,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.pill,
					backgroundColor: theme.colors.surface,
					justifyContent: "space-between",
					alignItems: "center",
					shadowColor: "#000000",
					shadowOpacity: 0.14,
					shadowRadius: 12,
					shadowOffset: { width: 0, height: 6 },
					elevation: 8,
				},
				tabButton: {
					flex: 1,
					paddingHorizontal: theme.spacing.xs,
					paddingVertical: theme.spacing.sm,
					borderRadius: theme.radius.md,
					backgroundColor: "transparent",
					borderWidth: 1,
					borderColor: "transparent",
					flexDirection: "column",
					alignItems: "center",
					gap: theme.spacing.xs,
				},
				tabButtonActive: {
					backgroundColor: theme.colors.accent,
					borderColor: theme.colors.accent,
				},
				tabLabel: {
					fontSize: theme.typography.tiny,
					fontWeight: "700",
					letterSpacing: 0.15,
					color: theme.colors.textSecondary,
				},
				tabLabelActive: {
					color: theme.colors.onAccent,
				},
			}),
		[theme],
	);

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
					<Text style={styles.title}>
						FreeRota
					</Text>
					<Text style={styles.subtitle}>
						{activeLabel}
					</Text>
				</View>

				<View style={styles.headerActions}>
					<Pressable
						style={styles.themeIconButton}
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

			<View style={styles.screenContainer}>
				<ActiveScreen tab={activeTab} />
			</View>

			<View style={styles.tabBar}>
				{tabs.map((tab) => {
					const active = tab.key === activeTab;
					const iconColor = active
						? theme.colors.onAccent
						: theme.colors.textSecondary;

					return (
						<Pressable
							key={tab.key}
							onPress={() => {
								Keyboard.dismiss();
								setActiveTab(
									tab.key,
								);
							}}
							style={[
								styles.tabButton,
								active
									? styles.tabButtonActive
									: undefined,
							]}
						>
							<Ionicons
								name={tab.icon}
								size={18}
								color={
									iconColor
								}
							/>
						</Pressable>
					);
				})}
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
