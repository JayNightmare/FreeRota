import { useCallback, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
	useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery } from "@apollo/client";
import { useAuth } from "../../auth/AuthProvider";
import {
	MY_ORGANIZATIONS_QUERY,
	ORGANIZATION_DETAILS_QUERY,
	ORGANIZATION_AUDIT_LOGS_QUERY,
	CREATE_SITE_MUTATION,
	CREATE_TEAM_MUTATION,
	ORGANIZATION_SSO_CONFIG_QUERY,
	APPLY_FOR_ENTERPRISE_MUTATION,
} from "../../graphql/operations";
import { navigateToDesktopScreen } from "./desktopRoutes";
import { toLocalDateTime } from "../../utils/time";

const T = {
	bg: "#0D0D0E",
	surface: "#151516",
	surfaceHigh: "#1D1D20",
	surfaceMuted: "#242429",
	text: "#FFFFFF",
	textDim: "#B6B3C0",
	textMuted: "rgba(255,255,255,0.45)",
	primary: "#BE9DFF",
	primaryDeep: "#34006E",
	secondary: "#6CC7FF",
	tertiary: "#FF97B1",
	outline: "rgba(255,255,255,0.12)",
	error: "#FF8A8A",
	success: "#8BFFBE",
};

type DashboardPanel =
	| "profile"
	| "sites"
	| "identity"
	| "audit"
	| "enterprise";

const NAV_ITEMS: Array<{
	key: DashboardPanel;
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
}> = [
	{ key: "profile", label: "Organisation", icon: "business-outline" },
	{ key: "sites", label: "Sites & Teams", icon: "layers-outline" },
	{ key: "identity", label: "Identity (SSO)", icon: "key-outline" },
	{ key: "audit", label: "Audit Log", icon: "document-text-outline" },
	{ key: "enterprise", label: "Enterprise", icon: "rocket-outline" },
];

export function DesktopDashboardScreen() {
	const { width } = useWindowDimensions();
	const { signOut } = useAuth();
	const isWide = width >= 1080;
	const [panel, setPanel] = useState<DashboardPanel>("profile");
	const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

	const { loading: orgLoading } = useQuery(MY_ORGANIZATIONS_QUERY, {
		onCompleted: (data: any) => {
			if (data?.myOrganizations?.length > 0 && !activeOrgId) {
				setActiveOrgId(data.myOrganizations[0].organizationId);
			}
		},
	});

	const {
		data: detailsData,
		loading: detailsLoading,
		refetch: refetchDetails,
	} = useQuery(ORGANIZATION_DETAILS_QUERY, {
		variables: { orgId: activeOrgId },
		skip: !activeOrgId,
		fetchPolicy: "cache-and-network",
	});

	const { data: auditData } = useQuery(ORGANIZATION_AUDIT_LOGS_QUERY, {
		variables: { orgId: activeOrgId, limit: 30 },
		skip: !activeOrgId,
		fetchPolicy: "cache-and-network",
	});

	const { data: ssoData } = useQuery(ORGANIZATION_SSO_CONFIG_QUERY, {
		variables: { orgId: activeOrgId },
		skip: !activeOrgId,
		fetchPolicy: "cache-and-network",
	});

	const [createSiteMut] = useMutation(CREATE_SITE_MUTATION);
	const [createTeamMut] = useMutation(CREATE_TEAM_MUTATION);
	const [applyEnterprise, { loading: applyLoading }] = useMutation(
		APPLY_FOR_ENTERPRISE_MUTATION,
	);

	const org = detailsData?.organization;
	const sites = detailsData?.organizationSites ?? [];
	const teams = detailsData?.organizationTeams ?? [];
	const auditLogs = auditData?.organizationAuditLogs ?? [];
	const ssoConfig = ssoData?.organizationSsoConfig;

	// Site creation state
	const [siteName, setSiteName] = useState("");
	const [siteRegion, setSiteRegion] = useState("");
	const [siteTz, setSiteTz] = useState("UTC");
	// Team creation state
	const [teamName, setTeamName] = useState("");
	const [teamDept, setTeamDept] = useState("");
	const [teamSiteId, setTeamSiteId] = useState("");
	// Enterprise application state
	const [entCompany, setEntCompany] = useState("");
	const [entContact, setEntContact] = useState("");
	const [entEmail, setEntEmail] = useState("");
	const [entTeamSize, setEntTeamSize] = useState("");
	const [entMessage, setEntMessage] = useState("");
	const [formNotice, setFormNotice] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	const handleCreateSite = useCallback(async () => {
		if (!activeOrgId || !siteName.trim()) return;
		try {
			await createSiteMut({
				variables: {
					input: {
						organizationId: activeOrgId,
						name: siteName.trim(),
						regionCode: siteRegion.trim() || "GB",
						timezone: siteTz.trim() || "UTC",
					},
				},
			});
			setSiteName("");
			setSiteRegion("");
			setSiteTz("UTC");
			await refetchDetails();
		} catch (e: any) {
			setFormNotice({ type: "error", text: e.message });
		}
	}, [activeOrgId, createSiteMut, refetchDetails, siteName, siteRegion, siteTz]);

	const handleCreateTeam = useCallback(async () => {
		if (!activeOrgId || !teamName.trim() || !teamSiteId.trim()) return;
		try {
			await createTeamMut({
				variables: {
					input: {
						organizationId: activeOrgId,
						siteId: teamSiteId.trim(),
						name: teamName.trim(),
						departmentName: teamDept.trim() || undefined,
					},
				},
			});
			setTeamName("");
			setTeamDept("");
			setTeamSiteId("");
			await refetchDetails();
		} catch (e: any) {
			setFormNotice({ type: "error", text: e.message });
		}
	}, [activeOrgId, createTeamMut, refetchDetails, teamDept, teamName, teamSiteId]);

	const handleApplyEnterprise = useCallback(async () => {
		setFormNotice(null);

		const trimmedCompany = entCompany.trim();
		const trimmedContact = entContact.trim();
		const trimmedEmail = entEmail.trim();
		const trimmedMessage = entMessage.trim();

		if (!trimmedCompany || !trimmedContact || !trimmedEmail || !trimmedMessage) {
			setFormNotice({ type: "error", text: "Please complete all required fields." });
			return;
		}

		try {
			const res = await applyEnterprise({
				variables: {
					input: {
						companyName: trimmedCompany,
						contactName: trimmedContact,
						email: trimmedEmail,
						teamSize: entTeamSize.trim() || null,
						message: trimmedMessage,
					},
				},
			});
			if (res.data?.applyForEnterprise?.success) {
				setFormNotice({ type: "success", text: res.data.applyForEnterprise.message });
				setEntCompany("");
				setEntContact("");
				setEntEmail("");
				setEntTeamSize("");
				setEntMessage("");
			} else {
				setFormNotice({
					type: "error",
					text: res.data?.applyForEnterprise?.message ?? "Failed to submit application.",
				});
			}
		} catch (e: any) {
			setFormNotice({ type: "error", text: e.message ?? "An unexpected error occurred." });
		}
	}, [applyEnterprise, entCompany, entContact, entEmail, entMessage, entTeamSize]);

	const handleSignOut = useCallback(async () => {
		await signOut();
		navigateToDesktopScreen("landing");
	}, [signOut]);

	const s = useMemo(
		() =>
			StyleSheet.create({
				root: { flex: 1, flexDirection: "row", backgroundColor: T.bg },
				sidebar: {
					width: isWide ? 240 : 200,
					backgroundColor: T.surface,
					borderRightWidth: 1,
					borderRightColor: T.outline,
					paddingTop: 24,
					paddingBottom: 24,
				},
				brand: {
					paddingHorizontal: 20,
					paddingBottom: 24,
					borderBottomWidth: 1,
					borderBottomColor: T.outline,
					marginBottom: 8,
				},
				brandText: {
					fontSize: 20,
					fontWeight: "900",
					letterSpacing: -1,
					color: T.primary,
					textTransform: "uppercase",
				},
				brandSub: {
					fontSize: 10,
					fontWeight: "700",
					letterSpacing: 1.5,
					textTransform: "uppercase",
					color: T.textMuted,
					marginTop: 2,
				},
				navItem: {
					flexDirection: "row",
					alignItems: "center",
					gap: 10,
					paddingHorizontal: 20,
					paddingVertical: 12,
				},
				navItemActive: { backgroundColor: T.surfaceMuted },
				navLabel: {
					fontSize: 12,
					fontWeight: "700",
					letterSpacing: 0.8,
					textTransform: "uppercase",
					color: T.textDim,
				},
				navLabelActive: { color: T.primary },
				signOutBtn: {
					marginTop: "auto",
					paddingHorizontal: 20,
					paddingVertical: 12,
					flexDirection: "row",
					alignItems: "center",
					gap: 10,
				},
				main: { flex: 1 },
				scrollContent: { padding: isWide ? 40 : 24, paddingBottom: 80 },
				panelTitle: {
					fontSize: 28,
					fontWeight: "900",
					color: T.text,
					letterSpacing: -1,
					marginBottom: 24,
				},
				card: {
					backgroundColor: T.surface,
					borderWidth: 1,
					borderColor: T.outline,
					padding: 20,
					marginBottom: 16,
					gap: 12,
				},
				cardTitle: {
					fontSize: 14,
					fontWeight: "800",
					letterSpacing: 0.8,
					textTransform: "uppercase",
					color: T.primary,
				},
				label: {
					fontSize: 11,
					fontWeight: "700",
					letterSpacing: 1,
					textTransform: "uppercase",
					color: T.textMuted,
				},
				value: { fontSize: 15, fontWeight: "700", color: T.text },
				row: { flexDirection: "row", gap: 24, flexWrap: "wrap" },
				field: { gap: 4, minWidth: 140 },
				input: {
					height: 40,
					paddingHorizontal: 12,
					backgroundColor: T.surfaceHigh,
					color: T.text,
					borderBottomWidth: 2,
					borderBottomColor: T.outline,
					fontSize: 13,
					fontWeight: "700",
				},
				inputWide: { flex: 1, minWidth: 200 },
				actionBtn: {
					alignSelf: "flex-start",
					backgroundColor: T.primary,
					paddingHorizontal: 16,
					paddingVertical: 10,
				},
				actionBtnText: {
					fontSize: 11,
					fontWeight: "900",
					letterSpacing: 1,
					textTransform: "uppercase",
					color: T.primaryDeep,
				},
				actionBtnDisabled: { opacity: 0.5 },
				listItem: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingVertical: 8,
					borderBottomWidth: 1,
					borderBottomColor: T.outline,
				},
				listName: { fontSize: 14, fontWeight: "700", color: T.text },
				listMeta: { fontSize: 11, fontWeight: "700", color: T.textMuted },
				auditRow: {
					paddingVertical: 8,
					borderBottomWidth: 1,
					borderBottomColor: T.outline,
					gap: 2,
				},
				auditAction: {
					fontSize: 12,
					fontWeight: "800",
					letterSpacing: 0.5,
					textTransform: "uppercase",
					color: T.secondary,
				},
				auditMeta: { fontSize: 11, fontWeight: "700", color: T.textMuted },
				notice: { fontSize: 13, fontWeight: "700" },
				noticeSuccess: { color: T.success },
				noticeError: { color: T.error },
				badge: {
					paddingHorizontal: 8,
					paddingVertical: 3,
					backgroundColor: "rgba(190,157,255,0.16)",
					alignSelf: "flex-start",
				},
				badgeText: {
					fontSize: 10,
					fontWeight: "800",
					letterSpacing: 1,
					textTransform: "uppercase",
					color: T.primary,
				},
				textArea: {
					minHeight: 100,
					paddingHorizontal: 12,
					paddingVertical: 10,
					backgroundColor: T.surfaceHigh,
					color: T.text,
					borderBottomWidth: 2,
					borderBottomColor: T.outline,
					fontSize: 13,
					fontWeight: "700",
					textAlignVertical: "top",
				},
				loadingWrap: {
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
				},
			}),
		[isWide],
	);

	if (orgLoading || detailsLoading) {
		return (
			<View style={[s.root, s.loadingWrap]}>
				<ActivityIndicator color={T.primary} size="large" />
			</View>
		);
	}

	const renderProfile = () => (
		<>
			<Text style={s.panelTitle}>Organisation Profile</Text>
			<View style={s.card}>
				<Text style={s.cardTitle}>Details</Text>
				<View style={s.row}>
					<View style={s.field}>
						<Text style={s.label}>Name</Text>
						<Text style={s.value}>{org?.name ?? "—"}</Text>
					</View>
					<View style={s.field}>
						<Text style={s.label}>Type</Text>
						<Text style={s.value}>{org?.type ?? "—"}</Text>
					</View>
					<View style={s.field}>
						<Text style={s.label}>Billing Tier</Text>
						<View style={s.badge}>
							<Text style={s.badgeText}>
								{org?.billingTier ?? "FREE"}
							</Text>
						</View>
					</View>
					<View style={s.field}>
						<Text style={s.label}>Status</Text>
						<Text style={s.value}>
							{org?.isActive ? "Active" : "Inactive"}
						</Text>
					</View>
				</View>
			</View>
		</>
	);

	const renderSites = () => (
		<>
			<Text style={s.panelTitle}>Sites & Teams</Text>
			<View style={s.card}>
				<Text style={s.cardTitle}>Sites ({sites.length})</Text>
				{sites.map((site: any) => (
					<View key={site.id} style={s.listItem}>
						<Text style={s.listName}>{site.name}</Text>
						<Text style={s.listMeta}>
							{site.regionCode} · {site.timezone}
						</Text>
					</View>
				))}
				<Text style={[s.label, { marginTop: 12 }]}>Create Site</Text>
				<View style={[s.row, { gap: 8 }]}>
					<TextInput
						style={[s.input, s.inputWide]}
						value={siteName}
						onChangeText={setSiteName}
						placeholder="Site Name *"
						placeholderTextColor={T.textMuted}
					/>
					<TextInput
						style={[s.input, { width: 80 }]}
						value={siteRegion}
						onChangeText={setSiteRegion}
						placeholder="Region"
						placeholderTextColor={T.textMuted}
					/>
					<TextInput
						style={[s.input, { width: 120 }]}
						value={siteTz}
						onChangeText={setSiteTz}
						placeholder="Timezone"
						placeholderTextColor={T.textMuted}
					/>
				</View>
				<Pressable style={s.actionBtn} onPress={() => void handleCreateSite()}>
					<Text style={s.actionBtnText}>Add Site</Text>
				</Pressable>
			</View>
			<View style={s.card}>
				<Text style={s.cardTitle}>Teams ({teams.length})</Text>
				{teams.map((team: any) => (
					<View key={team.id} style={s.listItem}>
						<Text style={s.listName}>{team.name}</Text>
						<Text style={s.listMeta}>{team.departmentName ?? "—"}</Text>
					</View>
				))}
				<Text style={[s.label, { marginTop: 12 }]}>Create Team</Text>
				<View style={[s.row, { gap: 8 }]}>
					<TextInput
						style={[s.input, s.inputWide]}
						value={teamName}
						onChangeText={setTeamName}
						placeholder="Team Name *"
						placeholderTextColor={T.textMuted}
					/>
					<TextInput
						style={[s.input, { width: 140 }]}
						value={teamDept}
						onChangeText={setTeamDept}
						placeholder="Department"
						placeholderTextColor={T.textMuted}
					/>
					<TextInput
						style={[s.input, { width: 200 }]}
						value={teamSiteId}
						onChangeText={setTeamSiteId}
						placeholder="Site ID *"
						placeholderTextColor={T.textMuted}
					/>
				</View>
				<Pressable style={s.actionBtn} onPress={() => void handleCreateTeam()}>
					<Text style={s.actionBtnText}>Add Team</Text>
				</Pressable>
			</View>
		</>
	);

	const renderIdentity = () => (
		<>
			<Text style={s.panelTitle}>Identity & Access (SSO)</Text>
			{org?.billingTier !== "ENTERPRISE" ? (
				<View style={s.card}>
					<Text style={s.cardTitle}>SSO Unavailable</Text>
					<Text style={[s.value, { color: T.textDim }]}>
						SSO configuration requires an Enterprise tier.
						Apply via the Enterprise panel to unlock this feature.
					</Text>
				</View>
			) : (
				<View style={s.card}>
					<Text style={s.cardTitle}>SSO Configuration</Text>
					<View style={s.row}>
						<View style={s.field}>
							<Text style={s.label}>Provider</Text>
							<Text style={s.value}>
								{ssoConfig?.provider ?? "Not configured"}
							</Text>
						</View>
						<View style={s.field}>
							<Text style={s.label}>Enforce SSO</Text>
							<Text style={s.value}>
								{ssoConfig?.enforce ? "Yes" : "No"}
							</Text>
						</View>
						<View style={s.field}>
							<Text style={s.label}>Status</Text>
							<View style={s.badge}>
								<Text style={s.badgeText}>
									{ssoConfig?.enabled ? "Enabled" : "Disabled"}
								</Text>
							</View>
						</View>
					</View>
				</View>
			)}
		</>
	);

	const renderAudit = () => (
		<>
			<Text style={s.panelTitle}>Audit Log</Text>
			<View style={s.card}>
				<Text style={s.cardTitle}>
					Recent Events ({auditLogs.length})
				</Text>
				{auditLogs.length === 0 ? (
					<Text style={[s.value, { color: T.textDim }]}>
						No audit events recorded yet.
					</Text>
				) : (
					auditLogs.map((log: any) => (
						<View key={log.id} style={s.auditRow}>
							<Text style={s.auditAction}>{log.action}</Text>
							<Text style={s.auditMeta}>
								{log.resource} · {toLocalDateTime(log.createdAt)}
							</Text>
						</View>
					))
				)}
			</View>
		</>
	);

	const renderEnterprise = () => {
		const tier = org?.billingTier ?? "FREE";
		const isPending = tier === "PENDING_ENTERPRISE";
		const isEnterprise = tier === "ENTERPRISE";

		return (
			<>
				<Text style={s.panelTitle}>Enterprise Access</Text>
				{isEnterprise ? (
					<View style={s.card}>
						<Text style={s.cardTitle}>Enterprise Active</Text>
						<Text style={[s.value, { color: T.success }]}>
							Your organisation has enterprise access.
							SSO and advanced features are unlocked.
						</Text>
					</View>
				) : isPending ? (
					<View style={s.card}>
						<Text style={s.cardTitle}>Application Pending</Text>
						<Text style={[s.value, { color: T.primary }]}>
							Your enterprise application is under review.
							You will be notified once it is approved.
						</Text>
					</View>
				) : (
					<View style={s.card}>
						<Text style={s.cardTitle}>Apply for Enterprise</Text>
						<Text style={[s.label, { marginBottom: 4 }]}>
							Unlock SSO, advanced permissions, and priority support.
						</Text>
						<View style={[s.row, { gap: 8 }]}>
							<TextInput
								style={[s.input, s.inputWide]}
								value={entCompany}
								onChangeText={setEntCompany}
								placeholder="Company Name *"
								placeholderTextColor={T.textMuted}
							/>
							<TextInput
								style={[s.input, s.inputWide]}
								value={entContact}
								onChangeText={setEntContact}
								placeholder="Contact Name *"
								placeholderTextColor={T.textMuted}
							/>
						</View>
						<View style={[s.row, { gap: 8 }]}>
							<TextInput
								style={[s.input, s.inputWide]}
								value={entEmail}
								onChangeText={setEntEmail}
								placeholder="Work Email *"
								placeholderTextColor={T.textMuted}
								autoCapitalize="none"
							/>
							<TextInput
								style={[s.input, { width: 120 }]}
								value={entTeamSize}
								onChangeText={setEntTeamSize}
								placeholder="Team Size"
								placeholderTextColor={T.textMuted}
							/>
						</View>
						<TextInput
							style={s.textArea}
							value={entMessage}
							onChangeText={setEntMessage}
							placeholder="Tell us about your organisation and how you plan to use FreeRota *"
							placeholderTextColor={T.textMuted}
							multiline
						/>
						{formNotice ? (
							<Text
								style={[
									s.notice,
									formNotice.type === "success"
										? s.noticeSuccess
										: s.noticeError,
								]}
							>
								{formNotice.text}
							</Text>
						) : null}
						<Pressable
							style={[
								s.actionBtn,
								applyLoading ? s.actionBtnDisabled : undefined,
							]}
							onPress={() => void handleApplyEnterprise()}
							disabled={applyLoading}
						>
							<Text style={s.actionBtnText}>
								{applyLoading ? "Submitting..." : "Submit Application"}
							</Text>
						</Pressable>
					</View>
				)}
			</>
		);
	};

	const panelContent = () => {
		switch (panel) {
			case "profile":
				return renderProfile();
			case "sites":
				return renderSites();
			case "identity":
				return renderIdentity();
			case "audit":
				return renderAudit();
			case "enterprise":
				return renderEnterprise();
			default:
				return renderProfile();
		}
	};

	return (
		<View style={s.root}>
			<View style={s.sidebar}>
				<View style={s.brand}>
					<Text style={s.brandText}>FreeRota</Text>
					<Text style={s.brandSub}>Admin Portal</Text>
				</View>
				{NAV_ITEMS.map((item) => (
					<Pressable
						key={item.key}
						style={[
							s.navItem,
							panel === item.key ? s.navItemActive : undefined,
						]}
						onPress={() => {
							setFormNotice(null);
							setPanel(item.key);
						}}
					>
						<Ionicons
							name={item.icon}
							size={16}
							color={panel === item.key ? T.primary : T.textDim}
						/>
						<Text
							style={[
								s.navLabel,
								panel === item.key ? s.navLabelActive : undefined,
							]}
						>
							{item.label}
						</Text>
					</Pressable>
				))}
				<Pressable style={s.signOutBtn} onPress={() => void handleSignOut()}>
					<Ionicons name="log-out-outline" size={16} color={T.tertiary} />
					<Text style={[s.navLabel, { color: T.tertiary }]}>Sign Out</Text>
				</Pressable>
			</View>
			<View style={s.main}>
				<ScrollView contentContainerStyle={s.scrollContent}>
					{panelContent()}
				</ScrollView>
			</View>
		</View>
	);
}
