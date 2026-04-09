import { createSchema } from 'graphql-yoga';
import { resolvers } from './resolvers/index.js';

const typeDefs = /* GraphQL */ `
  scalar DateTime

  type AuthPayload {
    token: String!
  }

  type User {
    id: ID!
    email: String!
    username: String!
    displayName: String!
    timezone: String!
    isPublic: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type RotaEntry {
    id: ID!
    userId: ID!
    type: String!
    startUtc: DateTime!
    endUtc: DateTime!
    note: String
    sourceType: String!
    recurrenceRule: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Friendship {
    id: ID!
    requesterId: ID!
    addresseeId: ID!
    requesterUsername: String!
    addresseeUsername: String!
    status: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Conversation {
    id: ID!
    participantIds: [ID!]!
    directKey: String!
    lastMessageAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Message {
    id: ID!
    conversationId: ID!
    senderId: ID!
    recipientId: ID!
    body: String!
    sentAt: DateTime!
    deliveryState: String!
    readAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type FreeWindow {
    startUtc: DateTime!
    endUtc: DateTime!
    durationMinutes: Int!
  }

  input RegisterInput {
    email: String!
    username: String!
    password: String!
    displayName: String
    timezone: String = "UTC"
    isPublic: Boolean = false
  }

  input UpdateAccountInput {
    username: String
    displayName: String
    timezone: String
    isPublic: Boolean
  }

  input CreateRotaEntryInput {
    type: String!
    startUtc: DateTime!
    endUtc: DateTime!
    note: String
  }

  input UpdateRotaEntryInput {
    type: String
    startUtc: DateTime
    endUtc: DateTime
    note: String
  }

  type Query {
    me: User!
    userProfile(userId: ID!): User!
    myRota(rangeStartUtc: DateTime!, rangeEndUtc: DateTime!): [RotaEntry!]!
    visibleRota(userId: ID!, rangeStartUtc: DateTime!, rangeEndUtc: DateTime!): [RotaEntry!]!
    friendships(status: String): [Friendship!]!
    incomingFriendRequests: [Friendship!]!
    conversations: [Conversation!]!
    messages(conversationId: ID!, limit: Int = 30, cursor: String): [Message!]!
    findCommonFreeTime(
      userIds: [ID!]!
      rangeStartUtc: DateTime!
      rangeEndUtc: DateTime!
      minDurationMinutes: Int = 30
    ): [FreeWindow!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    updateAccount(input: UpdateAccountInput!): User!
    deleteAccount: Boolean!

    createRotaEntry(input: CreateRotaEntryInput!): RotaEntry!
    updateRotaEntry(id: ID!, input: UpdateRotaEntryInput!): RotaEntry!
    deleteRotaEntry(id: ID!): Boolean!

    sendFriendRequest(username: String!): Friendship!
    acceptFriendRequest(friendshipId: ID!): Friendship!
    rejectFriendRequest(friendshipId: ID!): Friendship!
    removeFriend(friendId: ID!): Boolean!
    blockUser(targetUserId: ID!): Friendship!
    unblockUser(targetUserId: ID!): Boolean!

    createConversationWith(targetUserId: ID!): Conversation!
    sendMessage(recipientId: ID!, body: String!): Message!
    markMessageRead(messageId: ID!): Message!
  }

  type Subscription {
    messageReceived: Message
  }
`;

export const schema = createSchema({
  typeDefs,
  resolvers
});
