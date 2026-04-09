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
        onAccent: "#F8FBFF"
    }
};

export const darkTheme: ThemeTokens = {
    ...baseTokens,
    colors: {
        background: "#090F1F",
        surface: "#111A31",
        surfaceMuted: "#17213D",
        surfaceElevated: "#1A2747",
        border: "#2E3A59",
        textPrimary: "#F3F7FF",
        textSecondary: "#D5DEEF",
        textMuted: "#9EABC8",
        accent: "#8EA8FF",
        accentMuted: "#25355F",
        onAccent: "#081127"
    }
};
