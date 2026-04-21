import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { schema } from './graphql/schema.js';
import { buildContext } from './graphql/context.js';
import { notificationService } from './services/notificationService.js';
import { ssoService } from './services/ssoService.js';

async function bootstrap(): Promise<void> {
    await connectDatabase(env.MONGODB_URI);
    await notificationService.ensureSeedData();

    const yoga = createYoga({
        schema,
        context: buildContext,
        maskedErrors: false,
        cors:
            env.FRONTEND_ORIGIN === '*'
                ? {}
                : {
                    origin: env.FRONTEND_ORIGIN,
                    credentials: true
                }
    });

    const server = createServer(async (req, res) => {
        // Native REST Intercept for pure SAML/OIDC POST Callbacks
        if (req.url === '/api/sso/callback' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', async () => {
                try {
                    const parsed = JSON.parse(body);
                    const { payload, orgId } = parsed;
                    const token = await ssoService.processAssertion(payload, orgId);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, token }));
                } catch (err: any) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: err.message }));
                }
            });
            return;
        }

        // Standard GraphQL routing
        yoga(req, res);
    });
    server.listen(env.PORT, () => {
        console.log(`FreeRota API listening on http://localhost:${env.PORT}/graphql`);
    });

    const shutdown = async (): Promise<void> => {
        server.close(async () => {
            await disconnectDatabase();
            process.exit(0);
        });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
    console.error('Failed to start backend', error);
    process.exit(1);
});
