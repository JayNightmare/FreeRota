import { useEffect, useMemo, useState } from "react";
import {
	Linking,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import { useMutation } from "@apollo/client";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { FormField } from "../components/FormField";
import { ActionButton } from "../components/ActionButton";
import { StateNotice } from "../components/StateNotice";
import { useTheme } from "../theme/useTheme";
import {
	LOGIN_MUTATION,
	REGISTER_MUTATION,
	REQUEST_EMAIL_VERIFICATION_MUTATION,
	VERIFY_EMAIL_MUTATION,
	REQUEST_PASSWORD_RESET_MUTATION,
	RESET_PASSWORD_MUTATION,
} from "../graphql/operations";
import { useAuth } from "../auth/AuthProvider";
import { toUserErrorMessage } from "../utils/errors";
import { CityTimezonePicker } from "../components/CityTimezonePicker";
import { getDeviceTimezone } from "../utils/time";
import { parseAuthLink } from "../utils/authLinks";

type AuthMode =
	| "login"
	| "register"
	| "verify-email"
	| "forgot-password"
	| "reset-password";

function getTitle(mode: AuthMode): string {
	switch (mode) {
		case "register":
			return "Create Account";
		case "verify-email":
			return "Verify Email";
		case "forgot-password":
			return "Forgot Password";
		case "reset-password":
			return "Set New Password";
		default:
			return "Welcome Back";
	}
}

function getSubtitle(mode: AuthMode): string {
	switch (mode) {
		case "register":
			return "Create your account and verify your email to continue.";
		case "verify-email":
			return "Use the email link to verify and sign in.";
		case "forgot-password":
			return "Enter your email or username to request a reset link.";
		case "reset-password":
			return "Choose a new password for your account.";
		default:
			return "Sign in to manage your rota and coordinate plans.";
	}
}

function getSubmitLabel(mode: AuthMode): string {
	switch (mode) {
		case "register":
			return "Create Account";
		case "verify-email":
			return "Verify Email";
		case "forgot-password":
			return "Send Reset Link";
		case "reset-password":
			return "Reset Password";
		default:
			return "Sign In";
	}
}

export function AuthScreen() {
	const { theme } = useTheme();
	const { signIn } = useAuth();
	const [mode, setMode] = useState<AuthMode>("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [username, setUsername] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [timezone, setTimezone] = useState(getDeviceTimezone());
	const [isPublic, setIsPublic] = useState(false);
	const [pendingEmail, setPendingEmail] = useState("");
	const [verificationToken, setVerificationToken] = useState("");
	const [resetIdentifier, setResetIdentifier] = useState("");
	const [resetToken, setResetToken] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [infoMessage, setInfoMessage] = useState<string | null>(null);
	const [formError, setFormError] = useState<string | null>(null);

	const [login, { loading: loginLoading }] = useMutation(LOGIN_MUTATION);
	const [register, { loading: registerLoading }] =
		useMutation(REGISTER_MUTATION);
	const [
		requestEmailVerification,
		{ loading: requestEmailVerificationLoading },
	] = useMutation(REQUEST_EMAIL_VERIFICATION_MUTATION);
	const [verifyEmail, { loading: verifyEmailLoading }] = useMutation(
		VERIFY_EMAIL_MUTATION,
	);
	const [requestPasswordReset, { loading: requestPasswordResetLoading }] =
		useMutation(REQUEST_PASSWORD_RESET_MUTATION);
	const [resetPassword, { loading: resetPasswordLoading }] = useMutation(
		RESET_PASSWORD_MUTATION,
	);

	const loading =
		loginLoading ||
		registerLoading ||
		requestEmailVerificationLoading ||
		verifyEmailLoading ||
		requestPasswordResetLoading ||
		resetPasswordLoading;

	const styles = useMemo(
		() =>
			StyleSheet.create({
				scrollContent: {
					flexGrow: 1,
					justifyContent: "center",
				},
				card: {
					backgroundColor: theme.colors.surface,
					borderWidth: 1,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.lg,
					padding: theme.spacing.xl,
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
				modeButton: {
					paddingVertical: theme.spacing.xs,
					alignItems: "center",
				},
				modeButtonLabel: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					color: theme.colors.accent,
				},
				helperText: {
					fontSize: theme.typography.tiny,
					color: theme.colors.textSecondary,
				},
				forgotButton: {
					alignSelf: "flex-end",
					paddingVertical: theme.spacing.xs,
				},
				forgotButtonLabel: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					color: theme.colors.accent,
				},
			}),
		[theme],
	);

	const resetNotices = (): void => {
		if (formError) {
			setFormError(null);
		}

		if (infoMessage) {
			setInfoMessage(null);
		}
	};

	useEffect(() => {
		const handleAuthLink = (url: string): void => {
			const parsed = parseAuthLink(url);
			if (!parsed.flow || !parsed.token) {
				return;
			}

			setFormError(null);
			if (parsed.flow === "verify-email") {
				setMode("verify-email");
				setVerificationToken(parsed.token);
				setInfoMessage(
					"Verification link detected. Tap Verify Email to continue.",
				);
				return;
			}

			setMode("reset-password");
			setResetToken(parsed.token);
			setInfoMessage(
				"Reset link detected. Choose a new password.",
			);
		};

		void Linking.getInitialURL().then((url) => {
			if (url) {
				handleAuthLink(url);
			}
		});

		const subscription = Linking.addEventListener(
			"url",
			(event) => {
				handleAuthLink(event.url);
			},
		);

		return () => {
			subscription.remove();
		};
	}, []);

	const handleSubmit = async (): Promise<void> => {
		setFormError(null);
		setInfoMessage(null);

		try {
			switch (mode) {
				case "login": {
					if (
						!username.trim() ||
						!password.trim()
					) {
						setFormError(
							"Username and password are required.",
						);
						return;
					}

					const response = await login({
						variables: {
							username: username.trim(),
							password,
						},
					});

					const token: string | undefined =
						response.data?.login?.token;
					if (!token) {
						setFormError(
							"Unable to authenticate user.",
						);
						return;
					}

					await signIn(token);
					return;
				}

				case "register": {
					if (!username.trim()) {
						setFormError(
							"Username is required for registration.",
						);
						return;
					}

					if (!password.trim()) {
						setFormError(
							"Password is required for registration.",
						);
						return;
					}

					if (!email.trim()) {
						setFormError(
							"Email is required for registration.",
						);
						return;
					}

					const response = await register({
						variables: {
							input: {
								email: email.trim(),
								username: username
									.trim()
									.toLowerCase(),
								password,
								displayName:
									displayName.trim() ||
									undefined,
								timezone:
									timezone.trim() ||
									"UTC",
								isPublic,
							},
						},
					});

					const registerResult =
						response.data?.register;
					if (!registerResult?.success) {
						setFormError(
							registerResult?.message ||
								"Unable to create account.",
						);
						return;
					}

					setPendingEmail(email.trim());
					setVerificationToken("");
					setMode("verify-email");
					setInfoMessage(
						registerResult.message ||
							"Check your email for a verification link.",
					);
					return;
				}

				case "verify-email": {
					if (!verificationToken.trim()) {
						setFormError(
							"Open the verification email link to continue.",
						);
						return;
					}

					const response = await verifyEmail({
						variables: {
							token: verificationToken.trim(),
						},
					});

					const token: string | undefined =
						response.data?.verifyEmail
							?.token;
					if (!token) {
						setFormError(
							"Unable to verify email.",
						);
						return;
					}

					await signIn(token);
					return;
				}

				case "forgot-password": {
					if (!resetIdentifier.trim()) {
						setFormError(
							"Email or username is required.",
						);
						return;
					}

					const response =
						await requestPasswordReset({
							variables: {
								identifier: resetIdentifier.trim(),
							},
						});

					setMode("login");
					setInfoMessage(
						response.data
							?.requestPasswordReset
							?.message ||
							"If an account exists, a password reset email has been sent.",
					);
					return;
				}

				case "reset-password": {
					if (!resetToken.trim()) {
						setFormError(
							"Missing reset token from email link.",
						);
						return;
					}

					if (!newPassword.trim()) {
						setFormError(
							"New password is required.",
						);
						return;
					}

					if (newPassword !== confirmPassword) {
						setFormError(
							"Passwords do not match.",
						);
						return;
					}

					const response = await resetPassword({
						variables: {
							token: resetToken.trim(),
							newPassword,
						},
					});

					if (
						!response.data?.resetPassword
							?.success
					) {
						setFormError(
							response.data
								?.resetPassword
								?.message ||
								"Unable to reset password.",
						);
						return;
					}

					setMode("login");
					setNewPassword("");
					setConfirmPassword("");
					setResetToken("");
					setPassword("");
					setInfoMessage(
						response.data?.resetPassword
							?.message ||
							"Password updated successfully. You can now sign in.",
					);
					return;
				}
			}
		} catch (error) {
			setFormError(
				toUserErrorMessage(
					error,
					"Authentication request failed.",
				),
			);
		}
	};

	const handleResendVerification = async (): Promise<void> => {
		const emailToUse = pendingEmail.trim() || email.trim();
		if (!emailToUse) {
			setFormError(
				"Email is required to resend verification.",
			);
			return;
		}

		setFormError(null);
		setInfoMessage(null);
		try {
			const response = await requestEmailVerification({
				variables: {
					email: emailToUse,
				},
			});
			setPendingEmail(emailToUse);
			setInfoMessage(
				response.data?.requestEmailVerification
					?.message ||
					"If an account exists, a verification email has been sent.",
			);
		} catch (error) {
			setFormError(
				toUserErrorMessage(
					error,
					"Unable to resend verification email.",
				),
			);
		}
	};

	const handleModeSwitch = (nextMode: AuthMode): void => {
		setMode(nextMode);
		setFormError(null);
		setInfoMessage(null);
	};

	return (
		<ScreenScaffold>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
			>
				<View style={styles.card}>
					<Text style={styles.title}>
						{getTitle(mode)}
					</Text>
					<Text style={styles.subtitle}>
						{getSubtitle(mode)}
					</Text>

					{mode === "login" ||
					mode === "register" ? (
						<>
							<FormField
								label="Username"
								value={username}
								onChangeText={(
									text,
								) => {
									resetNotices();
									setUsername(
										text,
									);
								}}
								placeholder="jane_doe"
								autoCapitalize="none"
							/>

							<FormField
								label="Password"
								value={password}
								onChangeText={(
									text,
								) => {
									resetNotices();
									setPassword(
										text,
									);
								}}
								secureTextEntry
								placeholder="••••••••"
								autoCapitalize="none"
							/>

							{mode === "login" ? (
								<Pressable
									style={
										styles.forgotButton
									}
									onPress={() =>
										handleModeSwitch(
											"forgot-password",
										)
									}
								>
									<Text
										style={
											styles.forgotButtonLabel
										}
									>
										Forgot
										password?
									</Text>
								</Pressable>
							) : null}
						</>
					) : null}

					{mode === "register" ? (
						<>
							<FormField
								label="Email"
								value={email}
								onChangeText={(
									text,
								) => {
									resetNotices();
									setEmail(
										text,
									);
								}}
								placeholder="name@example.com"
								keyboardType="email-address"
								autoCapitalize="none"
							/>

							<FormField
								label="Display Name"
								value={
									displayName
								}
								onChangeText={(
									text,
								) => {
									resetNotices();
									setDisplayName(
										text,
									);
								}}
								placeholder="Optional (defaults to username)"
								autoCapitalize="words"
							/>

							<CityTimezonePicker
								label="Timezone"
								value={timezone}
								onChangeValue={(
									nextTimezone,
								) => {
									resetNotices();
									setTimezone(
										nextTimezone,
									);
								}}
								placeholder="Search city"
							/>

							<View
								style={
									styles.row
								}
							>
								<Text
									style={
										styles.label
									}
								>
									Public
									Profile
								</Text>
								<Switch
									value={
										isPublic
									}
									onValueChange={
										setIsPublic
									}
								/>
							</View>
						</>
					) : null}

					{mode === "verify-email" ? (
						<>
							{pendingEmail ? (
								<Text
									style={
										styles.helperText
									}
								>
									Verification
									email
									sent to{" "}
									{
										pendingEmail
									}
									.
								</Text>
							) : null}
							<FormField
								label="Verification Token"
								value={
									verificationToken
								}
								onChangeText={(
									text,
								) => {
									resetNotices();
									setVerificationToken(
										text,
									);
								}}
								placeholder="From email link"
								autoCapitalize="none"
							/>
							<ActionButton
								label="Resend Verification Email"
								onPress={() =>
									void handleResendVerification()
								}
								variant="muted"
								disabled={
									requestEmailVerificationLoading
								}
							/>
						</>
					) : null}

					{mode === "forgot-password" ? (
						<FormField
							label="Email or Username"
							value={resetIdentifier}
							onChangeText={(
								text,
							) => {
								resetNotices();
								setResetIdentifier(
									text,
								);
							}}
							placeholder="name@example.com or jane_doe"
							autoCapitalize="none"
						/>
					) : null}

					{mode === "reset-password" ? (
						<>
							<FormField
								label="Reset Token"
								value={
									resetToken
								}
								onChangeText={(
									text,
								) => {
									resetNotices();
									setResetToken(
										text,
									);
								}}
								placeholder="From email link"
								autoCapitalize="none"
							/>
							<FormField
								label="New Password"
								value={
									newPassword
								}
								onChangeText={(
									text,
								) => {
									resetNotices();
									setNewPassword(
										text,
									);
								}}
								secureTextEntry
								placeholder="••••••••"
								autoCapitalize="none"
							/>
							<FormField
								label="Confirm Password"
								value={
									confirmPassword
								}
								onChangeText={(
									text,
								) => {
									resetNotices();
									setConfirmPassword(
										text,
									);
								}}
								secureTextEntry
								placeholder="••••••••"
								autoCapitalize="none"
							/>
						</>
					) : null}

					{infoMessage ? (
						<StateNotice
							mode="empty"
							message={infoMessage}
						/>
					) : null}

					{formError ? (
						<StateNotice
							mode="error"
							message={formError}
						/>
					) : null}

					<ActionButton
						label={getSubmitLabel(mode)}
						onPress={() =>
							void handleSubmit()
						}
						loading={loading}
					/>

					{mode === "login" ||
					mode === "register" ? (
						<Pressable
							style={
								styles.modeButton
							}
							onPress={() => {
								handleModeSwitch(
									mode ===
										"login"
										? "register"
										: "login",
								);
							}}
						>
							<Text
								style={
									styles.modeButtonLabel
								}
							>
								{mode ===
								"login"
									? "Need an account? Register"
									: "Already have an account? Sign in"}
							</Text>
						</Pressable>
					) : (
						<Pressable
							style={
								styles.modeButton
							}
							onPress={() =>
								handleModeSwitch(
									"login",
								)
							}
						>
							<Text
								style={
									styles.modeButtonLabel
								}
							>
								Back to sign in
							</Text>
						</Pressable>
					)}
				</View>
			</ScrollView>
		</ScreenScaffold>
	);
}
