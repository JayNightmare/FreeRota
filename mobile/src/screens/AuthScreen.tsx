import { useMemo, useState } from "react";
import {
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
import { LOGIN_MUTATION, REGISTER_MUTATION } from "../graphql/operations";
import { useAuth } from "../auth/AuthProvider";
import { toUserErrorMessage } from "../utils/errors";
import { CityTimezonePicker } from "../components/CityTimezonePicker";
import { getDeviceTimezone } from "../utils/time";

export function AuthScreen() {
	const { theme } = useTheme();
	const { signIn } = useAuth();
	const [mode, setMode] = useState<"login" | "register">("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [username, setUsername] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [timezone, setTimezone] = useState(getDeviceTimezone());
	const [isPublic, setIsPublic] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const [login, { loading: loginLoading }] = useMutation(LOGIN_MUTATION);
	const [register, { loading: registerLoading }] =
		useMutation(REGISTER_MUTATION);

	const loading = loginLoading || registerLoading;

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
			}),
		[theme],
	);

	const resetError = (): void => {
		if (formError) {
			setFormError(null);
		}
	};

	const handleSubmit = async (): Promise<void> => {
		setFormError(null);

		if (!username.trim() || !password.trim()) {
			setFormError("Username and password are required.");
			return;
		}

		try {
			if (mode === "login") {
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

			if (!username.trim()) {
				setFormError(
					"Username is required for registration.",
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

			const token: string | undefined =
				response.data?.register?.token;
			if (!token) {
				setFormError("Unable to create account.");
				return;
			}

			await signIn(token);
		} catch (error) {
			setFormError(
				toUserErrorMessage(
					error,
					"Authentication failed.",
				),
			);
		}
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
						{mode === "login"
							? "Welcome Back"
							: "Create Account"}
					</Text>
					<Text style={styles.subtitle}>
						Sign in to manage your rota and
						coordinate plans.
					</Text>

					<FormField
						label="Username"
						value={username}
						onChangeText={(text) => {
							resetError();
							setUsername(text);
						}}
						placeholder="jane_doe"
						autoCapitalize="none"
					/>

					<FormField
						label="Password"
						value={password}
						onChangeText={(text) => {
							resetError();
							setPassword(text);
						}}
						secureTextEntry
						placeholder="••••••••"
						autoCapitalize="none"
					/>

					{mode === "register" ? (
						<>
							<FormField
								label="Email"
								value={email}
								onChangeText={(
									text,
								) => {
									resetError();
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
									resetError();
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
									resetError();
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

					{formError ? (
						<StateNotice
							mode="error"
							message={formError}
						/>
					) : null}

					<ActionButton
						label={
							mode === "login"
								? "Sign In"
								: "Create Account"
						}
						onPress={() =>
							void handleSubmit()
						}
						loading={loading}
					/>

					<Pressable
						style={styles.modeButton}
						onPress={() => {
							setMode(
								(
									currentMode,
								) =>
									currentMode ===
									"login"
										? "register"
										: "login",
							);
							setFormError(null);
						}}
					>
						<Text
							style={
								styles.modeButtonLabel
							}
						>
							{mode === "login"
								? "Need an account? Register"
								: "Already have an account? Sign in"}
						</Text>
					</Pressable>
				</View>
			</ScrollView>
		</ScreenScaffold>
	);
}
