export type ThemeMode = "system" | "light" | "dark";

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

interface RgbColor {
    r: number;
    g: number;
    b: number;
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
        sm: 10,
        md: 14,
        lg: 18,
        pill: 999
    },
    typography: {
        display: 46,
        heading: 34,
        body: 17,
        caption: 14,
        tiny: 12
    }
};

export const lightTheme: ThemeTokens = {
    ...baseTokens,
    colors: {
        background: "#F2F4F8",
        surface: "#FFFFFF",
        surfaceMuted: "#E9EDF5",
        surfaceElevated: "#FAFBFF",
        border: "#D2D9E6",
        textPrimary: "#111C3D",
        textSecondary: "#2B3C64",
        textMuted: "#53648A",
        accent: "#142248",
        accentMuted: "#DCE4F5",
        onAccent: "#F8FBFF",
        accentBackground: "rgba(20, 34, 72, 0.1)",
        accentFreeBackground: "rgba(20, 72, 53, 0.05)",
        accentBusyBackground: "rgba(255, 142, 142, 0.05)",
        accentEarlyBackground: "rgba(72, 67, 20, 0.05)",
        accentTodayBackground: "rgba(29, 20, 72, 0.25)"
    }
};

export const darkTheme: ThemeTokens = {
    ...baseTokens,
    colors: {
        background: "#12091f",
        surface: "#251131",
        surfaceMuted: "#2f173d",
        surfaceElevated: "#3a1a47",
        border: "#4b2e59",
        textPrimary: "#F3F7FF",
        textSecondary: "#D5DEEF",
        textMuted: "#9EABC8",
        accent: "#d78eff",
        accentMuted: "#53255f",
        onAccent: "#081127",
        accentBackground: "rgba(142, 168, 255, 0.1)",
        accentFreeBackground: "rgba(142, 255, 215, 0.05)",
        accentBusyBackground: "rgba(255, 142, 142, 0.05)",
        accentEarlyBackground: "rgba(72, 67, 20, 0.05)",
        accentTodayBackground: "rgba(29, 20, 72, 0.25)"
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
    const lightText = "#F8FBFF";
    const darkText = "#081127";

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
