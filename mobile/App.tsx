import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Keyboard,
	StatusBar,
	Pressable,
	Modal,
	ScrollView,
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
import { ApolloProvider, useMutation, useQuery } from "@apollo/client";
import Ionicons from "@expo/vector-icons/Ionicons";
import { apolloClient } from "./src/graphql/client";
import { AuthProvider, useAuth } from "./src/auth/AuthProvider";
import { RotaScreen } from "./src/screens/RotaScreen";
import { FriendsScreen } from "./src/screens/FriendsScreen";
import { FreeTimeScreen } from "./src/screens/FreeTimeScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { DesktopLandingScreen } from "./src/screens/DesktopLandingScreen";
import {
	DesktopEnterpriseInquiryScreen,
	DesktopEnterpriseScreen,
	DesktopGetStartedScreen,
	DesktopLoginScreen,
	DesktopPlatformScreen,
	DesktopPricingScreen,
	DesktopSolutionsScreen,
} from "./src/screens/DesktopRouteScreens";
import { AuthScreen, type AuthMode } from "./src/screens/AuthScreen";
import { ThemeProvider } from "./src/theme/ThemeProvider";
import { useTheme } from "./src/theme/useTheme";
import { TabIndicator } from "./src/components/TabIndicator";
import {
	DESKTOP_DEFAULT_SCREEN,
	DESKTOP_ROUTE_PREFIX,
	isSupportedDesktopScreenSlug,
	resolveDesktopScreenSlug,
} from "./src/screens/desktopRoutes";
import {
	MARK_ALL_NOTIFICATIONS_READ_MUTATION,
	MARK_NOTIFICATION_READ_MUTATION,
	NOTIFICATIONS_QUERY,
	NOTIFICATION_UNREAD_COUNT_QUERY,
} from "./src/graphql/operations";
import { toLocalDateTime } from "./src/utils/time";
import { toUserErrorMessage } from "./src/utils/errors";

function getStableWebPortrait(): boolean {
	if (typeof window === "undefined") {
		return true;
	}

	if (window.innerHeight > 0 && window.innerWidth > 0) {
		return window.innerHeight >= window.innerWidth;
	}

	const orientationType = window.screen?.orientation?.type;
	if (orientationType) {
		return orientationType.startsWith("portrait");
	}

	const screenHeight = window.screen?.height;
	const screenWidth = window.screen?.width;
	if (
		typeof screenHeight === "number" &&
		typeof screenWidth === "number" &&
		screenHeight > 0 &&
		screenWidth > 0
	) {
		return screenHeight >= screenWidth;
	}

	return window.innerHeight >= window.innerWidth;
}

const DESKTOP_DEFAULT_PATH = `${DESKTOP_ROUTE_PREFIX}/${DESKTOP_DEFAULT_SCREEN}`;

interface DesktopRouteMatch {
	screenSlug: string | null;
}

function normalizeWebPathname(pathname: string): string {
	const trimmed = pathname.trim();
	if (!trimmed) {
		return "/";
	}

	const withLeadingSlash = trimmed.startsWith("/")
		? trimmed
		: `/${trimmed}`;
	const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, "");

	return withoutTrailingSlash || "/";
}

function getCurrentWebPathname(): string {
	if (typeof window === "undefined") {
		return "/";
	}

	return normalizeWebPathname(window.location.pathname);
}

function parseDesktopRoute(pathname: string): DesktopRouteMatch | null {
	const normalizedPathname = normalizeWebPathname(pathname);
	const routeMatch = /^\/desktop\/re(?:\/([a-z0-9-]+))?$/i.exec(
		normalizedPathname,
	);

	if (!routeMatch) {
		return null;
	}

	return {
		screenSlug: routeMatch[1] ? routeMatch[1].toLowerCase() : null,
	};
}

type TabKey = "ROTA" | "FRIENDS" | "FREE" | "PROFILE" | "SETTINGS";

type NotificationCategory = "BUG_FIX" | "RELEASE" | "UPDATE" | "MAINTENANCE";

interface AppNotification {
	id: string;
	title: string;
	body: string;
	category: NotificationCategory;
	version?: string | null;
	publishedAt: string;
	isRead: boolean;
}

interface NotificationsQueryData {
	notifications: AppNotification[];
}

interface NotificationUnreadCountData {
	notificationUnreadCount: number;
}

function formatNotificationCategory(category: NotificationCategory): string {
	switch (category) {
		case "BUG_FIX":
			return "Bug Fix";
		case "RELEASE":
			return "Release";
		case "MAINTENANCE":
			return "Maintenance";
		default:
			return "Update";
	}
}

function isAuthenticationRequiredError(error: unknown): boolean {
	if (!error || typeof error !== "object") {
		return false;
	}

	const apolloError = error as {
		message?: unknown;
		graphQLErrors?: Array<{
			message?: unknown;
			extensions?: { code?: unknown };
		}>;
		networkError?: { message?: unknown };
	};

	const topLevelMessage =
		typeof apolloError.message === "string"
			? apolloError.message
			: "";

	const graphQLMessages = Array.isArray(apolloError.graphQLErrors)
		? apolloError.graphQLErrors
				.map((graphQLError) =>
					typeof graphQLError.message === "string"
						? graphQLError.message
						: "",
				)
				.join(" ")
		: "";

	const graphQLCodes = Array.isArray(apolloError.graphQLErrors)
		? apolloError.graphQLErrors
				.map((graphQLError) =>
					typeof graphQLError.extensions?.code ===
					"string"
						? graphQLError.extensions.code
						: "",
				)
				.join(" ")
		: "";

	const networkMessage =
		typeof apolloError.networkError?.message === "string"
			? apolloError.networkError.message
			: "";

	const combined =
		`${topLevelMessage} ${graphQLMessages} ${graphQLCodes} ${networkMessage}`.toLowerCase();

	return (
		combined.includes("authentication required") ||
		combined.includes("unauthenticated") ||
		combined.includes("invalid token")
	);
}

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
	const { token, isBootstrapping, signOut } = useAuth();
	const { width } = useWindowDimensions();
	const [activeTab, setActiveTab] = useState<TabKey>("ROTA");
	const [authMode, setAuthMode] = useState<AuthMode>("register");
	const [isNotificationsOpen, setNotificationsOpen] = useState(false);
	const [notificationActionError, setNotificationActionError] = useState<
		string | null
	>(null);
	const isWeb = Platform.OS === "web";
	const [webPathname, setWebPathname] = useState<string>(() =>
		getCurrentWebPathname(),
	);
	const [webIsPortrait, setWebIsPortrait] = useState<boolean>(() =>
		isWeb ? getStableWebPortrait() : true,
	);
	const isDesktopViewport = width >= 900;
	const shouldBlockWebUsage = isWeb && !webIsPortrait;
	const isAuthenticated = Boolean(token);

	const {
		data: notificationsData,
		loading: loadingNotifications,
		error: notificationsError,
		refetch: refetchNotifications,
	} = useQuery<NotificationsQueryData>(NOTIFICATIONS_QUERY, {
		variables: {
			limit: 20,
			cursor: null,
		},
		skip: !isAuthenticated,
		fetchPolicy: "cache-and-network",
		pollInterval: isAuthenticated ? 20000 : 0,
	});

	const {
		data: notificationUnreadData,
		error: notificationUnreadError,
		refetch: refetchNotificationUnreadCount,
	} = useQuery<NotificationUnreadCountData>(
		NOTIFICATION_UNREAD_COUNT_QUERY,
		{
			skip: !isAuthenticated,
			fetchPolicy: "cache-and-network",
			pollInterval: isAuthenticated ? 20000 : 0,
		},
	);

	const [markNotificationRead, { loading: markingNotificationRead }] =
		useMutation(MARK_NOTIFICATION_READ_MUTATION);
	const [
		markAllNotificationsRead,
		{ loading: markingAllNotificationsRead },
	] = useMutation(MARK_ALL_NOTIFICATIONS_READ_MUTATION);

	const notifications = notificationsData?.notifications ?? [];
	const unreadCount =
		notificationUnreadData?.notificationUnreadCount ?? 0;
	const unreadBadgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

	const closeNotificationsPanel = useCallback(() => {
		setNotificationsOpen(false);
		setNotificationActionError(null);
	}, []);

	const toggleNotificationsPanel = useCallback(() => {
		setNotificationsOpen((current) => !current);
		setNotificationActionError(null);
	}, []);

	const handleMarkNotificationRead = useCallback(
		async (notification: AppNotification) => {
			if (notification.isRead || markingNotificationRead) {
				return;
			}

			setNotificationActionError(null);

			try {
				await markNotificationRead({
					variables: {
						notificationId: notification.id,
					},
				});
				await Promise.all([
					refetchNotifications(),
					refetchNotificationUnreadCount(),
				]);
			} catch (error) {
				setNotificationActionError(
					toUserErrorMessage(
						error,
						"Failed to mark notification as read.",
					),
				);
			}
		},
		[
			markNotificationRead,
			markingNotificationRead,
			refetchNotificationUnreadCount,
			refetchNotifications,
		],
	);

	const handleMarkAllNotificationsRead = useCallback(async () => {
		if (markingAllNotificationsRead || unreadCount === 0) {
			return;
		}

		setNotificationActionError(null);

		try {
			await markAllNotificationsRead();
			await Promise.all([
				refetchNotifications(),
				refetchNotificationUnreadCount(),
			]);
		} catch (error) {
			setNotificationActionError(
				toUserErrorMessage(
					error,
					"Failed to mark all notifications as read.",
				),
			);
		}
	}, [
		markAllNotificationsRead,
		markingAllNotificationsRead,
		refetchNotificationUnreadCount,
		refetchNotifications,
		unreadCount,
	]);

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

	useEffect(() => {
		if (!isWeb || typeof window === "undefined") {
			return;
		}

		const syncWebPathname = () => {
			setWebPathname(
				normalizeWebPathname(window.location.pathname),
			);
		};

		const syncWebOrientation = () => {
			setWebIsPortrait(getStableWebPortrait());
		};

		syncWebPathname();
		syncWebOrientation();
		window.addEventListener("popstate", syncWebPathname);
		window.addEventListener(
			"orientationchange",
			syncWebOrientation,
		);
		window.addEventListener("resize", syncWebOrientation);

		return () => {
			window.removeEventListener("popstate", syncWebPathname);
			window.removeEventListener(
				"orientationchange",
				syncWebOrientation,
			);
			window.removeEventListener(
				"resize",
				syncWebOrientation,
			);
		};
	}, [isWeb]);

	const desktopRouteMatch = useMemo(
		() => (isWeb ? parseDesktopRoute(webPathname) : null),
		[isWeb, webPathname],
	);

	const shouldRedirectDesktopRoot =
		isWeb && isDesktopViewport && webPathname === "/";
	const shouldRedirectUnsupportedDesktopRoute =
		isWeb &&
		desktopRouteMatch !== null &&
		!isSupportedDesktopScreenSlug(desktopRouteMatch.screenSlug) &&
		webPathname !== DESKTOP_DEFAULT_PATH;

	const pendingWebRedirectTarget =
		shouldRedirectDesktopRoot ||
		shouldRedirectUnsupportedDesktopRoute
			? DESKTOP_DEFAULT_PATH
			: null;

	const shouldRenderDesktopScreen =
		isWeb &&
		desktopRouteMatch !== null &&
		isSupportedDesktopScreenSlug(desktopRouteMatch.screenSlug);

	useEffect(() => {
		if (
			!isWeb ||
			typeof window === "undefined" ||
			!pendingWebRedirectTarget
		) {
			return;
		}

		const currentPath = normalizeWebPathname(
			window.location.pathname,
		);
		if (currentPath === pendingWebRedirectTarget) {
			return;
		}

		setWebPathname(pendingWebRedirectTarget);
		window.location.replace(pendingWebRedirectTarget);
	}, [isWeb, pendingWebRedirectTarget]);

	const activeLabel = useMemo(() => {
		if (activeTab === "SETTINGS") {
			return "Settings";
		}

		return (
			tabs.find((item) => item.key === activeTab)?.label ??
			"Rota"
		);
	}, [activeTab]);

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

	useEffect(() => {
		if (!isAuthenticated) {
			setNotificationsOpen(false);
			setNotificationActionError(null);
			setAuthMode("register");
		}
	}, [isAuthenticated]);

	useEffect(() => {
		if (!isAuthenticated) {
			return;
		}

		const authError = notificationsError ?? notificationUnreadError;
		if (!authError || !isAuthenticationRequiredError(authError)) {
			return;
		}

		void signOut();
		setActiveTab("ROTA");
		setAuthMode("register");
		setNotificationsOpen(false);
		setNotificationActionError(null);
	}, [
		isAuthenticated,
		notificationUnreadError,
		notificationsError,
		signOut,
	]);

	useEffect(() => {
		setNotificationsOpen(false);
		setNotificationActionError(null);
	}, [activeTab]);

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
				notificationIconWrap: {
					position: "relative",
				},
				notificationBadge: {
					position: "absolute",
					top: -7,
					right: -10,
					minWidth: 19,
					height: 19,
					borderRadius: 10,
					paddingHorizontal: 4,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: theme.colors.accent,
					borderWidth: 1,
					borderColor: theme.colors.border,
				},
				notificationBadgeText: {
					fontSize: theme.typography.tiny,
					fontWeight: "900",
					color: theme.colors.onAccent,
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
				notificationModalOverlay: {
					flex: 1,
					backgroundColor: "rgba(0, 0, 0, 0.25)",
					paddingTop: theme.spacing.lg,
					paddingHorizontal: theme.spacing.md,
				},
				notificationPanel: {
					alignSelf: "flex-end",
					width: "100%",
					maxWidth: 420,
					maxHeight: "78%",
					backgroundColor: theme.colors.surface,
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.lg,
					padding: theme.spacing.md,
					gap: theme.spacing.sm,
					...theme.shadowSm,
				},
				notificationPanelHeader: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					gap: theme.spacing.sm,
				},
				notificationPanelTitle: {
					fontSize: theme.typography.body,
					fontWeight: "900",
					textTransform: "uppercase",
					color: theme.colors.textPrimary,
					letterSpacing: 0.7,
				},
				notificationMarkAllButton: {
					paddingHorizontal: theme.spacing.sm,
					paddingVertical: theme.spacing.xs,
					borderWidth: 1,
					borderColor: theme.colors.border,
					backgroundColor:
						theme.colors.surfaceMuted,
					borderRadius: theme.radius.md,
				},
				notificationMarkAllText: {
					fontSize: theme.typography.caption,
					fontWeight: "800",
					textTransform: "uppercase",
					color: theme.colors.textPrimary,
				},
				notificationMarkAllTextMuted: {
					color: theme.colors.textMuted,
				},
				notificationMessage: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					color: theme.colors.textMuted,
				},
				notificationErrorMessage: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					color: theme.colors.error,
				},
				notificationLoadingContainer: {
					flexDirection: "row",
					alignItems: "center",
					gap: theme.spacing.sm,
				},
				notificationList: {
					maxHeight: 360,
				},
				notificationListContent: {
					gap: theme.spacing.sm,
					paddingBottom: theme.spacing.xs,
				},
				notificationCard: {
					borderWidth: 1,
					borderColor: theme.colors.border,
					backgroundColor:
						theme.colors.surfaceElevated,
					borderRadius: theme.radius.md,
					padding: theme.spacing.sm,
					gap: theme.spacing.xs,
				},
				notificationCardUnread: {
					borderColor: theme.colors.accent,
					backgroundColor:
						theme.colors.surfaceMuted,
				},
				notificationCategoryRow: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				notificationCategory: {
					fontSize: theme.typography.tiny,
					fontWeight: "800",
					textTransform: "uppercase",
					color: theme.colors.textSecondary,
					letterSpacing: 0.5,
				},
				notificationUnreadDot: {
					width: 10,
					height: 10,
					borderRadius: 5,
					backgroundColor: theme.colors.accent,
					borderWidth: 1,
					borderColor: theme.colors.border,
				},
				notificationTitle: {
					fontSize: theme.typography.body,
					fontWeight: "800",
					color: theme.colors.textPrimary,
				},
				notificationBody: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					color: theme.colors.textSecondary,
					lineHeight: 20,
				},
				notificationMeta: {
					fontSize: theme.typography.tiny,
					fontWeight: "700",
					color: theme.colors.textMuted,
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

	if (pendingWebRedirectTarget) {
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

	if (shouldRenderDesktopScreen) {
		const desktopScreenSlug = resolveDesktopScreenSlug(
			desktopRouteMatch?.screenSlug ?? null,
		);

		switch (desktopScreenSlug) {
			case "platform":
				return <DesktopPlatformScreen />;
			case "solutions":
				return <DesktopSolutionsScreen />;
			case "enterprise":
				return <DesktopEnterpriseScreen />;
			case "pricing":
				return <DesktopPricingScreen />;
			case "log-in":
				return <DesktopLoginScreen />;
			case "get-started":
				return <DesktopGetStartedScreen />;
			case "enterprise-inquiry":
				return <DesktopEnterpriseInquiryScreen />;
			case "landing":
			default:
				return <DesktopLandingScreen />;
		}
	}

	if (shouldBlockWebUsage) {
		const blockedMessage =
			"FreeRota supports portrait mode only. Rotate your device to portrait to continue";

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
		return (
			<AuthScreen
				mode={authMode}
				onModeChange={setAuthMode}
			/>
		);
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
							isNotificationsOpen
								? styles.themeIconButtonActive
								: undefined,
						]}
						onPress={
							toggleNotificationsPanel
						}
					>
						<View
							style={
								styles.notificationIconWrap
							}
						>
							<Ionicons
								name={
									isNotificationsOpen
										? "notifications"
										: "notifications-outline"
								}
								size={20}
								color={
									theme
										.colors
										.textPrimary
								}
							/>
							{unreadCount > 0 ? (
								<View
									style={
										styles.notificationBadge
									}
								>
									<Text
										style={
											styles.notificationBadgeText
										}
									>
										{
											unreadBadgeLabel
										}
									</Text>
								</View>
							) : null}
						</View>
					</Pressable>
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

			<Modal
				visible={isNotificationsOpen}
				transparent
				animationType="fade"
				onRequestClose={closeNotificationsPanel}
			>
				<Pressable
					style={styles.notificationModalOverlay}
					onPress={closeNotificationsPanel}
				>
					<Pressable
						style={styles.notificationPanel}
						onPress={() => {}}
					>
						<View
							style={
								styles.notificationPanelHeader
							}
						>
							<Text
								style={
									styles.notificationPanelTitle
								}
							>
								Notifications
							</Text>
							<Pressable
								style={
									styles.notificationMarkAllButton
								}
								onPress={() =>
									void handleMarkAllNotificationsRead()
								}
								disabled={
									markingAllNotificationsRead ||
									unreadCount ===
										0
								}
							>
								<Text
									style={[
										styles.notificationMarkAllText,
										markingAllNotificationsRead ||
										unreadCount ===
											0
											? styles.notificationMarkAllTextMuted
											: undefined,
									]}
								>
									Mark All
									Read
								</Text>
							</Pressable>
						</View>

						{notificationActionError ? (
							<Text
								style={
									styles.notificationErrorMessage
								}
							>
								{
									notificationActionError
								}
							</Text>
						) : null}

						{loadingNotifications ? (
							<View
								style={
									styles.notificationLoadingContainer
								}
							>
								<ActivityIndicator
									size="small"
									color={
										theme
											.colors
											.accent
									}
								/>
								<Text
									style={
										styles.notificationMessage
									}
								>
									Loading
									notifications...
								</Text>
							</View>
						) : null}

						{!loadingNotifications &&
						notificationsError ? (
							<Text
								style={
									styles.notificationErrorMessage
								}
							>
								{toUserErrorMessage(
									notificationsError,
									"Unable to load notifications.",
								)}
							</Text>
						) : null}

						{!loadingNotifications &&
						!notificationsError &&
						notifications.length === 0 ? (
							<Text
								style={
									styles.notificationMessage
								}
							>
								No updates yet.
							</Text>
						) : null}

						{!loadingNotifications &&
						!notificationsError &&
						notifications.length > 0 ? (
							<ScrollView
								style={
									styles.notificationList
								}
								contentContainerStyle={
									styles.notificationListContent
								}
							>
								{notifications.map(
									(
										notification,
									) => (
										<Pressable
											key={
												notification.id
											}
											style={[
												styles.notificationCard,
												!notification.isRead
													? styles.notificationCardUnread
													: undefined,
											]}
											onPress={() =>
												void handleMarkNotificationRead(
													notification,
												)
											}
											disabled={
												notification.isRead ||
												markingNotificationRead
											}
										>
											<View
												style={
													styles.notificationCategoryRow
												}
											>
												<Text
													style={
														styles.notificationCategory
													}
												>
													{formatNotificationCategory(
														notification.category,
													)}
												</Text>
												{!notification.isRead ? (
													<View
														style={
															styles.notificationUnreadDot
														}
													/>
												) : null}
											</View>
											<Text
												style={
													styles.notificationTitle
												}
											>
												{
													notification.title
												}
											</Text>
											<Text
												style={
													styles.notificationBody
												}
											>
												{
													notification.body
												}
											</Text>
											<Text
												style={
													styles.notificationMeta
												}
											>
												{toLocalDateTime(
													notification.publishedAt,
												)}
												{notification.version
													? ` | v${notification.version}`
													: ""}
											</Text>
										</Pressable>
									),
								)}
							</ScrollView>
						) : null}
					</Pressable>
				</Pressable>
			</Modal>

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
