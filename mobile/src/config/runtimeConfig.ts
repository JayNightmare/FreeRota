import Constants from "expo-constants";

interface RuntimeConfig {
    graphqlUrl: string;
    graphqlPath: string;
    apiPort: number;
    resolvedFrom: "env" | "expo-extra" | "expo-host";
}

interface ExpoExtraApiConfig {
    api?: {
        port?: number;
        graphqlPath?: string;
    };
    graphqlUrl?: string;
}

function getExpoExtraConfig(): ExpoExtraApiConfig {
    const extra = Constants.expoConfig?.extra;
    if (!extra || typeof extra !== "object") {
        return {};
    }

    return extra as ExpoExtraApiConfig;
}

function normalizeGraphqlPath(pathValue: string | undefined): string {
    if (!pathValue || !pathValue.trim()) {
        return "/graphql";
    }

    return pathValue.startsWith("/") ? pathValue : `/${pathValue}`;
}

function resolveApiPort(extra: ExpoExtraApiConfig): number {
    const envPort = process.env.EXPO_PUBLIC_API_PORT;
    if (envPort && /^\d+$/.test(envPort)) {
        return Number(envPort);
    }

    if (typeof extra.api?.port === "number") {
        return extra.api.port;
    }

    return 4000;
}

function resolveGraphqlPath(extra: ExpoExtraApiConfig): string {
    const envPath = process.env.EXPO_PUBLIC_GRAPHQL_PATH;
    if (envPath && envPath.trim()) {
        return normalizeGraphqlPath(envPath);
    }

    return normalizeGraphqlPath(extra.api?.graphqlPath);
}

function resolveGraphqlUrlFromExpoHost(apiPort: number, graphqlPath: string): string | null {
    const hostUri = Constants.expoConfig?.hostUri;
    if (!hostUri) {
        return null;
    }

    const host = hostUri.split(":")[0];
    if (!host) {
        return null;
    }

    return `http://${host}:${apiPort}${graphqlPath}`;
}

export function resolveRuntimeConfig(): RuntimeConfig {
    const extra = getExpoExtraConfig();
    const apiPort = resolveApiPort(extra);
    const graphqlPath = resolveGraphqlPath(extra);

    const envUrl = process.env.EXPO_PUBLIC_GRAPHQL_URL?.trim();
    if (envUrl) {
        return {
            graphqlUrl: envUrl,
            graphqlPath,
            apiPort,
            resolvedFrom: "env"
        };
    }

    const extraUrl = typeof extra.graphqlUrl === "string" ? extra.graphqlUrl.trim() : "";
    if (extraUrl) {
        return {
            graphqlUrl: extraUrl,
            graphqlPath,
            apiPort,
            resolvedFrom: "expo-extra"
        };
    }

    const hostDerivedUrl = resolveGraphqlUrlFromExpoHost(apiPort, graphqlPath);
    if (hostDerivedUrl) {
        return {
            graphqlUrl: hostDerivedUrl,
            graphqlPath,
            apiPort,
            resolvedFrom: "expo-host"
        };
    }

    throw new Error(
        "Unable to resolve GraphQL API URL. Set EXPO_PUBLIC_GRAPHQL_URL or app.json expo.extra.graphqlUrl."
    );
}

export const runtimeConfig = resolveRuntimeConfig();
