import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
	useWindowDimensions,
} from "react-native";
import { HeaderNavBar } from "../../components/desktop/HeaderNavBar";
import { SUBMIT_ENTERPRISE_INQUIRY_MUTATION } from "../../graphql/operations";
import {
	type DesktopScreenSlug,
	navigateWebPath,
	navigateToDesktopScreen,
} from "./desktopRoutes";

const TOKENS = {
	background: "#0D0D0E",
	surface: "#151516",
	surfaceHigh: "#1D1D20",
	surfaceMuted: "#242429",
	text: "#FFFFFF",
	textDim: "#B6B3C0",
	textMuted: "rgba(255, 255, 255, 0.45)",
	primary: "#BE9DFF",
	primaryDeep: "#34006E",
	secondary: "#6CC7FF",
	tertiary: "#FF97B1",
	outline: "rgba(255, 255, 255, 0.12)",
};

const FOOTER_LINKS: Array<{ label: string; slug: DesktopScreenSlug }> = [
	{ label: "Platform", slug: "platform" },
	{ label: "Solutions", slug: "solutions" },
	{ label: "Enterprise", slug: "enterprise" },
	{ label: "Pricing", slug: "pricing" },
	{ label: "Get Started", slug: "get-started" },
	{ label: "Enterprise Inquiry", slug: "enterprise-inquiry" },
];

type EnterpriseInquiryType =
	| "PRICING"
	| "PARTNERSHIP"
	| "BULK_LICENSING"
	| "SUPPORT"
	| "OTHER";

interface SubmitEnterpriseInquiryData {
	submitEnterpriseInquiry: {
		success: boolean;
		message: string;
		ticketId?: string | null;
	};
}

interface SubmitEnterpriseInquiryVars {
	input: {
		companyName: string;
		contactName: string;
		email: string;
		phone?: string | null;
		inquiryType: EnterpriseInquiryType;
		message: string;
	};
}

interface DesktopShellProps {
	activeSlug: DesktopScreenSlug;
	kicker: string;
	title: string;
	subtitle: string;
	children: React.ReactNode;
}

function DesktopShell({
	activeSlug,
	kicker,
	title,
	subtitle,
	children,
}: DesktopShellProps) {
	const { width } = useWindowDimensions();
	const isTablet = width >= 860;
	const isDesktop = width >= 1080;

	const styles = useMemo(
		() =>
			StyleSheet.create({
				root: {
					flex: 1,
					backgroundColor: TOKENS.background,
				},
				scrollContent: {
					paddingBottom: 56,
				},
				navBrand: {
					fontSize: 28,
					fontWeight: "900",
					letterSpacing: -1,
					color: TOKENS.primary,
				},
				heroWrap: {
					paddingHorizontal: isDesktop ? 42 : 18,
					paddingTop: isDesktop ? 64 : 42,
					paddingBottom: isDesktop ? 48 : 36,
					borderBottomWidth: 1,
					borderBottomColor:
						"rgba(255,255,255,0.06)",
					gap: 14,
				},
				heroKicker: {
					fontSize: 11,
					fontWeight: "800",
					letterSpacing: 2,
					textTransform: "uppercase",
					color: TOKENS.primary,
				},
				heroTitle: {
					fontSize: isDesktop ? 68 : 44,
					lineHeight: isDesktop ? 72 : 48,
					fontWeight: "900",
					letterSpacing: -2,
					color: TOKENS.text,
					maxWidth: 980,
				},
				heroSubtitle: {
					fontSize: isDesktop ? 21 : 17,
					lineHeight: isDesktop ? 32 : 28,
					maxWidth: 930,
					color: TOKENS.textDim,
				},
				contentWrap: {
					paddingHorizontal: isDesktop ? 42 : 18,
					paddingTop: isDesktop ? 46 : 30,
					gap: 26,
				},
				footer: {
					marginTop: 34,
					paddingHorizontal: isDesktop ? 42 : 18,
					paddingVertical: 30,
					borderTopWidth: 1,
					borderTopColor:
						"rgba(255,255,255,0.08)",
					flexDirection: isTablet
						? "row"
						: "column",
					justifyContent: "space-between",
					gap: 18,
				},
				footerMeta: {
					fontSize: 11,
					fontWeight: "700",
					textTransform: "uppercase",
					letterSpacing: 1,
					color: TOKENS.textMuted,
				},
				footerLinks: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: 18,
				},
				footerLink: {
					fontSize: 11,
					fontWeight: "700",
					textTransform: "uppercase",
					letterSpacing: 1,
					color: TOKENS.textDim,
				},
			}),
		[isDesktop, isTablet],
	);

	return (
		<View style={styles.root}>
			<ScrollView
				style={styles.root}
				contentContainerStyle={styles.scrollContent}
			>
				<HeaderNavBar
					activeSlug={activeSlug}
					variant="route"
				/>

				<View style={styles.heroWrap}>
					<Text style={styles.heroKicker}>
						{kicker}
					</Text>
					<Text style={styles.heroTitle}>
						{title}
					</Text>
					<Text style={styles.heroSubtitle}>
						{subtitle}
					</Text>
				</View>

				<View style={styles.contentWrap}>
					{children}
				</View>

				<View style={styles.footer}>
					<View>
						<Text style={styles.navBrand}>
							FreeRota
						</Text>
						<Text style={styles.footerMeta}>
							© 2026 FreeRota.
							Coordination
							Infrastructure.
						</Text>
					</View>
					<View style={styles.footerLinks}>
						{FOOTER_LINKS.map((link) => (
							<Pressable
								key={link.slug}
								onPress={() =>
									navigateToDesktopScreen(
										link.slug,
									)
								}
							>
								<Text
									style={
										styles.footerLink
									}
								>
									{
										link.label
									}
								</Text>
							</Pressable>
						))}
					</View>
				</View>
			</ScrollView>
		</View>
	);
}

function SectionGrid({ children }: { children: React.ReactNode }) {
	return (
		<View
			style={{
				flexDirection: "row",
				flexWrap: "wrap",
				gap: 16,
			}}
		>
			{children}
		</View>
	);
}

function InfoCard({
	title,
	description,
	icon,
	accent,
}: {
	title: string;
	description: string;
	icon: keyof typeof Ionicons.glyphMap;
	accent: string;
}) {
	return (
		<View
			style={{
				flexBasis: 280,
				flexGrow: 1,
				backgroundColor: TOKENS.surface,
				paddingHorizontal: 18,
				paddingVertical: 18,
				borderLeftWidth: 4,
				borderLeftColor: accent,
				gap: 10,
			}}
		>
			<Ionicons name={icon} size={22} color={accent} />
			<Text
				style={{
					fontSize: 24,
					fontWeight: "800",
					color: TOKENS.text,
					letterSpacing: -0.8,
				}}
			>
				{title}
			</Text>
			<Text
				style={{
					fontSize: 15,
					lineHeight: 24,
					color: TOKENS.textDim,
				}}
			>
				{description}
			</Text>
		</View>
	);
}

function ActionStrip({
	title,
	description,
	primaryLabel,
	onPrimary,
	secondaryLabel,
	onSecondary,
}: {
	title: string;
	description: string;
	primaryLabel: string;
	onPrimary: () => void;
	secondaryLabel?: string;
	onSecondary?: () => void;
}) {
	return (
		<View
			style={{
				backgroundColor: TOKENS.surfaceHigh,
				paddingHorizontal: 24,
				paddingVertical: 24,
				gap: 14,
			}}
		>
			<Text
				style={{
					fontSize: 34,
					lineHeight: 38,
					fontWeight: "900",
					color: TOKENS.text,
					letterSpacing: -1.2,
				}}
			>
				{title}
			</Text>
			<Text
				style={{
					fontSize: 16,
					lineHeight: 26,
					color: TOKENS.textDim,
				}}
			>
				{description}
			</Text>
			<View
				style={{
					flexDirection: "row",
					flexWrap: "wrap",
					gap: 12,
				}}
			>
				<Pressable
					onPress={onPrimary}
					style={{
						backgroundColor: TOKENS.primary,
						paddingHorizontal: 18,
						paddingVertical: 12,
						borderWidth: 1,
						borderColor:
							"rgba(178, 139, 255, 0.8)",
					}}
				>
					<Text
						style={{
							color: TOKENS.primaryDeep,
							textTransform:
								"uppercase",
							letterSpacing: 1,
							fontWeight: "900",
							fontSize: 12,
						}}
					>
						{primaryLabel}
					</Text>
				</Pressable>
				{secondaryLabel && onSecondary ? (
					<Pressable
						onPress={onSecondary}
						style={{
							backgroundColor:
								TOKENS.surfaceMuted,
							paddingHorizontal: 18,
							paddingVertical: 12,
						}}
					>
						<Text
							style={{
								color: TOKENS.text,
								textTransform:
									"uppercase",
								letterSpacing: 1,
								fontWeight: "800",
								fontSize: 12,
							}}
						>
							{secondaryLabel}
						</Text>
					</Pressable>
				) : null}
			</View>
		</View>
	);
}

export function DesktopPlatformScreen() {
	return (
		<DesktopShell
			activeSlug="platform"
			kicker="Platform"
			title="Build Coordination Around Real Schedules"
			subtitle="FreeRota Platform combines personal rota visibility, real-time sharing controls, and developer-ready synchronization so teams coordinate with confidence."
		>
			<SectionGrid>
				<InfoCard
					title="Connected Data"
					description="Bring schedules from your HR stack and keep every view up-to-date with reliable sync routines."
					icon="git-network-outline"
					accent={TOKENS.primary}
				/>
				<InfoCard
					title="Privacy Layer"
					description="Visibility is role-aware and policy-driven, so users share only what each audience should see."
					icon="shield-checkmark-outline"
					accent={TOKENS.tertiary}
				/>
				<InfoCard
					title="Real-time Signals"
					description="Notification events trigger on swaps, approvals, and overlap windows, reducing coordination lag."
					icon="pulse-outline"
					accent={TOKENS.secondary}
				/>
			</SectionGrid>
			<ActionStrip
				title="Use it today. Scale it tomorrow."
				description="Start with personal schedule sync and expand into team-wide policy automation with no migration rewrite."
				primaryLabel="Get Started"
				onPrimary={() =>
					navigateToDesktopScreen("get-started")
				}
				secondaryLabel="See Pricing"
				onSecondary={() =>
					navigateToDesktopScreen("pricing")
				}
			/>
		</DesktopShell>
	);
}

export function DesktopSolutionsScreen() {
	return (
		<DesktopShell
			activeSlug="solutions"
			kicker="Solutions"
			title="Designed for Teams, Operations, and Builders"
			subtitle="Whether you are coordinating shift workers, managing business operations, or embedding schedule intelligence in products, FreeRota delivers focused workflows."
		>
			<SectionGrid>
				<InfoCard
					title="Social Syncing"
					description="Users can share availability without oversharing personal shift details, perfect for friend groups and family planning."
					icon="people-outline"
					accent={TOKENS.primary}
				/>
				<InfoCard
					title="Operational Visibility"
					description="Managers get clean visibility on staffing windows, conflict zones, and gap detection for daily operations."
					icon="analytics-outline"
					accent={TOKENS.secondary}
				/>
				<InfoCard
					title="Developer APIs"
					description="Integrate rota, free-time, and notification events into your own products via GraphQL and webhook-driven workflows."
					icon="code-slash-outline"
					accent={TOKENS.tertiary}
				/>
			</SectionGrid>
			<ActionStrip
				title="Need a custom rollout plan?"
				description="Our team can map a phased launch for your organization, from pilot cohort to full workforce rollout."
				primaryLabel="Enterprise Inquiry"
				onPrimary={() =>
					navigateToDesktopScreen(
						"enterprise-inquiry",
					)
				}
				secondaryLabel="Get Started"
				onSecondary={() =>
					navigateToDesktopScreen("get-started")
				}
			/>
		</DesktopShell>
	);
}

export function DesktopEnterpriseScreen() {
	return (
		<DesktopShell
			activeSlug="enterprise"
			kicker="Enterprise"
			title="Reliability and Governance for Global Teams"
			subtitle="FreeRota Enterprise is built for complex org structures, distributed teams, and compliance-heavy environments where schedule data integrity matters."
		>
			<SectionGrid>
				<InfoCard
					title="Identity and Access"
					description="SAML, OAuth, and role policies ensure each user sees only what they need across departments and regions."
					icon="lock-closed-outline"
					accent={TOKENS.primary}
				/>
				<InfoCard
					title="Regional Controls"
					description="Select region-aware data handling strategies to meet privacy and residency obligations."
					icon="earth-outline"
					accent={TOKENS.secondary}
				/>
				<InfoCard
					title="Dedicated Support"
					description="Priority channels and implementation guidance help your teams move from pilot to production quickly."
					icon="headset-outline"
					accent={TOKENS.tertiary}
				/>
			</SectionGrid>
			<ActionStrip
				title="Ready to evaluate enterprise fit?"
				description="Share your current workflow and team footprint, and we will design a trial plan for your business."
				primaryLabel="Start Inquiry"
				onPrimary={() =>
					navigateToDesktopScreen(
						"enterprise-inquiry",
					)
				}
				secondaryLabel="View Pricing"
				onSecondary={() =>
					navigateToDesktopScreen("pricing")
				}
			/>
		</DesktopShell>
	);
}

export function DesktopPricingScreen() {
	const plans = [
		{
			name: "Starter",
			price: "Free",
			desc: "Personal scheduling and friend coordination.",
			accent: TOKENS.secondary,
			items: [
				"Core rota sync",
				"Availability sharing",
				"Basic notifications",
			],
		},
		{
			name: "Growth",
			price: "$39/mo",
			desc: "Small teams with operational visibility needs.",
			accent: TOKENS.primary,
			items: [
				"Team dashboards",
				"Advanced alerts",
				"Priority onboarding",
			],
		},
		{
			name: "Enterprise",
			price: "Custom",
			desc: "Governance, API scale, and dedicated support.",
			accent: TOKENS.tertiary,
			items: [
				"SSO/SAML",
				"Regional controls",
				"Dedicated account manager",
			],
		},
	];

	return (
		<DesktopShell
			activeSlug="pricing"
			kicker="Pricing"
			title="Simple Plans, Built to Grow with You"
			subtitle="Start lightweight and graduate to enterprise governance without re-platforming your scheduling workflows."
		>
			<SectionGrid>
				{plans.map((plan) => (
					<View
						key={plan.name}
						style={{
							flexBasis: 260,
							flexGrow: 1,
							backgroundColor:
								TOKENS.surface,
							paddingHorizontal: 18,
							paddingVertical: 18,
							borderLeftWidth: 4,
							borderLeftColor:
								plan.accent,
							gap: 10,
						}}
					>
						<Text
							style={{
								fontSize: 24,
								fontWeight: "900",
								color: TOKENS.text,
							}}
						>
							{plan.name}
						</Text>
						<Text
							style={{
								fontSize: 28,
								fontWeight: "900",
								color: plan.accent,
							}}
						>
							{plan.price}
						</Text>
						<Text
							style={{
								fontSize: 15,
								lineHeight: 24,
								color: TOKENS.textDim,
							}}
						>
							{plan.desc}
						</Text>
						{plan.items.map((item) => (
							<Text
								key={item}
								style={{
									fontSize: 13,
									lineHeight: 20,
									color: TOKENS.textDim,
								}}
							>
								• {item}
							</Text>
						))}
					</View>
				))}
			</SectionGrid>
			<ActionStrip
				title="Need enterprise pricing tailored to your organization?"
				description="Tell us your team size and required controls, and we will map a plan with a trial runway."
				primaryLabel="Enterprise Inquiry"
				onPrimary={() =>
					navigateToDesktopScreen(
						"enterprise-inquiry",
					)
				}
				secondaryLabel="Get Started"
				onSecondary={() =>
					navigateToDesktopScreen("get-started")
				}
			/>
		</DesktopShell>
	);
}

export function DesktopLoginScreen() {
	return (
		<DesktopShell
			activeSlug="log-in"
			kicker="Log In"
			title="Access Your FreeRota Workspace"
			subtitle="Use this route to jump back into the app flow. Desktop root behavior remains unchanged and follows existing access rules."
		>
			<ActionStrip
				title="Open the app entry"
				description="Selecting this keeps current app logic, including desktop root redirect behavior and mobile-first guard handling."
				primaryLabel="Open App Root"
				onPrimary={() => navigateWebPath("/")}
				secondaryLabel="Get Started"
				onSecondary={() =>
					navigateToDesktopScreen("get-started")
				}
			/>
			<SectionGrid>
				<InfoCard
					title="Need Beta Access?"
					description="Apply through Get Started if you are requesting early access for individual testing."
					icon="flask-outline"
					accent={TOKENS.secondary}
				/>
				<InfoCard
					title="Business Trial"
					description="Use Enterprise Inquiry for organizational pilot requests and software evaluation."
					icon="briefcase-outline"
					accent={TOKENS.primary}
				/>
			</SectionGrid>
		</DesktopShell>
	);
}

export function DesktopGetStartedScreen() {
	return (
		<DesktopShell
			activeSlug="get-started"
			kicker="Get Started"
			title="Choose Your Path: Beta Access or Enterprise Trial"
			subtitle="Tell us whether you are an individual tester or a business evaluating deployment. We route you to the right onboarding flow."
		>
			<SectionGrid>
				<View
					style={{
						flexBasis: 320,
						flexGrow: 1,
						backgroundColor: TOKENS.surface,
						paddingHorizontal: 20,
						paddingVertical: 20,
						borderLeftWidth: 4,
						borderLeftColor:
							TOKENS.secondary,
						gap: 12,
					}}
				>
					<Text
						style={{
							fontSize: 30,
							lineHeight: 34,
							fontWeight: "900",
							color: TOKENS.text,
						}}
					>
						Beta Testing
					</Text>
					<Text
						style={{
							fontSize: 15,
							lineHeight: 24,
							color: TOKENS.textDim,
						}}
					>
						For individual users and early
						adopters who want to explore
						social schedule syncing.
					</Text>
					<Pressable
						onPress={() =>
							navigateToDesktopScreen(
								"log-in",
							)
						}
						style={{
							alignSelf: "flex-start",
							backgroundColor:
								TOKENS.secondary,
							paddingHorizontal: 16,
							paddingVertical: 10,
						}}
					>
						<Text
							style={{
								color: "#002941",
								textTransform:
									"uppercase",
								letterSpacing: 1,
								fontWeight: "900",
								fontSize: 12,
							}}
						>
							Go to Login Path
						</Text>
					</Pressable>
				</View>
				<View
					style={{
						flexBasis: 320,
						flexGrow: 1,
						backgroundColor: TOKENS.surface,
						paddingHorizontal: 20,
						paddingVertical: 20,
						borderLeftWidth: 4,
						borderLeftColor: TOKENS.primary,
						gap: 12,
					}}
				>
					<Text
						style={{
							fontSize: 30,
							lineHeight: 34,
							fontWeight: "900",
							color: TOKENS.text,
						}}
					>
						Enterprise Inquiry
					</Text>
					<Text
						style={{
							fontSize: 15,
							lineHeight: 24,
							color: TOKENS.textDim,
						}}
					>
						For business owners and
						operators planning a structured
						trial across teams.
					</Text>
					<Pressable
						onPress={() =>
							navigateToDesktopScreen(
								"enterprise-inquiry",
							)
						}
						style={{
							alignSelf: "flex-start",
							backgroundColor:
								TOKENS.primary,
							paddingHorizontal: 16,
							paddingVertical: 10,
						}}
					>
						<Text
							style={{
								color: TOKENS.primaryDeep,
								textTransform:
									"uppercase",
								letterSpacing: 1,
								fontWeight: "900",
								fontSize: 12,
							}}
						>
							Open Inquiry Form
						</Text>
					</Pressable>
				</View>
			</SectionGrid>
		</DesktopShell>
	);
}

export function DesktopEnterpriseInquiryScreen() {
	const [contactName, setContactName] = useState("");
	const [jobTitle, setJobTitle] = useState("");
	const [email, setEmail] = useState("");
	const [companyName, setCompanyName] = useState("");
	const [teamSize, setTeamSize] = useState("");
	const [phone, setPhone] = useState("");
	const [message, setMessage] = useState("");
	const [inquiryType, setInquiryType] =
		useState<EnterpriseInquiryType>("PRICING");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(
		null,
	);

	const [submitEnterpriseInquiry, { loading }] = useMutation<
		SubmitEnterpriseInquiryData,
		SubmitEnterpriseInquiryVars
	>(SUBMIT_ENTERPRISE_INQUIRY_MUTATION);

	const handleSubmit = useCallback(async () => {
		setErrorMessage(null);
		setSuccessMessage(null);

		const nextContactName = contactName.trim();
		const nextEmail = email.trim();
		const nextCompanyName = companyName.trim();
		const nextMessage = message.trim();
		const nextPhone = phone.trim();

		if (
			!nextContactName ||
			!nextEmail ||
			!nextCompanyName ||
			!nextMessage
		) {
			setErrorMessage("Please complete all required fields.");
			return;
		}

		const fullMessage = [
			nextMessage,
			"",
			`Job Title: ${jobTitle.trim() || "Not provided"}`,
			`Team Size: ${teamSize.trim() || "Not provided"}`,
		].join("\n");

		try {
			const response = await submitEnterpriseInquiry({
				variables: {
					input: {
						companyName: nextCompanyName,
						contactName: nextContactName,
						email: nextEmail,
						phone: nextPhone || null,
						inquiryType,
						message: fullMessage,
					},
				},
			});

			if (response.data?.submitEnterpriseInquiry.success) {
				setSuccessMessage(
					response.data.submitEnterpriseInquiry
						.message,
				);
				setContactName("");
				setJobTitle("");
				setEmail("");
				setCompanyName("");
				setTeamSize("");
				setPhone("");
				setMessage("");
			} else {
				setErrorMessage(
					response.data?.submitEnterpriseInquiry
						.message ??
						"Unable to submit inquiry.",
				);
			}
		} catch (error) {
			const maybeMessage =
				typeof error === "object" &&
				error !== null &&
				"message" in error
					? String(
							(
								error as {
									message?: unknown;
								}
							).message,
						)
					: "Unable to submit inquiry right now.";
			setErrorMessage(maybeMessage);
		}
	}, [
		companyName,
		contactName,
		email,
		inquiryType,
		jobTitle,
		message,
		phone,
		submitEnterpriseInquiry,
		teamSize,
	]);

	const inquiryTypes: EnterpriseInquiryType[] = [
		"PRICING",
		"PARTNERSHIP",
		"BULK_LICENSING",
		"SUPPORT",
		"OTHER",
	];

	return (
		<DesktopShell
			activeSlug="enterprise-inquiry"
			kicker="Enterprise Inquiry"
			title="Start a Business Trial with FreeRota"
			subtitle="Share your operational context and we'll design a trial path for your organization."
		>
			<View
				style={{
					backgroundColor: TOKENS.surface,
					paddingHorizontal: 20,
					paddingVertical: 22,
					gap: 14,
				}}
			>
				<Text
					style={{
						fontSize: 30,
						lineHeight: 34,
						fontWeight: "900",
						color: TOKENS.text,
					}}
				>
					Request a Consultation
				</Text>
				<View
					style={{
						flexDirection: "row",
						flexWrap: "wrap",
						gap: 12,
					}}
				>
					{inquiryTypes.map((value) => {
						const selected =
							inquiryType === value;
						return (
							<Pressable
								key={value}
								onPress={() =>
									setInquiryType(
										value,
									)
								}
								style={{
									paddingHorizontal: 12,
									paddingVertical: 8,
									borderWidth: 1,
									borderColor:
										selected
											? TOKENS.primary
											: TOKENS.outline,
									backgroundColor:
										selected
											? "rgba(190,157,255,0.16)"
											: TOKENS.surfaceHigh,
								}}
							>
								<Text
									style={{
										fontSize: 11,
										fontWeight: "800",
										letterSpacing: 0.8,
										textTransform:
											"uppercase",
										color: selected
											? TOKENS.primary
											: TOKENS.textDim,
									}}
								>
									{value.replace(
										"_",
										" ",
									)}
								</Text>
							</Pressable>
						);
					})}
				</View>
				<View
					style={{
						flexDirection: "row",
						flexWrap: "wrap",
						gap: 12,
					}}
				>
					<TextInput
						value={contactName}
						onChangeText={setContactName}
						placeholder="Full Name *"
						placeholderTextColor={
							TOKENS.textMuted
						}
						style={{
							flexBasis: 250,
							flexGrow: 1,
							height: 46,
							paddingHorizontal: 12,
							backgroundColor:
								TOKENS.surfaceHigh,
							color: TOKENS.text,
							borderBottomWidth: 2,
							borderBottomColor:
								TOKENS.outline,
						}}
					/>
					<TextInput
						value={jobTitle}
						onChangeText={setJobTitle}
						placeholder="Job Title"
						placeholderTextColor={
							TOKENS.textMuted
						}
						style={{
							flexBasis: 250,
							flexGrow: 1,
							height: 46,
							paddingHorizontal: 12,
							backgroundColor:
								TOKENS.surfaceHigh,
							color: TOKENS.text,
							borderBottomWidth: 2,
							borderBottomColor:
								TOKENS.outline,
						}}
					/>
					<TextInput
						value={email}
						onChangeText={setEmail}
						placeholder="Work Email *"
						placeholderTextColor={
							TOKENS.textMuted
						}
						autoCapitalize="none"
						keyboardType="email-address"
						style={{
							flexBasis: 250,
							flexGrow: 1,
							height: 46,
							paddingHorizontal: 12,
							backgroundColor:
								TOKENS.surfaceHigh,
							color: TOKENS.text,
							borderBottomWidth: 2,
							borderBottomColor:
								TOKENS.outline,
						}}
					/>
					<TextInput
						value={companyName}
						onChangeText={setCompanyName}
						placeholder="Company Name *"
						placeholderTextColor={
							TOKENS.textMuted
						}
						style={{
							flexBasis: 250,
							flexGrow: 1,
							height: 46,
							paddingHorizontal: 12,
							backgroundColor:
								TOKENS.surfaceHigh,
							color: TOKENS.text,
							borderBottomWidth: 2,
							borderBottomColor:
								TOKENS.outline,
						}}
					/>
					<TextInput
						value={teamSize}
						onChangeText={setTeamSize}
						placeholder="Team Size"
						placeholderTextColor={
							TOKENS.textMuted
						}
						style={{
							flexBasis: 250,
							flexGrow: 1,
							height: 46,
							paddingHorizontal: 12,
							backgroundColor:
								TOKENS.surfaceHigh,
							color: TOKENS.text,
							borderBottomWidth: 2,
							borderBottomColor:
								TOKENS.outline,
						}}
					/>
					<TextInput
						value={phone}
						onChangeText={setPhone}
						placeholder="Phone"
						placeholderTextColor={
							TOKENS.textMuted
						}
						style={{
							flexBasis: 250,
							flexGrow: 1,
							height: 46,
							paddingHorizontal: 12,
							backgroundColor:
								TOKENS.surfaceHigh,
							color: TOKENS.text,
							borderBottomWidth: 2,
							borderBottomColor:
								TOKENS.outline,
						}}
					/>
					<TextInput
						value={message}
						onChangeText={setMessage}
						placeholder="How can we help? *"
						placeholderTextColor={
							TOKENS.textMuted
						}
						multiline
						textAlignVertical="top"
						style={{
							flexBasis: "100%",
							minHeight: 140,
							paddingHorizontal: 12,
							paddingVertical: 12,
							backgroundColor:
								TOKENS.surfaceHigh,
							color: TOKENS.text,
							borderBottomWidth: 2,
							borderBottomColor:
								TOKENS.outline,
						}}
					/>
				</View>
				{errorMessage ? (
					<Text
						style={{
							color: "#FF8A8A",
							fontSize: 13,
							fontWeight: "700",
						}}
					>
						{errorMessage}
					</Text>
				) : null}
				{successMessage ? (
					<Text
						style={{
							color: "#8BFFBE",
							fontSize: 13,
							fontWeight: "700",
						}}
					>
						{successMessage}
					</Text>
				) : null}
				<Pressable
					onPress={handleSubmit}
					disabled={loading}
					style={{
						alignSelf: "flex-start",
						backgroundColor: loading
							? "#6f6091"
							: TOKENS.primary,
						paddingHorizontal: 20,
						paddingVertical: 12,
						borderWidth: 1,
						borderColor:
							"rgba(178, 139, 255, 0.85)",
					}}
				>
					<Text
						style={{
							color: TOKENS.primaryDeep,
							textTransform:
								"uppercase",
							letterSpacing: 1,
							fontWeight: "900",
							fontSize: 12,
						}}
					>
						{loading
							? "Sending..."
							: "Send Inquiry"}
					</Text>
				</Pressable>
			</View>
		</DesktopShell>
	);
}
