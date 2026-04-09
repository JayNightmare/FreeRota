import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { schema } from './graphql/schema.js';
import { buildContext } from './graphql/context.js';

async function bootstrap(): Promise<void> {
    await connectDatabase(env.MONGODB_URI);

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

    const server = createServer(yoga);
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
