import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery } from "@apollo/client";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { FormField } from "../components/FormField";
import { ActionButton } from "../components/ActionButton";
import { StateNotice } from "../components/StateNotice";
import {
	CONVERSATIONS_QUERY,
	CREATE_CONVERSATION_MUTATION,
	MARK_MESSAGE_READ_MUTATION,
	ME_QUERY,
	MESSAGES_QUERY,
	SEND_MESSAGE_MUTATION,
} from "../graphql/operations";
import { useTheme } from "../theme/useTheme";
import { toLocalDateTime } from "../utils/time";
import { toUserErrorMessage } from "../utils/errors";

interface Conversation {
	id: string;
	participantIds: string[];
	lastMessageAt?: string | null;
}

interface Message {
	id: string;
	conversationId: string;
	senderId: string;
	recipientId: string;
	body: string;
	sentAt: string;
	deliveryState: "SENT" | "DELIVERED" | "READ";
}

interface ConversationsQuery {
	conversations: Conversation[];
}

interface MessagesQuery {
	messages: Message[];
}

interface MeQuery {
	me: {
		id: string;
	};
}

export function MessagesScreen() {
	const { theme } = useTheme();
	const [targetUserId, setTargetUserId] = useState("");
	const [selectedConversationId, setSelectedConversationId] = useState<
		string | null
	>(null);
	const [messageBody, setMessageBody] = useState("");
	const [actionError, setActionError] = useState<string | null>(null);

	const { data: meData } = useQuery<MeQuery>(ME_QUERY);
	const {
		data: conversationsData,
		loading: loadingConversations,
		error: conversationsError,
		refetch: refetchConversations,
	} = useQuery<ConversationsQuery>(CONVERSATIONS_QUERY, {
		pollInterval: 6000,
	});

	const {
		data: messagesData,
		loading: loadingMessages,
		error: messagesError,
		refetch: refetchMessages,
	} = useQuery<MessagesQuery>(MESSAGES_QUERY, {
		variables: {
			conversationId: selectedConversationId,
			limit: 50,
			cursor: null,
		},
		skip: !selectedConversationId,
		pollInterval: selectedConversationId ? 4000 : 0,
	});

	const [createConversationWith, { loading: creatingConversation }] =
		useMutation(CREATE_CONVERSATION_MUTATION);
	const [sendMessage, { loading: sendingMessage }] = useMutation(
		SEND_MESSAGE_MUTATION,
	);
	const [markMessageRead] = useMutation(MARK_MESSAGE_READ_MUTATION);

	const myId = meData?.me?.id;

	const selectedConversation = useMemo(
		() =>
			conversationsData?.conversations?.find(
				(conversation) =>
					conversation.id ===
					selectedConversationId,
			) ?? null,
		[conversationsData?.conversations, selectedConversationId],
	);

	const recipientId = useMemo(() => {
		if (!selectedConversation || !myId) {
			return null;
		}

		return (
			selectedConversation.participantIds.find(
				(participantId) => participantId !== myId,
			) ?? null
		);
	}, [myId, selectedConversation]);

	const styles = useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: theme.spacing.lg,
				},
				card: {
					backgroundColor: theme.colors.surface,
					borderWidth: 1,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.lg,
					padding: theme.spacing.lg,
					gap: theme.spacing.md,
				},
				title: {
					fontSize: theme.typography.heading,
					fontWeight: "800",
					color: theme.colors.textPrimary,
				},
				row: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
				conversationCard: {
					borderWidth: 1,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.md,
					padding: theme.spacing.md,
					gap: theme.spacing.xs,
					backgroundColor:
						theme.colors.surfaceElevated,
				},
				messageCard: {
					borderWidth: 1,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.md,
					padding: theme.spacing.md,
					gap: theme.spacing.xs,
					backgroundColor:
						theme.colors.surfaceElevated,
				},
				messageMeta: {
					fontSize: theme.typography.caption,
					color: theme.colors.textMuted,
				},
				messageBody: {
					fontSize: theme.typography.body,
					color: theme.colors.textPrimary,
				},
			}),
		[theme],
	);

	const createConversation = async (): Promise<void> => {
		if (!targetUserId.trim()) {
			setActionError("Enter target user ID.");
			return;
		}

		setActionError(null);
		try {
			const response = await createConversationWith({
				variables: {
					targetUserId: targetUserId.trim(),
				},
			});
			const id: string | undefined =
				response.data?.createConversationWith?.id;
			if (id) {
				setSelectedConversationId(id);
			}
			setTargetUserId("");
			await refetchConversations();
		} catch (mutationError) {
			setActionError(
				toUserErrorMessage(
					mutationError,
					"Failed to create conversation.",
				),
			);
		}
	};

	const submitMessage = async (): Promise<void> => {
		if (!recipientId || !messageBody.trim()) {
			setActionError(
				"Select a conversation and type a message.",
			);
			return;
		}

		setActionError(null);
		try {
			await sendMessage({
				variables: {
					recipientId,
					body: messageBody.trim(),
				},
			});
			setMessageBody("");
			await refetchMessages();
			await refetchConversations();
		} catch (mutationError) {
			setActionError(
				toUserErrorMessage(
					mutationError,
					"Failed to send message.",
				),
			);
		}
	};

	const markRead = async (message: Message): Promise<void> => {
		if (
			message.recipientId !== myId ||
			message.deliveryState === "READ"
		) {
			return;
		}

		await markMessageRead({ variables: { messageId: message.id } });
		await refetchMessages();
	};

	return (
		<ScreenScaffold>
			<ScrollView
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
			>
				<View style={styles.card}>
					<Text style={styles.title}>
						Conversations
					</Text>
					<FormField
						label="Start Conversation With User ID"
						value={targetUserId}
						onChangeText={setTargetUserId}
						placeholder="661f..."
					/>
					<ActionButton
						label="Create/Open Conversation"
						onPress={() =>
							void createConversation()
						}
						loading={creatingConversation}
					/>
					{actionError ? (
						<StateNotice
							mode="error"
							message={actionError}
						/>
					) : null}
					{loadingConversations ? (
						<StateNotice
							mode="loading"
							message="Loading conversations..."
						/>
					) : null}
					{conversationsError ? (
						<StateNotice
							mode="error"
							message={toUserErrorMessage(
								conversationsError,
								"Unable to load conversations.",
							)}
						/>
					) : null}
					{(conversationsData?.conversations
						?.length ?? 0) === 0 &&
					!loadingConversations ? (
						<StateNotice
							mode="empty"
							message="No conversations yet."
						/>
					) : null}
					{conversationsData?.conversations?.map(
						(conversation) => (
							<View
								key={
									conversation.id
								}
								style={
									styles.conversationCard
								}
							>
								<Text>
									ID:{" "}
									{conversation.id.slice(
										0,
										8,
									)}
								</Text>
								<Text
									style={
										styles.messageMeta
									}
								>
									Participants:{" "}
									{conversation.participantIds.join(
										", ",
									)}
								</Text>
								{conversation.lastMessageAt ? (
									<Text
										style={
											styles.messageMeta
										}
									>
										Last
										message:{" "}
										{toLocalDateTime(
											conversation.lastMessageAt,
										)}
									</Text>
								) : null}
								<ActionButton
									label={
										selectedConversationId ===
										conversation.id
											? "Selected"
											: "Open"
									}
									onPress={() =>
										setSelectedConversationId(
											conversation.id,
										)
									}
									variant={
										selectedConversationId ===
										conversation.id
											? "primary"
											: "muted"
									}
								/>
							</View>
						),
					)}
				</View>

				<View style={styles.card}>
					<Text style={styles.title}>
						Messages
					</Text>
					<FormField
						label="Message"
						value={messageBody}
						onChangeText={setMessageBody}
						placeholder="Type a message"
						autoCapitalize="sentences"
					/>
					<ActionButton
						label="Send"
						onPress={() =>
							void submitMessage()
						}
						loading={sendingMessage}
						disabled={
							!selectedConversationId
						}
					/>
					{loadingMessages ? (
						<StateNotice
							mode="loading"
							message="Loading messages..."
						/>
					) : null}
					{messagesError ? (
						<StateNotice
							mode="error"
							message={toUserErrorMessage(
								messagesError,
								"Unable to load messages.",
							)}
						/>
					) : null}
					{!selectedConversationId ? (
						<StateNotice
							mode="empty"
							message="Select a conversation first."
						/>
					) : null}
					{selectedConversationId &&
					(messagesData?.messages?.length ??
						0) === 0 &&
					!loadingMessages ? (
						<StateNotice
							mode="empty"
							message="No messages yet in this thread."
						/>
					) : null}
					{messagesData?.messages?.map(
						(message) => (
							<View
								key={message.id}
								style={
									styles.messageCard
								}
							>
								<Text
									style={
										styles.messageBody
									}
								>
									{
										message.body
									}
								</Text>
								<Text
									style={
										styles.messageMeta
									}
								>
									Sent:{" "}
									{toLocalDateTime(
										message.sentAt,
									)}
								</Text>
								<Text
									style={
										styles.messageMeta
									}
								>
									State:{" "}
									{
										message.deliveryState
									}
								</Text>
								{message.recipientId ===
									myId &&
								message.deliveryState !==
									"READ" ? (
									<ActionButton
										label="Mark Read"
										onPress={() =>
											void markRead(
												message,
											)
										}
										variant="muted"
									/>
								) : null}
							</View>
						),
					)}
				</View>
			</ScrollView>
		</ScreenScaffold>
	);
}
