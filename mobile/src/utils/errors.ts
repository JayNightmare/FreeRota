import { runtimeConfig } from "../config/runtimeConfig";

function getGraphqlErrorMessage(error: unknown): string | null {
    if (!error || typeof error !== "object") {
        return null;
    }

    const maybeGraphqlErrors = (error as { graphQLErrors?: Array<{ message?: string }> }).graphQLErrors;
    if (!Array.isArray(maybeGraphqlErrors) || maybeGraphqlErrors.length === 0) {
        return null;
    }

    const firstMessage = maybeGraphqlErrors[0]?.message?.trim();
    return firstMessage || null;
}

export function toUserErrorMessage(error: unknown, fallback: string): string {
    const graphqlMessage = getGraphqlErrorMessage(error);
    if (graphqlMessage) {
        return graphqlMessage;
    }

    if (!(error instanceof Error)) {
        return fallback;
    }

    const message = error.message?.trim();
    if (!message) {
        return fallback;
    }

    const isNetworkError = /network request failed|fetch failed|failed to fetch/i.test(message);
    if (isNetworkError) {
        return `Unable to reach API at ${runtimeConfig.graphqlUrl} (source: ${runtimeConfig.resolvedFrom}). Ensure backend is running and reachable from your device.`;
    }

    return message;
}
