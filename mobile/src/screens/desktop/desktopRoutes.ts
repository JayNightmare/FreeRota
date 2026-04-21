import { Platform } from "react-native";

export const DESKTOP_ROUTE_PREFIX = "/desktop/re";
export const DESKTOP_DEFAULT_SCREEN = "landing";

export const DESKTOP_SCREEN_SLUGS = [
	"landing",
	"platform",
	"solutions",
	"enterprise",
	"pricing",
	"log-in",
	"get-started",
	"enterprise-inquiry",
	"dashboard",
] as const;

export type DesktopScreenSlug = (typeof DESKTOP_SCREEN_SLUGS)[number];

const DESKTOP_SCREEN_SET: ReadonlySet<string> = new Set(DESKTOP_SCREEN_SLUGS);

export function getDesktopScreenPath(slug: DesktopScreenSlug): string {
	return `${DESKTOP_ROUTE_PREFIX}/${slug}`;
}

export function isSupportedDesktopScreenSlug(
	screenSlug: string | null,
): screenSlug is DesktopScreenSlug {
	return typeof screenSlug === "string" && DESKTOP_SCREEN_SET.has(screenSlug);
}

export function resolveDesktopScreenSlug(screenSlug: string | null): DesktopScreenSlug {
	return isSupportedDesktopScreenSlug(screenSlug)
		? screenSlug
		: DESKTOP_DEFAULT_SCREEN;
}

export function navigateWebPath(path: string, replace = false): void {
	if (Platform.OS !== "web" || typeof window === "undefined") {
		return;
	}

	if (replace) {
		window.history.replaceState({}, "", path);
	} else {
		window.history.pushState({}, "", path);
	}

	window.dispatchEvent(new PopStateEvent("popstate"));
}

export function navigateToDesktopScreen(
	slug: DesktopScreenSlug,
	replace = false,
): void {
	navigateWebPath(getDesktopScreenPath(slug), replace);
}
