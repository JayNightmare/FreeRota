export type AuthLinkFlow = "verify-email" | "reset-password";

export interface ParsedAuthLink {
    flow: AuthLinkFlow | null;
    token: string | null;
}

function normalizeFlow(value: string | null | undefined): AuthLinkFlow | null {
    if (!value) {
        return null;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === "verify-email" || normalized === "reset-password") {
        return normalized;
    }

    return null;
}

export function parseAuthLink(url: string): ParsedAuthLink {
    try {
        const parsed = new URL(url);
        const flow = normalizeFlow(parsed.searchParams.get("flow"));
        const token = parsed.searchParams.get("token")?.trim() || null;

        if (flow && token) {
            return { flow, token };
        }

        const pathFlow = normalizeFlow(parsed.pathname.replace(/^\//, ""));
        if (pathFlow && token) {
            return { flow: pathFlow, token };
        }
    } catch {
        // Fallback below for environments where URL parsing might fail.
    }

    const flowMatch = /[?&]flow=([^&#]+)/i.exec(url);
    const tokenMatch = /[?&]token=([^&#]+)/i.exec(url);
    const flow = normalizeFlow(flowMatch ? decodeURIComponent(flowMatch[1]) : null);
    const token = tokenMatch ? decodeURIComponent(tokenMatch[1]).trim() : null;

    return {
        flow,
        token: token || null,
    };
}
