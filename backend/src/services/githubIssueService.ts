import { env } from '../config/env.js';

interface CreateIssueInput {
    title: string;
    body: string;
    labels: string[];
}

interface CreateIssueResult {
    number: number;
    url: string;
}

class GitHubIssueService {
    isConfigured(): boolean {
        return Boolean(
            env.GITHUB_ISSUE_TOKEN &&
            env.GITHUB_ISSUE_OWNER &&
            env.GITHUB_ISSUE_REPO
        );
    }

    async createIssue(input: CreateIssueInput): Promise<CreateIssueResult> {
        if (!this.isConfigured()) {
            throw new Error('GitHub issue integration is not configured.');
        }

        const endpoint = `https://api.github.com/repos/${encodeURIComponent(env.GITHUB_ISSUE_OWNER!)}/${encodeURIComponent(env.GITHUB_ISSUE_REPO!)}/issues`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${env.GITHUB_ISSUE_TOKEN}`,
                Accept: 'application/vnd.github+json',
                'Content-Type': 'application/json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
            body: JSON.stringify({
                title: input.title,
                body: input.body,
                labels: input.labels
            }),
            signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub issue creation failed with ${response.status}: ${errorText}`);
        }

        const payload = (await response.json()) as { number?: number; html_url?: string };

        if (typeof payload.number !== 'number' || typeof payload.html_url !== 'string') {
            throw new Error('GitHub issue response payload was incomplete.');
        }

        return {
            number: payload.number,
            url: payload.html_url
        };
    }
}

export const githubIssueService = new GitHubIssueService();
