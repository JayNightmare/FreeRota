import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLazyQuery, useQuery } from "@apollo/client";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { FormField } from "../components/FormField";
import { ActionButton } from "../components/ActionButton";
import { StateNotice } from "../components/StateNotice";
import { WeekRangePicker } from "../components/WeekRangePicker";
import {
	FIND_COMMON_FREE_TIME_QUERY,
	FRIENDSHIPS_QUERY,
	ME_QUERY,
} from "../graphql/operations";
import { useTheme } from "../theme/useTheme";
import { addDaysIso, formatDateTime, nowIso } from "../utils/time";
import { toUserErrorMessage } from "../utils/errors";

interface Friendship {
	id: string;
	requesterId: string;
	addresseeId: string;
	status: "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";
}

interface FriendshipsQuery {
	friendships: Friendship[];
}

interface MeQuery {
	me: {
		id: string;
		timezone: string;
	};
}

interface FreeWindow {
	startUtc: string;
	endUtc: string;
	durationMinutes: number;
}

interface FreeTimeQuery {
	findCommonFreeTime: FreeWindow[];
}

export function FreeTimeScreen() {
	const { theme } = useTheme();
	const [rangeStartUtc, setRangeStartUtc] = useState(nowIso());
	const [rangeEndUtc, setRangeEndUtc] = useState(addDaysIso(7));
	const [minDurationMinutes, setMinDurationMinutes] = useState("60");
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	const { data: meData } = useQuery<MeQuery>(ME_QUERY);
	const { data: friendshipsData } = useQuery<FriendshipsQuery>(
		FRIENDSHIPS_QUERY,
		{
			variables: { status: "ACCEPTED" },
		},
	);

	const [runSearch, { data, loading, error }] =
		useLazyQuery<FreeTimeQuery>(FIND_COMMON_FREE_TIME_QUERY);

	const styles = useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: theme.spacing.lg,
				},
				content: {
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
				friendRow: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
				windowCard: {
					borderWidth: 1,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.md,
					padding: theme.spacing.md,
					gap: theme.spacing.xs,
					backgroundColor:
						theme.colors.surfaceElevated,
				},
				windowTitle: {
					fontSize: theme.typography.body,
					fontWeight: "700",
					color: theme.colors.textPrimary,
				},
				windowMeta: {
					fontSize: theme.typography.caption,
					color: theme.colors.textSecondary,
				},
			}),
		[theme],
	);

	const myId = meData?.me?.id;

	const acceptedFriendIds = useMemo(() => {
		if (!myId) {
			return [] as string[];
		}

		return (friendshipsData?.friendships ?? []).map((friendship) =>
			friendship.requesterId === myId
				? friendship.addresseeId
				: friendship.requesterId,
		);
	}, [friendshipsData?.friendships, myId]);

	const toggleFriend = (friendId: string): void => {
		setSelectedIds((current) =>
			current.includes(friendId)
				? current.filter((item) => item !== friendId)
				: [...current, friendId],
		);
	};

	const search = async (): Promise<void> => {
		const duration = Number(minDurationMinutes);
		if (!Number.isFinite(duration) || duration <= 0) {
			return;
		}

		if (selectedIds.length === 0) {
			return;
		}

		await runSearch({
			variables: {
				userIds: selectedIds,
				rangeStartUtc,
				rangeEndUtc,
				minDurationMinutes: duration,
			},
		});
	};

	return (
		<ScreenScaffold>
			<ScrollView
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
			>
				<View style={styles.content}>
					<View style={styles.card}>
						<WeekRangePicker
							rangeStartUtc={
								rangeStartUtc
							}
							rangeEndUtc={
								rangeEndUtc
							}
							onChangeRange={({
								rangeStartUtc:
									nextStart,
								rangeEndUtc:
									nextEnd,
							}) => {
								setRangeStartUtc(
									nextStart,
								);
								setRangeEndUtc(
									nextEnd,
								);
							}}
							timezone={
								meData?.me
									?.timezone ||
								"UTC"
							}
						/>
						<FormField
							label="Minimum Duration (minutes)"
							value={
								minDurationMinutes
							}
							onChangeText={
								setMinDurationMinutes
							}
							keyboardType="number-pad"
						/>
						<Text style={styles.windowMeta}>
							Select accepted friends:
						</Text>
						<View style={styles.friendRow}>
							{acceptedFriendIds.map(
								(friendId) => (
									<ActionButton
										key={
											friendId
										}
										label={friendId.slice(
											0,
											8,
										)}
										onPress={() =>
											toggleFriend(
												friendId,
											)
										}
										variant={
											selectedIds.includes(
												friendId,
											)
												? "primary"
												: "muted"
										}
									/>
								),
							)}
						</View>
						{acceptedFriendIds.length ===
						0 ? (
							<StateNotice
								mode="empty"
								message="No accepted friends available yet."
							/>
						) : null}
						<ActionButton
							label="Find Overlap"
							onPress={() =>
								void search()
							}
							loading={loading}
						/>
					</View>

					<View style={styles.card}>
						<Text style={styles.title}>
							Available Windows
						</Text>
						{error ? (
							<StateNotice
								mode="error"
								message={toUserErrorMessage(
									error,
									"Unable to search free-time overlap.",
								)}
							/>
						) : null}
						{!loading &&
						(data?.findCommonFreeTime
							?.length ?? 0) === 0 ? (
							<StateNotice
								mode="empty"
								message="Run a search to see matching windows."
							/>
						) : null}
						{data?.findCommonFreeTime?.map(
							(window, index) => (
								<View
									key={`${window.startUtc}-${index}`}
									style={
										styles.windowCard
									}
								>
									<Text
										style={
											styles.windowTitle
										}
									>
										{formatDateTime(
											window.startUtc,
											meData
												?.me
												?.timezone ||
												"UTC",
										)}{" "}
										-{" "}
										{formatDateTime(
											window.endUtc,
											meData
												?.me
												?.timezone ||
												"UTC",
										)}
									</Text>
									<Text
										style={
											styles.windowMeta
										}
									>
										Duration:{" "}
										{
											window.durationMinutes
										}{" "}
										minutes
									</Text>
								</View>
							),
						)}
					</View>
				</View>
			</ScrollView>
		</ScreenScaffold>
	);
}
