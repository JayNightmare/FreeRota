import { createSchema } from 'graphql-yoga';
import { resolvers } from './resolvers/index.js';

const typeDefs = /* GraphQL */ `
  scalar DateTime

  type AuthPayload {
    token: String!
  }

  type ActionResult {
    success: Boolean!
    message: String!
  }

  type User {
    id: ID!
    email: String!
    username: String!
    displayName: String!
    timezone: String!
    isPublic: Boolean!
    uiAccentColor: String
    emailVerifiedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ShiftType {
    id: ID!
    userId: ID!
    name: String!
    color: String!
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
    shiftTypeId: ID
    shiftTitle: String
    shiftType: ShiftType
    sourceType: String!
    recurrenceRule: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type RotaImportPreviewEntry {
    type: String!
    startUtc: DateTime!
    endUtc: DateTime!
    note: String
  }

  type RotaImportPreview {
    extractedText: String!
    entries: [RotaImportPreviewEntry!]!
  }

  input DeviceCalendarEventInput {
    eventId: String!
    calendarId: String!
    title: String
    notes: String
    status: String
    startUtc: DateTime!
    endUtc: DateTime!
    allDay: Boolean
    recurrenceRule: String
  }

  type CalendarImportPreviewEntry {
    eventId: String!
    calendarId: String!
    title: String
    type: String!
    startUtc: DateTime!
    endUtc: DateTime!
    note: String
    sourceType: String!
    recurrenceRule: String
    isDuplicate: Boolean!
    isConflict: Boolean!
  }

  type CalendarImportPreview {
    entries: [CalendarImportPreviewEntry!]!
    totalCount: Int!
    duplicateCount: Int!
    conflictCount: Int!
    skippedCancelledCount: Int!
    skippedInvalidCount: Int!
  }

  type CalendarImportResult {
    created: [RotaEntry!]!
    totalConsidered: Int!
    createdCount: Int!
    skippedDuplicates: Int!
    replacedConflicts: Int!
    conflictCount: Int!
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
    uiAccentColor: String
  }

  input CreateRotaEntryInput {
    type: String!
    startUtc: DateTime!
    endUtc: DateTime!
    note: String
    shiftTypeId: ID
    shiftTitle: String
  }

  input UpdateRotaEntryInput {
    type: String
    startUtc: DateTime
    endUtc: DateTime
    note: String
    shiftTypeId: ID
    shiftTitle: String
  }

  input CreateShiftTypeInput {
    name: String!
    color: String
  }

  input UpdateShiftTypeInput {
    name: String
    color: String
  }

  type Query {
    me: User!
    myShiftTypes: [ShiftType!]!
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
    register(input: RegisterInput!): ActionResult!
    login(username: String!, password: String!): AuthPayload!
    requestEmailVerification(email: String!): ActionResult!
    verifyEmail(token: String!): AuthPayload!
    requestPasswordReset(identifier: String!): ActionResult!
    resetPassword(token: String!, newPassword: String!): ActionResult!
    updateAccount(input: UpdateAccountInput!): User!
    deleteAccount: Boolean!

    createShiftType(input: CreateShiftTypeInput!): ShiftType!
    updateShiftType(id: ID!, input: UpdateShiftTypeInput!): ShiftType!
    deleteShiftType(id: ID!): Boolean!

    createRotaEntry(input: CreateRotaEntryInput!): RotaEntry!
    updateRotaEntry(id: ID!, input: UpdateRotaEntryInput!): RotaEntry!
    deleteRotaEntry(id: ID!): Boolean!
    previewRotaScreenshot(imageBase64: String!, referenceDate: DateTime): RotaImportPreview!
    importRotaScreenshot(imageBase64: String!, referenceDate: DateTime): [RotaEntry!]!
    previewDeviceCalendarImport(events: [DeviceCalendarEventInput!]!): CalendarImportPreview!
    importDeviceCalendar(
      events: [DeviceCalendarEventInput!]!
      duplicateMode: String = "SKIP_DUPLICATES"
    ): CalendarImportResult!

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
