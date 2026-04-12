import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery } from "@apollo/client";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { FormField } from "../components/FormField";
import { ActionButton } from "../components/ActionButton";
import { StateNotice } from "../components/StateNotice";
import {
	ACCEPT_FRIEND_REQUEST_MUTATION,
	BLOCK_USER_MUTATION,
	FRIENDSHIPS_QUERY,
	ME_QUERY,
	REJECT_FRIEND_REQUEST_MUTATION,
	REMOVE_FRIEND_MUTATION,
	REQUEST_EMAIL_VERIFICATION_MUTATION,
	SEND_FRIEND_REQUEST_MUTATION,
	UNBLOCK_USER_MUTATION,
	VERIFY_EMAIL_MUTATION,
} from "../graphql/operations";
import { useTheme } from "../theme/useTheme";
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

export function FriendsScreen() {
	const { theme } = useTheme();
	const [targetUsername, setTargetUsername] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [verificationCode, setVerificationCode] = useState("");
	const [verifyError, setVerifyError] = useState<string | null>(null);
	const [verifySuccess, setVerifySuccess] = useState<string | null>(null);

	const { data: meData, refetch: refetchMe } = useQuery<MeQuery>(ME_QUERY);
	const { data, loading, error, refetch } = useQuery<FriendshipsQuery>(
		FRIENDSHIPS_QUERY,
		{
			variables: { status: null },
		},
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
	const [verifyEmail, { loading: verifyLoading }] = useMutation(VERIFY_EMAIL_MUTATION);
	const [requestEmailVerification, { loading: resendLoading }] = useMutation(
		REQUEST_EMAIL_VERIFICATION_MUTATION,
	);

	const isVerified = Boolean(meData?.me?.emailVerifiedAt);

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
				verifyCard: {
					backgroundColor: theme.colors.surface,
					borderWidth: 2,
					borderColor: theme.colors.accent,
					borderRadius: theme.radius.lg,
					padding: theme.spacing.lg,
					gap: theme.spacing.md,
				},
				title: {
					fontSize: theme.typography.heading,
					fontWeight: "800",
					color: theme.colors.textPrimary,
				},
				subtitle: {
					fontSize: theme.typography.caption,
					color: theme.colors.textMuted,
				},
				friendCard: {
					borderWidth: 1,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.md,
					padding: theme.spacing.md,
					gap: theme.spacing.sm,
					backgroundColor: theme.colors.surfaceElevated,
				},
				friendTitle: {
					fontSize: theme.typography.body,
					fontWeight: "700",
					color: theme.colors.textPrimary,
				},
				row: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
			}),
		[theme],
	);

	const myId = meData?.me?.id;
	const myUsername = meData?.me?.username;

	const getFriendUsername = (friendship: Friendship): string => {
		if (!myId) {
			return friendship.requesterUsername;
		}

		return friendship.requesterId === myId
			? friendship.addresseeUsername
			: friendship.requesterUsername;
	};

	const getFriendUserId = (friendship: Friendship): string => {
		if (!myId) {
			return friendship.requesterId;
		}

		return friendship.requesterId === myId
			? friendship.addresseeId
			: friendship.requesterId;
	};

	const withRefresh = async (fn: () => Promise<unknown>): Promise<void> => {
		setErrorMessage(null);
		try {
			await fn();
			await refetch();
		} catch (mutationError) {
			setErrorMessage(toUserErrorMessage(mutationError, "Action failed."));
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
					response.data?.verifyEmail?.message || "Unable to verify email.",
				);
			}
		} catch (verifyErr) {
			setVerifyError(toUserErrorMessage(verifyErr, "Verification failed."));
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
			setVerifyError(toUserErrorMessage(resendErr, "Unable to resend code."));
		}
	};

	return (
		<ScreenScaffold>
			<ScrollView
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
			>
				{!isVerified ? (
					<View style={styles.verifyCard}>
						<Text style={styles.title}>Verify Your Email</Text>
						<Text style={styles.subtitle}>
							Enter the 6-character code sent to your email to unlock friend
							features.
						</Text>
						<FormField
							label="Verification Code"
							value={verificationCode}
							onChangeText={(text) => {
								setVerifyError(null);
								setVerifySuccess(null);
								setVerificationCode(text.toUpperCase().slice(0, 6));
							}}
							placeholder="ABC123"
							autoCapitalize="characters"
						/>
						{verifyError ? (
							<StateNotice mode="error" message={verifyError} />
						) : null}
						{verifySuccess ? (
							<StateNotice mode="empty" message={verifySuccess} />
						) : null}
						<ActionButton
							label="Verify Email"
							onPress={() => void handleVerifyEmail()}
							loading={verifyLoading}
						/>
						<ActionButton
							label="Resend Code"
							onPress={() => void handleResendCode()}
							variant="muted"
							loading={resendLoading}
						/>
					</View>
				) : (
					<>
						<View style={styles.card}>
							<Text style={styles.title}>Send Friend Request</Text>
							<Text style={styles.subtitle}>
								Send requests and manage accepted, pending, rejected, and blocked states.
							</Text>
							<FormField
								label="Target Username"
								value={targetUsername}
								onChangeText={setTargetUsername}
								placeholder="jane_doe"
								autoCapitalize="none"
							/>
							<ActionButton
								label="Send Friend Request"
								onPress={() => void sendRequest()}
								loading={requestLoading}
							/>
							{myUsername ? (
								<Text style={styles.subtitle}>Your username: {myUsername}</Text>
							) : null}
							{errorMessage ? (
								<StateNotice mode="error" message={errorMessage} />
							) : null}
						</View>

						<View style={styles.card}>
							<Text style={styles.title}>Relationships</Text>
							{loading ? (
								<StateNotice mode="loading" message="Loading friendships..." />
							) : null}
							{error ? (
								<StateNotice
									mode="error"
									message={toUserErrorMessage(error, "Unable to load friendships.")}
								/>
							) : null}
							{!loading && !error && (data?.friendships?.length ?? 0) === 0 ? (
								<StateNotice mode="empty" message="No friendships yet." />
							) : null}

							{data?.friendships?.map((friendship) => {
								const friendUsername = getFriendUsername(friendship);
								const friendUserId = getFriendUserId(friendship);
								const isIncomingPending =
									friendship.status === "PENDING" && friendship.addresseeId === myId;

								return (
									<View key={friendship.id} style={styles.friendCard}>
										<Text style={styles.friendTitle}>Friend Username: {friendUsername}</Text>
										<Text style={styles.subtitle}>Status: {friendship.status}</Text>
										<View style={styles.row}>
											{isIncomingPending ? (
												<>
													<ActionButton
														label="Accept"
														onPress={() =>
															void withRefresh(() =>
																acceptFriendRequest({
																	variables: { friendshipId: friendship.id },
																}),
															)
														}
													/>
													<ActionButton
														label="Reject"
														variant="muted"
														onPress={() =>
															void withRefresh(() =>
																rejectFriendRequest({
																	variables: { friendshipId: friendship.id },
																}),
															)
														}
													/>
												</>
											) : null}

											{friendship.status === "ACCEPTED" ? (
												<>
													<ActionButton
														label="Remove"
														variant="muted"
														onPress={() =>
															void withRefresh(() =>
																removeFriend({ variables: { friendId: friendUserId } }),
															)
														}
													/>
													<ActionButton
														label="Block"
														variant="danger"
														onPress={() =>
															void withRefresh(() =>
																blockUser({ variables: { targetUserId: friendUserId } }),
															)
														}
													/>
												</>
											) : null}

											{friendship.status === "BLOCKED" ? (
												<ActionButton
													label="Unblock"
													variant="muted"
													onPress={() =>
														void withRefresh(() =>
															unblockUser({ variables: { targetUserId: friendUserId } }),
														)
													}
												/>
											) : null}

											{friendship.status === "PENDING" && !isIncomingPending ? (
												<ActionButton
													label="Block"
													variant="danger"
													onPress={() =>
														void withRefresh(() =>
															blockUser({ variables: { targetUserId: friendUserId } }),
														)
													}
												/>
											) : null}
										</View>
									</View>
								);
							})}
						</View>
					</>
				)}
			</ScrollView>
		</ScreenScaffold>
	);
}
