import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "freerota.auth-token";

let authToken: string | null = null;

export function getAuthToken(): string | null {
    return authToken;
}

export function setAuthToken(token: string | null): void {
    authToken = token;
}

export async function loadStoredAuthToken(): Promise<string | null> {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    setAuthToken(token);
    return token;
}

export async function persistAuthToken(token: string | null): Promise<void> {
    setAuthToken(token);

    if (!token) {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        return;
    }

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}
