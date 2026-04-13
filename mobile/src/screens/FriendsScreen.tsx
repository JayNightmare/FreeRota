import { useMemo, useState } from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useMutation, useQuery } from "@apollo/client";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { FormField } from "../components/FormField";
import { ActionButton } from "../components/ActionButton";
import { StateNotice } from "../components/StateNotice";
import {
	ACCEPT_FRIEND_REQUEST_MUTATION,
	BLOCK_USER_MUTATION,
	CREATE_CONVERSATION_MUTATION,
	FRIENDSHIPS_QUERY,
	MARK_MESSAGE_READ_MUTATION,
	ME_QUERY,
	MESSAGES_QUERY,
	REJECT_FRIEND_REQUEST_MUTATION,
	REMOVE_FRIEND_MUTATION,
	REQUEST_EMAIL_VERIFICATION_MUTATION,
	SEND_FRIEND_REQUEST_MUTATION,
	SEND_MESSAGE_MUTATION,
	UNBLOCK_USER_MUTATION,
	VERIFY_EMAIL_MUTATION,
} from "../graphql/operations";
import { useTheme } from "../theme/useTheme";
import { toLocalDateTime } from "../utils/time";
import { toUserErrorMessage } from "../utils/errors";

interface Friendship {
	id: string;
	requesterId: string;
	addresseeId: string;
	requesterUsername: string;
	addresseeUsername: string;
	status: "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";
	createdAt: string;
	updatedAt: string;
}

interface FriendshipsQuery {
	friendships: Friendship[];
}

interface MeQuery {
	me: {
		id: string;
		email: string;
		username: string;
		emailVerifiedAt: string | null;
	};
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

interface MessagesQuery {
	messages: Message[];
}

interface ChatTarget {
	userId: string;
	username: string;
}

/**
 * Combined Friends + Messaging screen.
 *
 * Default view: friend list with request management.
 * Tapping an accepted friend transitions to a 1-on-1 chat sub-view.
 */
export function FriendsScreen() {
	const { theme } = useTheme();

	const [targetUsername, setTargetUsername] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [verificationCode, setVerificationCode] = useState("");
	const [verifyError, setVerifyError] = useState<string | null>(null);
	const [verifySuccess, setVerifySuccess] = useState<string | null>(null);

	const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);
	const [messageBody, setMessageBody] = useState("");
	const [chatError, setChatError] = useState<string | null>(null);
	const [conversationId, setConversationId] = useState<string | null>(null);

	const { data: meData, refetch: refetchMe } =
		useQuery<MeQuery>(ME_QUERY);
	const { data, loading, error, refetch } = useQuery<FriendshipsQuery>(
		FRIENDSHIPS_QUERY,
		{ variables: { status: null } },
	);

	const [sendFriendRequest, { loading: requestLoading }] = useMutation(
		SEND_FRIEND_REQUEST_MUTATION,
	);
	const [acceptFriendRequest] = useMutation(
		ACCEPT_FRIEND_REQUEST_MUTATION,
	);
	const [rejectFriendRequest] = useMutation(
		REJECT_FRIEND_REQUEST_MUTATION,
	);
	const [removeFriend] = useMutation(REMOVE_FRIEND_MUTATION);
	const [blockUser] = useMutation(BLOCK_USER_MUTATION);
	const [unblockUser] = useMutation(UNBLOCK_USER_MUTATION);
	const [verifyEmail, { loading: verifyLoading }] = useMutation(
		VERIFY_EMAIL_MUTATION,
	);
	const [requestEmailVerification, { loading: resendLoading }] =
		useMutation(REQUEST_EMAIL_VERIFICATION_MUTATION);

	const [createConversationWith, { loading: creatingConversation }] =
		useMutation(CREATE_CONVERSATION_MUTATION);
	const [sendMessage, { loading: sendingMessage }] = useMutation(
		SEND_MESSAGE_MUTATION,
	);
	const [markMessageRead] = useMutation(MARK_MESSAGE_READ_MUTATION);

	const {
		data: messagesData,
		loading: loadingMessages,
		error: messagesError,
		refetch: refetchMessages,
	} = useQuery<MessagesQuery>(MESSAGES_QUERY, {
		variables: {
			conversationId,
			limit: 50,
			cursor: null,
		},
		skip: !conversationId,
		pollInterval: conversationId ? 4000 : 0,
	});

	const isVerified = Boolean(meData?.me?.emailVerifiedAt);
	const myId = meData?.me?.id;
	const myUsername = meData?.me?.username;

	const getFriendUsername = (friendship: Friendship): string => {
		if (!myId) return friendship.requesterUsername;
		return friendship.requesterId === myId
			? friendship.addresseeUsername
			: friendship.requesterUsername;
	};

	const getFriendUserId = (friendship: Friendship): string => {
		if (!myId) return friendship.requesterId;
		return friendship.requesterId === myId
			? friendship.addresseeId
			: friendship.requesterId;
	};

	const withRefresh = async (
		fn: () => Promise<unknown>,
	): Promise<void> => {
		setErrorMessage(null);
		try {
			await fn();
			await refetch();
		} catch (mutationError) {
			setErrorMessage(
				toUserErrorMessage(mutationError, "Action failed."),
			);
		}
	};

	const sendRequest = async (): Promise<void> => {
		if (!targetUsername.trim()) {
			setErrorMessage("Enter a username to send request.");
			return;
		}

		await withRefresh(async () => {
			await sendFriendRequest({
				variables: {
					username: targetUsername.trim().toLowerCase(),
				},
			});
			setTargetUsername("");
		});
	};

	const handleVerifyEmail = async (): Promise<void> => {
		const code = verificationCode.trim().toUpperCase();
		if (code.length !== 6) {
			setVerifyError("Code must be exactly 6 characters.");
			return;
		}

		setVerifyError(null);
		setVerifySuccess(null);

		try {
			const response = await verifyEmail({
				variables: { code },
			});

			if (response.data?.verifyEmail?.success) {
				setVerifySuccess("Email verified successfully!");
				setVerificationCode("");
				await refetchMe();
			} else {
				setVerifyError(
					response.data?.verifyEmail?.message ||
						"Unable to verify email.",
				);
			}
		} catch (verifyErr) {
			setVerifyError(
				toUserErrorMessage(verifyErr, "Verification failed."),
			);
		}
	};

	const handleResendCode = async (): Promise<void> => {
		const emailToUse = meData?.me?.email;
		if (!emailToUse) {
			setVerifyError("Unable to determine your email address.");
			return;
		}

		setVerifyError(null);
		setVerifySuccess(null);

		try {
			const response = await requestEmailVerification({
				variables: { email: emailToUse },
			});
			setVerifySuccess(
				response.data?.requestEmailVerification?.message ||
					"Verification code sent to your email.",
			);
		} catch (resendErr) {
			setVerifyError(
				toUserErrorMessage(resendErr, "Unable to resend code."),
			);
		}
	};

	const openChat = async (
		userId: string,
		username: string,
	): Promise<void> => {
		setChatTarget({ userId, username });
		setChatError(null);
		setMessageBody("");

		try {
			const response = await createConversationWith({
				variables: { targetUserId: userId },
			});
			const id: string | undefined =
				response.data?.createConversationWith?.id;
			if (id) {
				setConversationId(id);
			}
		} catch (mutationError) {
			setChatError(
				toUserErrorMessage(
					mutationError,
					"Failed to open conversation.",
				),
			);
		}
	};

	const closeChat = (): void => {
		setChatTarget(null);
		setConversationId(null);
		setMessageBody("");
		setChatError(null);
	};

	const submitMessage = async (): Promise<void> => {
		if (!chatTarget || !messageBody.trim()) {
			setChatError("Type a message.");
			return;
		}

		setChatError(null);
		try {
			await sendMessage({
				variables: {
					recipientId: chatTarget.userId,
					body: messageBody.trim(),
				},
			});
			setMessageBody("");
			await refetchMessages();
		} catch (mutationError) {
			setChatError(
				toUserErrorMessage(mutationError, "Failed to send message."),
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

	const styles = useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: theme.spacing.lg,
				},
				card: {
					backgroundColor: theme.colors.surface,
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.lg,
					padding: theme.spacing.lg,
					gap: theme.spacing.md,
				},
				content: {
					gap: theme.spacing.lg,
				},
				verifyCard: {
					backgroundColor: theme.colors.surface,
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.accent,
					borderRadius: theme.radius.lg,
					padding: theme.spacing.lg,
					gap: theme.spacing.md,
				},
				title: {
					fontSize: theme.typography.heading,
					fontWeight: "900",
					textTransform: "uppercase",
					letterSpacing: -1,
					color: theme.colors.textPrimary,
				},
				subtitle: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					textTransform: "uppercase",
					color: theme.colors.textMuted,
				},
				friendCard: {
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.md,
					padding: theme.spacing.md,
					gap: theme.spacing.sm,
					backgroundColor:
						theme.colors.surfaceElevated,
					...theme.shadowSm,
				},
				friendHeader: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				friendTitle: {
					fontSize: theme.typography.body,
					fontWeight: "900",
					textTransform: "uppercase",
					color: theme.colors.accent,
				},
				statusBadge: {
					fontSize: theme.typography.tiny,
					fontWeight: "900",
					textTransform: "uppercase",
					letterSpacing: 1,
					color: theme.colors.textMuted,
				},
				row: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
				chatHeader: {
					flexDirection: "row",
					alignItems: "center",
					gap: theme.spacing.md,
				},
				backButton: {
					width: 40,
					height: 40,
					borderRadius: theme.radius.md,
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					backgroundColor:
						theme.colors.surfaceElevated,
					alignItems: "center",
					justifyContent: "center",
				},
				chatTitle: {
					fontSize: theme.typography.body,
					fontWeight: "900",
					textTransform: "uppercase",
					letterSpacing: 0.5,
					color: theme.colors.accent,
				},
				messageCard: {
					borderWidth: theme.borderWidth,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.md,
					padding: theme.spacing.md,
					gap: theme.spacing.xs,
					backgroundColor:
						theme.colors.surfaceMuted,
				},
				messageCardOwn: {
					borderColor: theme.colors.accentMuted,
					backgroundColor:
						theme.colors.accentBackground,
				},
				messageBody: {
					fontSize: theme.typography.body,
					color: theme.colors.textPrimary,
				},
				messageMeta: {
					fontSize: theme.typography.tiny,
					fontWeight: "700",
					textTransform: "uppercase",
					color: theme.colors.textMuted,
				},
				composeRow: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					alignItems: "flex-end",
				},
				composeInput: {
					flex: 1,
				},
			}),
		[theme],
	);

	if (chatTarget) {
		return (
			<ScreenScaffold>
				<ScrollView
					contentContainerStyle={styles.container}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="on-drag"
				>
					<View style={styles.chatHeader}>
						<Pressable
							style={styles.backButton}
							onPress={closeChat}
						>
							<Ionicons
								name="arrow-back"
								size={20}
								color={
									theme.colors
										.textPrimary
								}
							/>
						</Pressable>
						<Text style={styles.chatTitle}>
							{chatTarget.username}
						</Text>
					</View>

					{chatError ? (
						<StateNotice
							mode="error"
							message={chatError}
						/>
					) : null}

					{creatingConversation ? (
						<StateNotice
							mode="loading"
							message="Opening conversation..."
						/>
					) : null}

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

					{conversationId &&
					!loadingMessages &&
					(messagesData?.messages?.length ?? 0) ===
						0 ? (
						<StateNotice
							mode="empty"
							message="No messages yet. Say hello!"
						/>
					) : null}

					{messagesData?.messages?.map(
						(message) => {
							const isOwn =
								message.senderId ===
								myId;
							return (
								<View
									key={
										message.id
									}
									style={[
										styles.messageCard,
										isOwn
											? styles.messageCardOwn
											: undefined,
									]}
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
										{isOwn
											? "You"
											: chatTarget.username}
										{" · "}
										{toLocalDateTime(
											message.sentAt,
										)}
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
							);
						},
					)}

					<View style={styles.card}>
						<View style={styles.composeRow}>
							<View
								style={
									styles.composeInput
								}
							>
								<FormField
									label="Message"
									value={
										messageBody
									}
									onChangeText={
										setMessageBody
									}
									placeholder="Type a message"
									autoCapitalize="sentences"
								/>
							</View>
						</View>
						<ActionButton
							label="Send"
							onPress={() =>
								void submitMessage()
							}
							loading={sendingMessage}
							disabled={
								!conversationId
							}
						/>
					</View>
				</ScrollView>
			</ScreenScaffold>
		);
	}

	return (
		<ScreenScaffold>
			<ScrollView
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
			>
				{!isVerified ? (
					<View style={styles.verifyCard}>
						<Text style={styles.title}>
							Verify Your Email
						</Text>
						<Text style={styles.subtitle}>
							Enter the 6-character code
							sent to your email to unlock
							friend features.
						</Text>
						<FormField
							label="Verification Code"
							value={verificationCode}
							onChangeText={(text) => {
								setVerifyError(null);
								setVerifySuccess(
									null,
								);
								setVerificationCode(
									text
										.toUpperCase()
										.slice(
											0,
											6,
										),
								);
							}}
							placeholder="ABC123"
							autoCapitalize="characters"
						/>
						{verifyError ? (
							<StateNotice
								mode="error"
								message={
									verifyError
								}
							/>
						) : null}
						{verifySuccess ? (
							<StateNotice
								mode="empty"
								message={
									verifySuccess
								}
							/>
						) : null}
						<ActionButton
							label="Verify Email"
							onPress={() =>
								void handleVerifyEmail()
							}
							loading={verifyLoading}
						/>
						<ActionButton
							label="Resend Code"
							onPress={() =>
								void handleResendCode()
							}
							variant="muted"
							loading={resendLoading}
						/>
					</View>
				) : (
					<>
						<View style={styles.content}>
							<View
								style={
									styles.card
								}
							>
								<FormField
									label="Add Friend"
									value={
										targetUsername
									}
									onChangeText={
										setTargetUsername
									}
									placeholder="jane_doe"
									autoCapitalize="none"
								/>
								<ActionButton
									label="Send Request"
									onPress={() =>
										void sendRequest()
									}
									loading={
										requestLoading
									}
								/>
								{myUsername ? (
									<Text
										style={
											styles.subtitle
										}
									>
										Your
										username:{" "}
										{
											myUsername
										}
									</Text>
								) : null}
								{errorMessage ? (
									<StateNotice
										mode="error"
										message={
											errorMessage
										}
									/>
								) : null}
							</View>

							<View
								style={
									styles.card
								}
							>
								{loading ? (
									<StateNotice
										mode="loading"
										message="Loading friends..."
									/>
								) : null}
								{error ? (
									<StateNotice
										mode="error"
										message={toUserErrorMessage(
											error,
											"Unable to load friends.",
										)}
									/>
								) : null}
								{!loading &&
								!error &&
								(data?.friendships
									?.length ??
									0) ===
									0 ? (
									<StateNotice
										mode="empty"
										message="No friends yet."
									/>
								) : null}

								{data?.friendships?.map(
									(
										friendship,
									) => {
										const friendUsername =
											getFriendUsername(
												friendship,
											);
										const friendUserId =
											getFriendUserId(
												friendship,
											);
										const isIncomingPending =
											friendship.status ===
												"PENDING" &&
											friendship.addresseeId ===
												myId;

										return (
											<Pressable
												key={
													friendship.id
												}
												style={
													styles.friendCard
												}
												onPress={
													friendship.status ===
													"ACCEPTED"
														? () =>
																void openChat(
																	friendUserId,
																	friendUsername,
																)
														: undefined
												}
											>
												<View
													style={
														styles.friendHeader
													}
												>
													<Text
														style={
															styles.friendTitle
														}
													>
														{
															friendUsername
														}
													</Text>
													<Text
														style={
															styles.statusBadge
														}
													>
														{
															friendship.status
														}
													</Text>
												</View>

												<View
													style={
														styles.row
													}
												>
													{isIncomingPending ? (
														<>
															<ActionButton
																label="Accept"
																onPress={() =>
																	void withRefresh(
																		() =>
																			acceptFriendRequest(
																				{
																					variables:
																						{
																							friendshipId:
																								friendship.id,
																						},
																				},
																			),
																	)
																}
															/>
															<ActionButton
																label="Reject"
																variant="muted"
																onPress={() =>
																	void withRefresh(
																		() =>
																			rejectFriendRequest(
																				{
																					variables:
																						{
																							friendshipId:
																								friendship.id,
																						},
																				},
																			),
																	)
																}
															/>
														</>
													) : null}

													{friendship.status ===
													"ACCEPTED" ? (
														<>
															<ActionButton
																label="Chat"
																onPress={() =>
																	void openChat(
																		friendUserId,
																		friendUsername,
																	)
																}
															/>
															<ActionButton
																label="Remove"
																variant="muted"
																onPress={() =>
																	void withRefresh(
																		() =>
																			removeFriend(
																				{
																					variables:
																						{
																							friendId:
																								friendUserId,
																						},
																				},
																			),
																	)
																}
															/>
															<ActionButton
																label="Block"
																variant="danger"
																onPress={() =>
																	void withRefresh(
																		() =>
																			blockUser(
																				{
																					variables:
																						{
																							targetUserId:
																								friendUserId,
																						},
																				},
																			),
																	)
																}
															/>
														</>
													) : null}

													{friendship.status ===
													"BLOCKED" ? (
														<ActionButton
															label="Unblock"
															variant="muted"
															onPress={() =>
																void withRefresh(
																	() =>
																		unblockUser(
																			{
																				variables:
																					{
																						targetUserId:
																							friendUserId,
																					},
																			},
																		),
																)
															}
														/>
													) : null}

													{friendship.status ===
														"PENDING" &&
													!isIncomingPending ? (
														<ActionButton
															label="Block"
															variant="danger"
															onPress={() =>
																void withRefresh(
																	() =>
																		blockUser(
																			{
																				variables:
																					{
																						targetUserId:
																							friendUserId,
																					},
																			},
																		),
																)
															}
														/>
													) : null}
												</View>
											</Pressable>
										);
									},
								)}
							</View>
						</View>
					</>
				)}
			</ScrollView>
		</ScreenScaffold>
	);
}
