import { useMemo } from "react";
import {
	Pressable,
	StyleSheet,
	Text,
	View,
	useWindowDimensions,
} from "react-native";
import {
	type DesktopScreenSlug,
	navigateToDesktopScreen,
} from "../../screens/desktop/desktopRoutes";

type HeaderNavBarVariant = "landing" | "route";

interface HeaderNavBarProps {
	activeSlug?: DesktopScreenSlug;
	variant?: HeaderNavBarVariant;
}

const NAV_LINKS: Array<{ label: string; slug: DesktopScreenSlug }> = [
	{ label: "Platform", slug: "platform" },
	{ label: "Solutions", slug: "solutions" },
	{ label: "Enterprise", slug: "enterprise" },
	{ label: "Pricing", slug: "pricing" },
];

const TOKENS = {
	brand: "#BE9DFF",
	brandDeep: "#34006E",
	text: "#FFFFFF",
	textDim: "#B6B3C0",
	landingBackground: "rgba(14, 14, 14, 0.88)",
	routeBackground: "#0D0D0E",
	routeBorder: "rgba(255,255,255,0.05)",
};

export const HeaderNavBar = ({
	activeSlug,
	variant = "landing",
}: HeaderNavBarProps) => {
	const { width } = useWindowDimensions();
	const isLanding = variant === "landing";
	const isTablet = width >= (isLanding ? 760 : 860);
	const isDesktop = width >= (isLanding ? 1024 : 1080);

	const styles = useMemo(
		() =>
			StyleSheet.create({
				nav: {
					paddingHorizontal: 48,
					paddingTop: 18,
					paddingBottom: 18,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					backgroundColor:
						TOKENS.landingBackground,
					borderBottomWidth: 0,
					borderBottomColor: TOKENS.routeBorder,
				},
				navBrand: {
					fontSize: 24,
					fontWeight: "900",
					letterSpacing: -1,
					color: TOKENS.brand,
					textTransform: "uppercase",
				},
				navLinks: {
					flexDirection: "row",
					alignItems: "center",
					gap: 24,
				},
				navLink: {
					fontSize: 12,
					fontWeight: "700",
					letterSpacing: 1,
					textTransform: "uppercase",
					color: TOKENS.textDim,
				},
				navLinkActive: {
					color: TOKENS.brand,
					borderBottomWidth: isLanding ? 0 : 2,
					borderBottomColor: TOKENS.brand,
					paddingBottom: isLanding ? 0 : 2,
				},
				navActions: {
					flexDirection: "row",
					alignItems: "center",
					gap: 12,
				},
				ghostButtonText: {
					fontSize: 12,
					fontWeight: "700",
					letterSpacing: 1,
					textTransform: "uppercase",
					color: TOKENS.textDim,
					display: isLanding
						? isDesktop
							? "flex"
							: "none"
						: isTablet
							? "flex"
							: "none",
				},
				ctaButton: {
					backgroundColor: TOKENS.brand,
					paddingHorizontal: 18,
					paddingVertical: 10,
					borderWidth: 2,
					borderColor: "rgba(178, 139, 255, 0.8)",
				},
				ctaButtonText: {
					fontSize: 12,
					fontWeight: "900",
					letterSpacing: 1,
					textTransform: "uppercase",
					color: TOKENS.brandDeep,
				},
			}),
		[isDesktop, isLanding, isTablet],
	);

	return (
		<View style={styles.nav}>
			<Pressable
				onPress={() =>
					navigateToDesktopScreen("landing")
				}
			>
				<Text style={styles.navBrand}>FreeRota</Text>
			</Pressable>
			{isTablet ? (
				<View style={styles.navLinks}>
					{NAV_LINKS.map((link) => (
						<Pressable
							key={link.slug}
							onPress={() =>
								navigateToDesktopScreen(
									link.slug,
								)
							}
						>
							<Text
								style={[
									styles.navLink,
									activeSlug ===
									link.slug
										? styles.navLinkActive
										: undefined,
								]}
							>
								{link.label}
							</Text>
						</Pressable>
					))}
				</View>
			) : null}
			<View style={styles.navActions}>
				<Pressable
					onPress={() =>
						navigateToDesktopScreen(
							"log-in",
						)
					}
				>
					<Text style={styles.ghostButtonText}>
						Log In
					</Text>
				</Pressable>
				<Pressable
					style={styles.ctaButton}
					onPress={() =>
						navigateToDesktopScreen(
							"get-started",
						)
					}
				>
					<Text style={styles.ctaButtonText}>
						Get Started
					</Text>
				</Pressable>
			</View>
		</View>
	);
};
