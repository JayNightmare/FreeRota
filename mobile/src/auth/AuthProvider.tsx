import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadStoredAuthToken, persistAuthToken } from "./authStorage";

interface AuthContextValue {
	token: string | null;
	isBootstrapping: boolean;
	signIn: (token: string) => Promise<void>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [token, setToken] = useState<string | null>(null);
	const [isBootstrapping, setIsBootstrapping] = useState(true);

	useEffect(() => {
		let active = true;

		const bootstrap = async (): Promise<void> => {
			try {
				const storedToken = await loadStoredAuthToken();
				if (active) {
					setToken(storedToken);
				}
			} finally {
				if (active) {
					setIsBootstrapping(false);
				}
			}
		};

		void bootstrap();

		return () => {
			active = false;
		};
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			token,
			isBootstrapping,
			signIn: async (nextToken: string) => {
				await persistAuthToken(nextToken);
				setToken(nextToken);
			},
			signOut: async () => {
				await persistAuthToken(null);
				setToken(null);
			}
		}),
		[isBootstrapping, token]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}

	return context;
}
