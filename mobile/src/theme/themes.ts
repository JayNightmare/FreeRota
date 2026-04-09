export type ThemeMode = "system" | "light" | "dark";

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
