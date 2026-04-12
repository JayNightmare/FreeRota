import { emailService } from '../services/emailService.js';

type TestMode = 'verify' | 'reset' | 'both';

function parseMode(value: string | undefined): TestMode {
    if (value === 'verify' || value === 'reset' || value === 'both') {
        return value;
    }

    return 'both';
}

function readRecipient(): string {
    const fromArg = process.argv[2]?.trim();
    const fromEnv = process.env.TEST_EMAIL_TO?.trim();
    const recipient = fromArg || fromEnv;

    if (!recipient) {
        throw new Error('Missing recipient email. Pass as first argument or set TEST_EMAIL_TO.');
    }

    return recipient;
}

async function run(): Promise<void> {
    const recipient = readRecipient();
    const mode = parseMode(process.argv[3]);
    const token = `test-token-${Date.now()}`;
    const username = 'FreeRota Tester';

    console.info('[EmailTest] Starting', {
        recipient,
        mode
    });

    if (mode === 'verify' || mode === 'both') {
        await emailService.sendVerificationEmail(recipient, username, token);
        console.info('[EmailTest] Verification email sent');
    }

    if (mode === 'reset' || mode === 'both') {
        await emailService.sendPasswordResetEmail(recipient, username, token);
        console.info('[EmailTest] Password reset email sent');
    }

    console.info('[EmailTest] Completed successfully');
}

run().catch((error) => {
    console.error('[EmailTest] Failed', error);
    process.exit(1);
});
