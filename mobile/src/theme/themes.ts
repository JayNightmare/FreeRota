export type ThemeMode = "system" | "light" | "dark";

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

interface RgbColor {
    r: number;
    g: number;
    b: number;
}

interface ShadowTokens {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
}

export interface ThemeTokens {
    colors: {
        background: string;
        surface: string;
        surfaceMuted: string;
        surfaceElevated: string;
        border: string;
        textPrimary: string;
        textSecondary: string;
        textMuted: string;
        accent: string;
        accentMuted: string;
        onAccent: string;
        tertiary: string;
        onTertiary: string;
        error: string;
        onError: string;
        accentBackground: string;
        accentFreeBackground: string;
        accentBusyBackground: string;
        accentEarlyBackground: string;
        accentTodayBackground: string;
    };
    spacing: {
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
        xxl: number;
    };
    radius: {
        sm: number;
        md: number;
        lg: number;
        pill: number;
    };
    typography: {
        display: number;
        heading: number;
        body: number;
        caption: number;
        tiny: number;
    };
    borderWidth: number;
    shadow: ShadowTokens;
    shadowSm: ShadowTokens;
}

interface ThemeColorOptions {
    accentColor?: string | null;
}

const baseTokens: Omit<ThemeTokens, "colors"> = {
    spacing: {
        xs: 6,
        sm: 10,
        md: 14,
        lg: 20,
        xl: 24,
        xxl: 32
    },
    radius: {
        sm: 0,
        md: 0,
        lg: 0,
        pill: 9999
    },
    typography: {
        display: 46,
        heading: 34,
        body: 17,
        caption: 14,
        tiny: 12
    },
    borderWidth: 4,
    shadow: {
        shadowColor: "#000000",
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 10,
    },
    shadowSm: {
        shadowColor: "#000000",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 6,
    },
};

export const lightTheme: ThemeTokens = {
    ...baseTokens,
    colors: {
        background: "#0A0A0A",
        surface: "#131313",
        surfaceMuted: "#1c1b1b",
        surfaceElevated: "#2a2a2a",
        border: "#27272a",
        textPrimary: "#e5e2e1",
        textSecondary: "#a1a1aa",
        textMuted: "#71717a",
        accent: "#d2bbff",
        accentMuted: "#411a83",
        onAccent: "#3d147e",
        tertiary: "#abd600",
        onTertiary: "#283500",
        error: "#ffb4ab",
        onError: "#690005",
        accentBackground: "rgba(210, 187, 255, 0.1)",
        accentFreeBackground: "rgba(171, 214, 0, 0.1)",
        accentBusyBackground: "rgba(255, 180, 171, 0.1)",
        accentEarlyBackground: "rgba(171, 214, 0, 0.08)",
        accentTodayBackground: "rgba(210, 187, 255, 0.2)"
    }
};

export const darkTheme: ThemeTokens = {
    ...baseTokens,
    colors: {
        background: "#0A0A0A",
        surface: "#131313",
        surfaceMuted: "#1c1b1b",
        surfaceElevated: "#2a2a2a",
        border: "#27272a",
        textPrimary: "#e5e2e1",
        textSecondary: "#a1a1aa",
        textMuted: "#71717a",
        accent: "#d2bbff",
        accentMuted: "#411a83",
        onAccent: "#3d147e",
        tertiary: "#abd600",
        onTertiary: "#283500",
        error: "#ffb4ab",
        onError: "#690005",
        accentBackground: "rgba(210, 187, 255, 0.1)",
        accentFreeBackground: "rgba(171, 214, 0, 0.1)",
        accentBusyBackground: "rgba(255, 180, 171, 0.1)",
        accentEarlyBackground: "rgba(171, 214, 0, 0.08)",
        accentTodayBackground: "rgba(210, 187, 255, 0.2)"
    }
};

function normalizeHexColor(value?: string | null): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed || !HEX_COLOR_REGEX.test(trimmed)) {
        return null;
    }

    if (trimmed.length === 4) {
        return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toUpperCase();
    }

    return trimmed.toUpperCase();
}

function hexToRgb(hexColor: string): RgbColor {
    const normalized = normalizeHexColor(hexColor);
    if (!normalized) {
        return { r: 0, g: 0, b: 0 };
    }

    const parsed = Number.parseInt(normalized.slice(1), 16);
    return {
        r: (parsed >> 16) & 255,
        g: (parsed >> 8) & 255,
        b: parsed & 255
    };
}

function rgbToHex({ r, g, b }: RgbColor): string {
    const toChannel = (value: number): string =>
        Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0").toUpperCase();

    return `#${toChannel(r)}${toChannel(g)}${toChannel(b)}`;
}

function blendHexColors(baseHex: string, mixHex: string, ratio: number): string {
    const safeRatio = Math.max(0, Math.min(1, ratio));
    const base = hexToRgb(baseHex);
    const mix = hexToRgb(mixHex);

    return rgbToHex({
        r: base.r + (mix.r - base.r) * safeRatio,
        g: base.g + (mix.g - base.g) * safeRatio,
        b: base.b + (mix.b - base.b) * safeRatio
    });
}

function toRgba(hexColor: string, alpha: number): string {
    const rgb = hexToRgb(hexColor);
    const safeAlpha = Math.max(0, Math.min(1, alpha));
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${safeAlpha})`;
}

function channelToLinear(channel: number): number {
    const normalized = channel / 255;
    if (normalized <= 0.03928) {
        return normalized / 12.92;
    }

    return Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hexColor: string): number {
    const rgb = hexToRgb(hexColor);
    const r = channelToLinear(rgb.r);
    const g = channelToLinear(rgb.g);
    const b = channelToLinear(rgb.b);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(firstHex: string, secondHex: string): number {
    const first = relativeLuminance(firstHex);
    const second = relativeLuminance(secondHex);
    const lighter = Math.max(first, second);
    const darker = Math.min(first, second);
    return (lighter + 0.05) / (darker + 0.05);
}

export function getAutoContrastTextColor(backgroundHex: string): string {
    const lightText = "#e5e2e1";
    const darkText = "#0A0A0A";

    return contrastRatio(backgroundHex, lightText) >= contrastRatio(backgroundHex, darkText)
        ? lightText
        : darkText;
}

function withAccentOverride(theme: ThemeTokens, accentColor?: string | null): ThemeTokens {
    const normalizedAccent = normalizeHexColor(accentColor);
    if (!normalizedAccent) {
        return theme;
    }

    return {
        ...theme,
        colors: {
            ...theme.colors,
            accent: normalizedAccent,
            accentMuted: blendHexColors(theme.colors.surface, normalizedAccent, 0.2),
            onAccent: getAutoContrastTextColor(normalizedAccent),
            accentBackground: toRgba(normalizedAccent, 0.14),
            accentFreeBackground: toRgba(blendHexColors(normalizedAccent, "#1EC87D", 0.55), 0.16),
            accentBusyBackground: toRgba(blendHexColors(normalizedAccent, "#FF7A7A", 0.45), 0.16),
            accentEarlyBackground: toRgba(blendHexColors(normalizedAccent, "#CFAE39", 0.45), 0.16),
            accentTodayBackground: toRgba(normalizedAccent, 0.28)
        }
    };
}

export function resolveTheme(
    resolvedMode: "light" | "dark",
    options?: ThemeColorOptions
): ThemeTokens {
    const baseTheme = resolvedMode === "dark" ? darkTheme : lightTheme;
    return withAccentOverride(baseTheme, options?.accentColor);
}
