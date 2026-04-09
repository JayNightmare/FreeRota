import { gql } from "@apollo/client";

export const REGISTER_MUTATION = gql`
	mutation Register($input: RegisterInput!) {
		register(input: $input) {
			token
		}
	}
`;

export const LOGIN_MUTATION = gql`
	mutation Login($email: String!, $password: String!) {
		login(email: $email, password: $password) {
			token
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
		}
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
		}
	}
`;

export const DELETE_ROTA_ENTRY_MUTATION = gql`
	mutation DeleteRotaEntry($id: ID!) {
		deleteRotaEntry(id: $id)
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
