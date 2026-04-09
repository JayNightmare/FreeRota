import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import {
	darkTheme,
	lightTheme,
	type ThemeMode,
	type ThemeTokens,
} from "./themes";

const STORAGE_KEY = "freerota.theme-mode";

interface ThemeContextValue {
	theme: ThemeTokens;
	mode: ThemeMode;
	resolvedMode: "light" | "dark";
	toggleColorMode: () => void;
	setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
	children,
}: {
	children: ReactNode;
}) {
	const systemMode = useColorScheme() === "dark" ? "dark" : "light";
	const [mode, setModeState] = useState<ThemeMode>("system");
	const [isHydrated, setIsHydrated] = useState(false);

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

	const resolvedMode = mode === "system" ? systemMode : mode;
	const theme = resolvedMode === "dark" ? darkTheme : lightTheme;

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
