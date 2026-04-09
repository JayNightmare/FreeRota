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
	SEND_FRIEND_REQUEST_MUTATION,
	UNBLOCK_USER_MUTATION,
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
		username: string;
	};
}

export function FriendsScreen() {
	const { theme } = useTheme();
	const [targetUsername, setTargetUsername] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const { data: meData } = useQuery<MeQuery>(ME_QUERY);
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

	return (
		<ScreenScaffold>
			<ScrollView
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
			>
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
			</ScrollView>
		</ScreenScaffold>
	);
}
