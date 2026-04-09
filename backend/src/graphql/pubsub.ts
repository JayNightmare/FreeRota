import { createPubSub } from 'graphql-yoga';

export const pubSub = createPubSub<{
    MESSAGE_SENT: [{ recipientId: string; message: unknown }];
}>();
