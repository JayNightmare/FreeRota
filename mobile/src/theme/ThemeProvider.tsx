import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@apollo/client";
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import { useAuth } from "../auth/AuthProvider";
import { ME_QUERY } from "../graphql/operations";
import { resolveTheme, type ThemeMode, type ThemeTokens } from "./themes";

const STORAGE_KEY = "freerota.theme-mode";

interface ThemeContextValue {
	theme: ThemeTokens;
	mode: ThemeMode;
	resolvedMode: "light" | "dark";
	toggleColorMode: () => void;
	setMode: (mode: ThemeMode) => void;
}

interface ThemePreferencesQuery {
	me: {
		uiAccentColor: string | null;
	};
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const { token } = useAuth();
	const systemMode = useColorScheme() === "dark" ? "dark" : "light";
	const [mode, setModeState] = useState<ThemeMode>("system");
	const [isHydrated, setIsHydrated] = useState(false);
	const { data: themePreferenceData } = useQuery<ThemePreferencesQuery>(
		ME_QUERY,
		{
			skip: !token,
			fetchPolicy: "cache-first",
			errorPolicy: "ignore",
		},
	);

	useEffect(() => {
		let active = true;

		const loadThemeMode = async (): Promise<void> => {
			try {
				const stored =
					await AsyncStorage.getItem(STORAGE_KEY);
				if (
					active &&
					(stored === "system" ||
						stored === "light" ||
						stored === "dark")
				) {
					setModeState(stored);
				}
			} catch {
				// Ignore storage errors and keep safe defaults.
			} finally {
				if (active) {
					setIsHydrated(true);
				}
			}
		};

		void loadThemeMode();

		return () => {
			active = false;
		};
	}, []);

	useEffect(() => {
		if (!isHydrated) {
			return;
		}

		void AsyncStorage.setItem(STORAGE_KEY, mode);
	}, [isHydrated, mode]);

	const resolvedMode: "light" | "dark" = "dark";
	const profileAccentColor = token
		? (themePreferenceData?.me?.uiAccentColor ?? null)
		: null;
	const theme = useMemo(
		() =>
			resolveTheme(resolvedMode, {
				accentColor: profileAccentColor,
			}),
		[profileAccentColor, resolvedMode],
	);

	const value = useMemo<ThemeContextValue>(
		() => ({
			theme,
			mode,
			resolvedMode,
			toggleColorMode: () => {
				setModeState((currentMode) => {
					if (currentMode === "system") {
						return resolvedMode === "dark"
							? "light"
							: "dark";
					}

					return currentMode === "dark"
						? "light"
						: "dark";
				});
			},
			setMode: (nextMode: ThemeMode) => {
				setModeState(nextMode);
			},
		}),
		[mode, resolvedMode, theme],
	);

	return (
		<ThemeContext.Provider value={value}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);

	if (!context) {
		throw new Error("useTheme must be used within ThemeProvider");
	}

	return context;
}
