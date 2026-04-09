import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useMutation, useQuery } from "@apollo/client";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { FormField } from "../components/FormField";
import { ActionButton } from "../components/ActionButton";
import { StateNotice } from "../components/StateNotice";
import { CityTimezonePicker } from "../components/CityTimezonePicker";
import {
	DELETE_ACCOUNT_MUTATION,
	ME_QUERY,
	UPDATE_ACCOUNT_MUTATION,
} from "../graphql/operations";
import { useTheme } from "../theme/useTheme";
import { useAuth } from "../auth/AuthProvider";
import { toUserErrorMessage } from "../utils/errors";
import { formatTimezoneNow } from "../utils/time";

interface MeQuery {
	me: {
		id: string;
		email: string;
		username: string;
		displayName: string;
		timezone: string;
		isPublic: boolean;
	};
}

export function ProfileScreen() {
	const { theme } = useTheme();
	const { signOut } = useAuth();
	const [username, setUsername] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [timezone, setTimezone] = useState("UTC");
	const [isPublic, setIsPublic] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	const { data, loading, error, refetch } = useQuery<MeQuery>(ME_QUERY);
	const [updateAccount, { loading: updating }] = useMutation(
		UPDATE_ACCOUNT_MUTATION,
	);
	const [deleteAccount, { loading: deleting }] = useMutation(
		DELETE_ACCOUNT_MUTATION,
	);

	useEffect(() => {
		if (!data?.me) {
			return;
		}

		setDisplayName(data.me.displayName);
		setUsername(data.me.username);
		setTimezone(data.me.timezone);
		setIsPublic(data.me.isPublic);
	}, [data?.me]);

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
				meta: {
					fontSize: theme.typography.caption,
					color: theme.colors.textSecondary,
				},
				helpText: {
					fontSize: theme.typography.tiny,
					color: theme.colors.textMuted,
				},
				row: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				label: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					color: theme.colors.textSecondary,
				},
				buttonRow: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
			}),
		[theme],
	);

	const saveProfile = async (): Promise<void> => {
		setActionError(null);
		try {
			await updateAccount({
				variables: {
					input: {
						username: username
							.trim()
							.toLowerCase(),
						displayName: displayName.trim(),
						timezone:
							timezone.trim() ||
							"UTC",
						isPublic,
					},
				},
			});
			await refetch();
		} catch (mutationError) {
			setActionError(
				toUserErrorMessage(
					mutationError,
					"Unable to update profile.",
				),
			);
		}
	};

	const removeAccount = async (): Promise<void> => {
		setActionError(null);
		try {
			await deleteAccount();
			await signOut();
		} catch (mutationError) {
			setActionError(
				toUserErrorMessage(
					mutationError,
					"Unable to delete account.",
				),
			);
		}
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
						Profile
					</Text>
					{loading ? (
						<StateNotice
							mode="loading"
							message="Loading profile..."
						/>
					) : null}
					{error ? (
						<StateNotice
							mode="error"
							message={toUserErrorMessage(
								error,
								"Unable to load profile.",
							)}
						/>
					) : null}
					{data?.me ? (
						<Text style={styles.meta}>
							Email: {data.me.email}
						</Text>
					) : null}
					<FormField
						label="Username"
						value={username}
						onChangeText={setUsername}
						autoCapitalize="none"
					/>
					<FormField
						label="Display Name"
						value={displayName}
						onChangeText={setDisplayName}
						autoCapitalize="words"
					/>
					<CityTimezonePicker
						label="Timezone"
						value={timezone}
						onChangeValue={setTimezone}
						placeholder="Search city"
					/>
					<Text style={styles.helpText}>
						Current local time in this zone:{" "}
						{formatTimezoneNow(
							timezone || "UTC",
						)}
					</Text>
					<View style={styles.row}>
						<Text style={styles.label}>
							Public profile
						</Text>
						<Switch
							value={isPublic}
							onValueChange={
								setIsPublic
							}
						/>
					</View>
					{actionError ? (
						<StateNotice
							mode="error"
							message={actionError}
						/>
					) : null}
					<View style={styles.buttonRow}>
						<ActionButton
							label="Save Changes"
							onPress={() =>
								void saveProfile()
							}
							loading={updating}
						/>
						<ActionButton
							label="Sign Out"
							onPress={() =>
								void signOut()
							}
							variant="muted"
						/>
						<ActionButton
							label="Delete Account"
							onPress={() =>
								void removeAccount()
							}
							loading={deleting}
							variant="danger"
						/>
					</View>
				</View>
			</ScrollView>
		</ScreenScaffold>
	);
}
