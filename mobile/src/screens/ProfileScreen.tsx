import { useEffect, useMemo, useState } from "react";
import {
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import { useMutation, useQuery } from "@apollo/client";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { FormField } from "../components/FormField";
import { ActionButton } from "../components/ActionButton";
import { StateNotice } from "../components/StateNotice";
import { CityTimezonePicker } from "../components/CityTimezonePicker";
import {
	CHANGE_EMAIL_MUTATION,
	DELETE_ACCOUNT_MUTATION,
	ME_QUERY,
	REQUEST_EMAIL_VERIFICATION_MUTATION,
	UPDATE_ACCOUNT_MUTATION,
	VERIFY_EMAIL_MUTATION,
} from "../graphql/operations";
import { useTheme } from "../theme/useTheme";
import { useAuth } from "../auth/AuthProvider";
import { toUserErrorMessage } from "../utils/errors";
import { formatTimezoneNow } from "../utils/time";

const EMAIL_CHANGE_REASONS = [
	"Switching to a personal email",
	"Switching to a work email",
	"Typo in original email",
	"Old email no longer accessible",
	"Privacy or security concern",
	"Other",
] as const;

type ChangeEmailReason = (typeof EMAIL_CHANGE_REASONS)[number];

interface MeQuery {
	me: {
		id: string;
		email: string;
		username: string;
		displayName: string;
		timezone: string;
		isPublic: boolean;
		emailVerifiedAt: string | null;
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
	const [verificationCode, setVerificationCode] = useState("");
	const [verifyError, setVerifyError] = useState<string | null>(null);
	const [verifySuccess, setVerifySuccess] = useState<string | null>(null);

	const [showChangeEmail, setShowChangeEmail] = useState(false);
	const [newEmail, setNewEmail] = useState("");
	const [emailPassword, setEmailPassword] = useState("");
	const [emailReason, setEmailReason] =
		useState<ChangeEmailReason | null>(null);
	const [showReasonPicker, setShowReasonPicker] = useState(false);
	const [emailChangeError, setEmailChangeError] = useState<string | null>(
		null,
	);
	const [emailChangeSuccess, setEmailChangeSuccess] = useState<
		string | null
	>(null);

	const { data, loading, error, refetch } = useQuery<MeQuery>(ME_QUERY);
	const [updateAccount, { loading: updating }] = useMutation(
		UPDATE_ACCOUNT_MUTATION,
	);
	const [deleteAccount, { loading: deleting }] = useMutation(
		DELETE_ACCOUNT_MUTATION,
	);
	const [verifyEmail, { loading: verifyLoading }] = useMutation(
		VERIFY_EMAIL_MUTATION,
	);
	const [requestEmailVerification, { loading: resendLoading }] =
		useMutation(REQUEST_EMAIL_VERIFICATION_MUTATION);
	const [changeEmail, { loading: changingEmail }] = useMutation(
		CHANGE_EMAIL_MUTATION,
	);

	const isVerified = Boolean(data?.me?.emailVerifiedAt);

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
				sectionTitle: {
					fontSize: theme.typography.body,
					fontWeight: "700",
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
				verifiedBadge: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					color: "#16A34A",
				},
				modalOverlay: {
					flex: 1,
					backgroundColor: "rgba(0,0,0,0.6)",
					justifyContent: "flex-end",
				},
				modalContent: {
					backgroundColor: theme.colors.surface,
					borderTopLeftRadius: theme.radius.lg,
					borderTopRightRadius: theme.radius.lg,
					padding: theme.spacing.lg,
					gap: theme.spacing.sm,
					maxHeight: "60%",
				},
				modalTitle: {
					fontSize: theme.typography.body,
					fontWeight: "700",
					color: theme.colors.textPrimary,
					marginBottom: theme.spacing.sm,
				},
				reasonOption: {
					paddingVertical: theme.spacing.md,
					paddingHorizontal: theme.spacing.md,
					borderRadius: theme.radius.md,
					borderWidth: 1,
					borderColor: theme.colors.border,
					backgroundColor:
						theme.colors.surfaceElevated,
				},
				reasonOptionSelected: {
					borderColor: theme.colors.accent,
					backgroundColor: theme.colors.accent,
				},
				reasonText: {
					fontSize: theme.typography.caption,
					color: theme.colors.textPrimary,
				},
				reasonTextSelected: {
					color: theme.colors.onAccent,
					fontWeight: "700",
				},
				pickerButton: {
					paddingVertical: theme.spacing.sm,
					paddingHorizontal: theme.spacing.md,
					borderRadius: theme.radius.md,
					borderWidth: 1,
					borderColor: theme.colors.border,
					backgroundColor:
						theme.colors.surfaceElevated,
				},
				pickerButtonText: {
					fontSize: theme.typography.caption,
					color: theme.colors.textPrimary,
				},
				pickerPlaceholder: {
					fontSize: theme.typography.caption,
					color: theme.colors.textMuted,
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
				setVerifySuccess(
					"Email verified successfully!",
				);
				setVerificationCode("");
				await refetch();
			} else {
				setVerifyError(
					response.data?.verifyEmail?.message ||
						"Unable to verify email.",
				);
			}
		} catch (verifyErr) {
			setVerifyError(
				toUserErrorMessage(
					verifyErr,
					"Verification failed.",
				),
			);
		}
	};

	const handleResendCode = async (): Promise<void> => {
		const emailToUse = data?.me?.email;
		if (!emailToUse) {
			setVerifyError(
				"Unable to determine your email address.",
			);
			return;
		}

		setVerifyError(null);
		setVerifySuccess(null);

		try {
			const response = await requestEmailVerification({
				variables: { email: emailToUse },
			});
			setVerifySuccess(
				response.data?.requestEmailVerification
					?.message ||
					"Verification code sent to your email.",
			);
		} catch (resendErr) {
			setVerifyError(
				toUserErrorMessage(
					resendErr,
					"Unable to resend code.",
				),
			);
		}
	};

	const handleChangeEmail = async (): Promise<void> => {
		if (!newEmail.trim()) {
			setEmailChangeError("New email is required.");
			return;
		}

		if (!emailPassword.trim()) {
			setEmailChangeError(
				"Password is required to confirm this change.",
			);
			return;
		}

		if (!emailReason) {
			setEmailChangeError(
				"Please select a reason for changing your email.",
			);
			return;
		}

		setEmailChangeError(null);
		setEmailChangeSuccess(null);

		try {
			const response = await changeEmail({
				variables: {
					input: {
						newEmail: newEmail.trim(),
						password: emailPassword,
						reason: emailReason,
					},
				},
			});

			if (response.data?.changeEmail?.success) {
				setEmailChangeSuccess(
					response.data.changeEmail.message ||
						"Email updated. Check your new email for a verification code.",
				);
				setNewEmail("");
				setEmailPassword("");
				setEmailReason(null);
				setShowChangeEmail(false);
				await refetch();
			} else {
				setEmailChangeError(
					response.data?.changeEmail?.message ||
						"Unable to change email.",
				);
			}
		} catch (changeErr) {
			setEmailChangeError(
				toUserErrorMessage(
					changeErr,
					"Email change failed.",
				),
			);
		}
	};

	const resetChangeEmailForm = (): void => {
		setShowChangeEmail(false);
		setNewEmail("");
		setEmailPassword("");
		setEmailReason(null);
		setEmailChangeError(null);
		setEmailChangeSuccess(null);
	};

	return (
		<ScreenScaffold>
			<ScrollView
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
			>
				{!isVerified && data?.me ? (
					<View style={styles.verifyCard}>
						<Text style={styles.title}>
							Verify Your Email
						</Text>
						<Text style={styles.helpText}>
							A verification code was
							sent to {data.me.email}.
							Enter it below to unlock
							friend features.
						</Text>
						<FormField
							label="Verification Code"
							value={verificationCode}
							onChangeText={(
								text,
							) => {
								setVerifyError(
									null,
								);
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
				) : null}

				<View style={styles.content}>
					<View style={styles.card}>
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
						<FormField
							label="Username"
							value={username}
							onChangeText={
								setUsername
							}
							autoCapitalize="none"
						/>
						<FormField
							label="Display Name"
							value={displayName}
							onChangeText={
								setDisplayName
							}
							autoCapitalize="words"
						/>
						<CityTimezonePicker
							label="Timezone"
							value={timezone}
							onChangeValue={
								setTimezone
							}
							placeholder="Search city"
						/>
						<Text style={styles.helpText}>
							Current local time in
							this zone:{" "}
							{formatTimezoneNow(
								timezone ||
									"UTC",
							)}
						</Text>

						<View style={styles.row}>
							<Text
								style={
									styles.label
								}
							>
								Public profile
							</Text>
							<Switch
								value={isPublic}
								onValueChange={
									setIsPublic
								}
							/>
						</View>
						{data?.me ? (
							<>
								<View
									style={
										styles.row
									}
								>
									<Text
										style={
											styles.meta
										}
									>
										Email:{" "}
										{
											data
												.me
												.email
										}
									</Text>
									<Pressable
										onPress={() => {
											resetChangeEmailForm();
											setShowChangeEmail(
												!showChangeEmail,
											);
										}}
									>
										<Text
											style={{
												fontSize: theme
													.typography
													.tiny,
												fontWeight: "700",
												color: theme
													.colors
													.accent,
											}}
										>
											Change
										</Text>
									</Pressable>
								</View>
								{isVerified ? (
									<Text
										style={
											styles.verifiedBadge
										}
									>
										✓
										Email
										verified
									</Text>
								) : (
									<Text
										style={
											styles.helpText
										}
									>
										⚠
										Email
										not
										verified
									</Text>
								)}
							</>
						) : null}

						{emailChangeSuccess ? (
							<StateNotice
								mode="empty"
								message={
									emailChangeSuccess
								}
							/>
						) : null}

						{showChangeEmail ? (
							<View
								style={
									styles.card
								}
							>
								<Text
									style={
										styles.sectionTitle
									}
								>
									Change
									Email
								</Text>
								<Text
									style={
										styles.helpText
									}
								>
									Changing
									your
									email
									will
									require
									re-verification.
								</Text>
								<FormField
									label="New Email"
									value={
										newEmail
									}
									onChangeText={(
										text,
									) => {
										setEmailChangeError(
											null,
										);
										setNewEmail(
											text,
										);
									}}
									placeholder="name@example.com"
									keyboardType="email-address"
									autoCapitalize="none"
								/>
								<FormField
									label="Current Password"
									value={
										emailPassword
									}
									onChangeText={(
										text,
									) => {
										setEmailChangeError(
											null,
										);
										setEmailPassword(
											text,
										);
									}}
									secureTextEntry
									placeholder="••••••••"
									autoCapitalize="none"
								/>
								<Text
									style={
										styles.label
									}
								>
									Reason
									for
									change
								</Text>
								<Pressable
									style={
										styles.pickerButton
									}
									onPress={() =>
										setShowReasonPicker(
											true,
										)
									}
								>
									{emailReason ? (
										<Text
											style={
												styles.pickerButtonText
											}
										>
											{
												emailReason
											}
										</Text>
									) : (
										<Text
											style={
												styles.pickerPlaceholder
											}
										>
											Select
											a
											reason…
										</Text>
									)}
								</Pressable>
								{emailChangeError ? (
									<StateNotice
										mode="error"
										message={
											emailChangeError
										}
									/>
								) : null}
								<View
									style={
										styles.buttonRow
									}
								>
									<ActionButton
										label="Confirm Change"
										onPress={() =>
											void handleChangeEmail()
										}
										loading={
											changingEmail
										}
									/>
									<ActionButton
										label="Cancel"
										onPress={
											resetChangeEmailForm
										}
										variant="muted"
									/>
								</View>
							</View>
						) : null}
						{actionError ? (
							<StateNotice
								mode="error"
								message={
									actionError
								}
							/>
						) : null}
						<View style={styles.buttonRow}>
							<ActionButton
								label="Save Changes"
								onPress={() =>
									void saveProfile()
								}
								loading={
									updating
								}
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
								loading={
									deleting
								}
								variant="danger"
							/>
						</View>
					</View>
				</View>
			</ScrollView>

			<Modal
				visible={showReasonPicker}
				transparent
				animationType="slide"
				onRequestClose={() =>
					setShowReasonPicker(false)
				}
			>
				<Pressable
					style={styles.modalOverlay}
					onPress={() =>
						setShowReasonPicker(false)
					}
				>
					<Pressable
						style={styles.modalContent}
						onPress={() => {}}
					>
						<Text style={styles.modalTitle}>
							Why are you changing
							your email?
						</Text>
						<ScrollView>
							{EMAIL_CHANGE_REASONS.map(
								(reason) => {
									const selected =
										emailReason ===
										reason;
									return (
										<Pressable
											key={
												reason
											}
											style={[
												styles.reasonOption,
												selected
													? styles.reasonOptionSelected
													: undefined,
											]}
											onPress={() => {
												setEmailReason(
													reason,
												);
												setEmailChangeError(
													null,
												);
												setShowReasonPicker(
													false,
												);
											}}
										>
											<Text
												style={[
													styles.reasonText,
													selected
														? styles.reasonTextSelected
														: undefined,
												]}
											>
												{
													reason
												}
											</Text>
										</Pressable>
									);
								},
							)}
						</ScrollView>
					</Pressable>
				</Pressable>
			</Modal>
		</ScreenScaffold>
	);
}
