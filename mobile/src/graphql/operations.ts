import { gql } from "@apollo/client";

export const REGISTER_MUTATION = gql`
	mutation Register($input: RegisterInput!) {
		register(input: $input) {
			token
		}
	}
`;

export const LOGIN_MUTATION = gql`
	mutation Login($username: String!, $password: String!) {
		login(username: $username, password: $password) {
			token
		}
	}
`;

export const REQUEST_EMAIL_VERIFICATION_MUTATION = gql`
	mutation RequestEmailVerification($email: String!) {
		requestEmailVerification(email: $email) {
			success
			message
		}
	}
`;

export const VERIFY_EMAIL_MUTATION = gql`
	mutation VerifyEmail($code: String!) {
		verifyEmail(code: $code) {
			success
			message
		}
	}
`;

export const REQUEST_PASSWORD_RESET_MUTATION = gql`
	mutation RequestPasswordReset($identifier: String!) {
		requestPasswordReset(identifier: $identifier) {
			success
			message
		}
	}
`;

export const RESET_PASSWORD_MUTATION = gql`
	mutation ResetPassword($token: String!, $newPassword: String!) {
		resetPassword(token: $token, newPassword: $newPassword) {
			success
			message
		}
	}
`;

export const ME_QUERY = gql`
	query Me {
		me {
			id
			email
			username
			displayName
			timezone
			isPublic
			isAdmin
			uiAccentColor
			emailVerifiedAt
		}
	}
`;

export const UPDATE_ACCOUNT_MUTATION = gql`
	mutation UpdateAccount($input: UpdateAccountInput!) {
		updateAccount(input: $input) {
			id
			username
			displayName
			timezone
			isPublic
			uiAccentColor
		}
	}
`;

export const CHANGE_EMAIL_MUTATION = gql`
	mutation ChangeEmail($input: ChangeEmailInput!) {
		changeEmail(input: $input) {
			success
			message
		}
	}
`;

export const CHANGE_PASSWORD_MUTATION = gql`
	mutation ChangePassword($input: ChangePasswordInput!) {
		changePassword(input: $input) {
			success
			message
		}
	}
`;

export const CONTACT_SUPPORT_MUTATION = gql`
	mutation ContactSupport($input: ContactSupportInput!) {
		contactSupport(input: $input) {
			success
			message
			issueCreated
			issueNumber
			issueUrl
		}
	}
`;

export const SUBMIT_ENTERPRISE_INQUIRY_MUTATION = gql`
	mutation SubmitEnterpriseInquiry($input: EnterpriseInquiryInput!) {
		submitEnterpriseInquiry(input: $input) {
			success
			message
			ticketId
		}
	}
`;

export const MY_SHIFT_TYPES_QUERY = gql`
	query MyShiftTypes {
		myShiftTypes {
			id
			userId
			name
			color
			createdAt
			updatedAt
		}
	}
`;

export const CREATE_SHIFT_TYPE_MUTATION = gql`
	mutation CreateShiftType($input: CreateShiftTypeInput!) {
		createShiftType(input: $input) {
			id
			userId
			name
			color
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_SHIFT_TYPE_MUTATION = gql`
	mutation UpdateShiftType($id: ID!, $input: UpdateShiftTypeInput!) {
		updateShiftType(id: $id, input: $input) {
			id
			userId
			name
			color
			createdAt
			updatedAt
		}
	}
`;

export const DELETE_SHIFT_TYPE_MUTATION = gql`
	mutation DeleteShiftType($id: ID!) {
		deleteShiftType(id: $id)
	}
`;

export const DELETE_ACCOUNT_MUTATION = gql`
	mutation DeleteAccount {
		deleteAccount
	}
`;

export const MY_ROTA_QUERY = gql`
	query MyRota($rangeStartUtc: DateTime!, $rangeEndUtc: DateTime!) {
		myRota(rangeStartUtc: $rangeStartUtc, rangeEndUtc: $rangeEndUtc) {
			id
			type
			startUtc
			endUtc
			note
			shiftTypeId
			shiftTitle
			shiftType {
				id
				name
				color
			}
		}
	}
`;

export const CREATE_ROTA_ENTRY_MUTATION = gql`
	mutation CreateRotaEntry($input: CreateRotaEntryInput!) {
		createRotaEntry(input: $input) {
			id
			type
			startUtc
			endUtc
			note
			shiftTypeId
			shiftTitle
			shiftType {
				id
				name
				color
			}
		}
	}
`;

export const UPDATE_ROTA_ENTRY_MUTATION = gql`
	mutation UpdateRotaEntry($id: ID!, $input: UpdateRotaEntryInput!) {
		updateRotaEntry(id: $id, input: $input) {
			id
			type
			startUtc
			endUtc
			note
			shiftTypeId
			shiftTitle
			shiftType {
				id
				name
				color
			}
		}
	}
`;

export const DELETE_ROTA_ENTRY_MUTATION = gql`
	mutation DeleteRotaEntry($id: ID!) {
		deleteRotaEntry(id: $id)
	}
`;

export const IMPORT_ROTA_SCREENSHOT_MUTATION = gql`
	mutation ImportRotaScreenshot($imageBase64: String!, $referenceDate: DateTime) {
		importRotaScreenshot(imageBase64: $imageBase64, referenceDate: $referenceDate) {
			id
			type
			startUtc
			endUtc
			note
			shiftTypeId
			shiftTitle
			shiftType {
				id
				name
				color
			}
		}
	}
`;

export const PREVIEW_ROTA_SCREENSHOT_MUTATION = gql`
	mutation PreviewRotaScreenshot($imageBase64: String!, $referenceDate: DateTime) {
		previewRotaScreenshot(imageBase64: $imageBase64, referenceDate: $referenceDate) {
			extractedText
			entries {
				type
				startUtc
				endUtc
				note
			}
		}
	}
`;

export const PREVIEW_DEVICE_CALENDAR_IMPORT_MUTATION = gql`
	mutation PreviewDeviceCalendarImport($events: [DeviceCalendarEventInput!]!) {
		previewDeviceCalendarImport(events: $events) {
			entries {
				eventId
				calendarId
				title
				type
				startUtc
				endUtc
				note
				sourceType
				recurrenceRule
				isDuplicate
				isConflict
			}
			totalCount
			duplicateCount
			conflictCount
			skippedCancelledCount
			skippedInvalidCount
		}
	}
`;

export const IMPORT_DEVICE_CALENDAR_MUTATION = gql`
	mutation ImportDeviceCalendar($events: [DeviceCalendarEventInput!]!, $duplicateMode: String) {
		importDeviceCalendar(events: $events, duplicateMode: $duplicateMode) {
			created {
				id
				type
				startUtc
				endUtc
				note
				shiftTypeId
				shiftTitle
				shiftType {
					id
					name
					color
				}
			}
			totalConsidered
			createdCount
			skippedDuplicates
			replacedConflicts
			conflictCount
		}
	}
`;

export const FRIENDSHIPS_QUERY = gql`
	query Friendships($status: String) {
		friendships(status: $status) {
			id
			requesterId
			addresseeId
			requesterUsername
			addresseeUsername
			status
			createdAt
			updatedAt
		}
	}
`;

export const INCOMING_REQUESTS_QUERY = gql`
	query IncomingFriendRequests {
		incomingFriendRequests {
			id
			requesterId
			addresseeId
			requesterUsername
			addresseeUsername
			status
		}
	}
`;

export const SEND_FRIEND_REQUEST_MUTATION = gql`
	mutation SendFriendRequest($username: String!) {
		sendFriendRequest(username: $username) {
			id
			status
		}
	}
`;

export const ACCEPT_FRIEND_REQUEST_MUTATION = gql`
	mutation AcceptFriendRequest($friendshipId: ID!) {
		acceptFriendRequest(friendshipId: $friendshipId) {
			id
			status
		}
	}
`;

export const REJECT_FRIEND_REQUEST_MUTATION = gql`
	mutation RejectFriendRequest($friendshipId: ID!) {
		rejectFriendRequest(friendshipId: $friendshipId) {
			id
			status
		}
	}
`;

export const REMOVE_FRIEND_MUTATION = gql`
	mutation RemoveFriend($friendId: ID!) {
		removeFriend(friendId: $friendId)
	}
`;

export const BLOCK_USER_MUTATION = gql`
	mutation BlockUser($targetUserId: ID!) {
		blockUser(targetUserId: $targetUserId) {
			id
			status
		}
	}
`;

export const UNBLOCK_USER_MUTATION = gql`
	mutation UnblockUser($targetUserId: ID!) {
		unblockUser(targetUserId: $targetUserId)
	}
`;

export const FIND_COMMON_FREE_TIME_QUERY = gql`
	query FindCommonFreeTime(
		$userIds: [ID!]!
		$rangeStartUtc: DateTime!
		$rangeEndUtc: DateTime!
		$minDurationMinutes: Int
	) {
		findCommonFreeTime(
			userIds: $userIds
			rangeStartUtc: $rangeStartUtc
			rangeEndUtc: $rangeEndUtc
			minDurationMinutes: $minDurationMinutes
		) {
			startUtc
			endUtc
			durationMinutes
		}
	}
`;

export const CONVERSATIONS_QUERY = gql`
	query Conversations {
		conversations {
			id
			participantIds
			lastMessageAt
		}
	}
`;

export const MESSAGES_QUERY = gql`
	query Messages($conversationId: ID!, $limit: Int, $cursor: String) {
		messages(conversationId: $conversationId, limit: $limit, cursor: $cursor) {
			id
			conversationId
			senderId
			recipientId
			body
			sentAt
			deliveryState
			readAt
		}
	}
`;

export const CREATE_CONVERSATION_MUTATION = gql`
	mutation CreateConversationWith($targetUserId: ID!) {
		createConversationWith(targetUserId: $targetUserId) {
			id
			participantIds
		}
	}
`;

export const SEND_MESSAGE_MUTATION = gql`
	mutation SendMessage($recipientId: ID!, $body: String!) {
		sendMessage(recipientId: $recipientId, body: $body) {
			id
			conversationId
			senderId
			recipientId
			body
			sentAt
			deliveryState
		}
	}
`;

export const MARK_MESSAGE_READ_MUTATION = gql`
	mutation MarkMessageRead($messageId: ID!) {
		markMessageRead(messageId: $messageId) {
			id
			deliveryState
			readAt
		}
	}
`;

export const NOTIFICATIONS_QUERY = gql`
	query Notifications($limit: Int, $cursor: String) {
		notifications(limit: $limit, cursor: $cursor) {
			id
			title
			body
			category
			version
			linkUrl
			publishedAt
			isRead
			createdAt
			updatedAt
		}
	}
`;

export const NOTIFICATION_UNREAD_COUNT_QUERY = gql`
	query NotificationUnreadCount {
		notificationUnreadCount
	}
`;

export const MARK_NOTIFICATION_READ_MUTATION = gql`
	mutation MarkNotificationRead($notificationId: ID!) {
		markNotificationRead(notificationId: $notificationId) {
			id
			isRead
			updatedAt
		}
	}
`;

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
	mutation MarkAllNotificationsRead {
		markAllNotificationsRead {
			success
			message
		}
	}
`;
