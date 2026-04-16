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
    isAdmin: Boolean!
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

  enum NotificationCategory {
    BUG_FIX
    RELEASE
    UPDATE
    MAINTENANCE
  }

  enum AdminApplicationStatus {
    PENDING
    APPROVED
    REJECTED
  }

  type Notification {
    id: ID!
    title: String!
    body: String!
    category: NotificationCategory!
    version: String
    linkUrl: String
    publishedAt: DateTime!
    isRead: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AdminApplication {
    id: ID!
    userId: ID!
    applicantUsername: String!
    applicantDisplayName: String!
    applicantEmail: String!
    motivation: String!
    discordHandle: String
    status: AdminApplicationStatus!
    submittedAt: DateTime!
    reviewedAt: DateTime
    reviewedByUserId: ID
    reviewNote: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AdminApplicationSubmissionResult {
    success: Boolean!
    message: String!
    application: AdminApplication!
    discordDelivered: Boolean!
  }

  type FreeWindow {
    startUtc: DateTime!
    endUtc: DateTime!
    durationMinutes: Int!
  }

  enum ContactReason {
    BUG_REPORT
    FEATURE_REQUEST
    ACCOUNT_LOGIN_PROBLEM
    OTHER
  }

  enum ContactUrgency {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  type ContactSupportResult {
    success: Boolean!
    message: String!
    issueCreated: Boolean!
    issueNumber: Int
    issueUrl: String
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

  input ChangeEmailInput {
    newEmail: String!
    password: String!
    reason: String!
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  input ContactSupportInput {
    title: String!
    reason: ContactReason!
    urgency: ContactUrgency!
    message: String!
  }

  input ApplyForAdminInput {
    motivation: String!
    discordHandle: String
  }

  input PublishNotificationInput {
    title: String!
    body: String!
    category: NotificationCategory = UPDATE
    version: String
    linkUrl: String
    publishedAt: DateTime
  }

  type Query {
    me: User!
    myAdminApplication: AdminApplication
    pendingAdminApplications(limit: Int = 25): [AdminApplication!]!
    myShiftTypes: [ShiftType!]!
    userProfile(userId: ID!): User!
    myRota(rangeStartUtc: DateTime!, rangeEndUtc: DateTime!): [RotaEntry!]!
    visibleRota(userId: ID!, rangeStartUtc: DateTime!, rangeEndUtc: DateTime!): [RotaEntry!]!
    friendships(status: String): [Friendship!]!
    incomingFriendRequests: [Friendship!]!
    conversations: [Conversation!]!
    messages(conversationId: ID!, limit: Int = 30, cursor: String): [Message!]!
    notifications(limit: Int = 20, cursor: String): [Notification!]!
    notificationUnreadCount: Int!
    findCommonFreeTime(
      userIds: [ID!]!
      rangeStartUtc: DateTime!
      rangeEndUtc: DateTime!
      minDurationMinutes: Int = 30
    ): [FreeWindow!]!
  }

  type Mutation {
    applyForAdmin(input: ApplyForAdminInput!): AdminApplicationSubmissionResult!
    approveAdminApplication(applicationId: ID!, reviewNote: String): AdminApplication!
    rejectAdminApplication(applicationId: ID!, reviewNote: String!): AdminApplication!

    register(input: RegisterInput!): AuthPayload!
    login(username: String!, password: String!): AuthPayload!
    requestEmailVerification(email: String!): ActionResult!
    verifyEmail(code: String!): ActionResult!
    requestPasswordReset(identifier: String!): ActionResult!
    resetPassword(token: String!, newPassword: String!): ActionResult!
    updateAccount(input: UpdateAccountInput!): User!
    changeEmail(input: ChangeEmailInput!): ActionResult!
    changePassword(input: ChangePasswordInput!): ActionResult!
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
    markNotificationRead(notificationId: ID!): Notification!
    markAllNotificationsRead: ActionResult!
    publishNotification(input: PublishNotificationInput!): Notification!
    contactSupport(input: ContactSupportInput!): ContactSupportResult!
  }

  type Subscription {
    messageReceived: Message
  }
`;

export const schema = createSchema({
  typeDefs,
  resolvers
});
