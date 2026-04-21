import { useState, useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, TextInput, Alert, Platform } from "react-native";
import { useQuery, useMutation } from "@apollo/client";
import { useTheme } from "../theme/useTheme";
import {
	MY_ORGANIZATIONS_QUERY,
	ORGANIZATION_DETAILS_QUERY,
	ORGANIZATION_AUDIT_LOGS_QUERY,
	CREATE_SITE_MUTATION,
	CREATE_TEAM_MUTATION,
	ORGANIZATION_SSO_CONFIG_QUERY,
	UPDATE_ORGANIZATION_SSO_CONFIG_MUTATION,
	TEST_SSO_CONNECTION_MUTATION
} from "../graphql/operations";
import { toLocalDateTime } from "../utils/time";

export function EnterpriseAdminScreen() {
	const { theme } = useTheme();
	const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

	// Multi-tenant check
	const { data: orgData, loading: orgLoading } = useQuery(MY_ORGANIZATIONS_QUERY, {
		onCompleted: (data) => {
			if (data?.myOrganizations?.length > 0) {
				setActiveOrgId(data.myOrganizations[0].organizationId);
			}
		}
	});

	// Main queries
	const { data: detailsData, loading: detailsLoading, refetch: refetchDetails } = useQuery(ORGANIZATION_DETAILS_QUERY, {
		variables: { orgId: activeOrgId },
		skip: (!activeOrgId),
		fetchPolicy: "cache-and-network"
	});

	const { data: auditData, refetch: refetchAudit } = useQuery(ORGANIZATION_AUDIT_LOGS_QUERY, {
		variables: { orgId: activeOrgId, limit: 20 },
		skip: (!activeOrgId),
		fetchPolicy: "cache-and-network"
	});

	const { data: ssoData, refetch: refetchSso } = useQuery(ORGANIZATION_SSO_CONFIG_QUERY, {
		variables: { orgId: activeOrgId },
		skip: (!activeOrgId),
		fetchPolicy: "cache-and-network"
	});

	const [createSiteMutation] = useMutation(CREATE_SITE_MUTATION);
	const [createTeamMutation] = useMutation(CREATE_TEAM_MUTATION);
	const [updateSsoMutation] = useMutation(UPDATE_ORGANIZATION_SSO_CONFIG_MUTATION);
	const [testSsoConnection] = useMutation(TEST_SSO_CONNECTION_MUTATION);

	// Form states
	const [siteName, setSiteName] = useState("");
	const [teamName, setTeamName] = useState("");
	const [teamSiteId, setTeamSiteId] = useState("");

	const isCreatingEnabled = Boolean(activeOrgId);

	const handleCreateSite = async () => {
		if (!siteName.trim() || !isCreatingEnabled) return;
		try {
			await createSiteMutation({
				variables: {
					input: {
						organizationId: activeOrgId,
						name: siteName,
						timezone: "UTC"
					}
				}
			});
			setSiteName("");
			refetchDetails();
			refetchAudit();
		} catch (error: any) {
			Alert.alert("Error", error.message);
		}
	};

	const handleCreateTeam = async () => {
		if (!teamName.trim() || !isCreatingEnabled) return;
		try {
			await createTeamMutation({
				variables: {
					input: {
						organizationId: activeOrgId,
						name: teamName,
						siteId: teamSiteId || null
					}
				}
			});
			setTeamName("");
			setTeamSiteId("");
			refetchDetails();
			refetchAudit();
		} catch (error: any) {
			Alert.alert("Error", error.message);
		}
	};

	const handleTestSso = async () => {
		if (!isCreatingEnabled) return;
		try {
			const res = await testSsoConnection({
				variables: { orgId: activeOrgId, mockPayload: '{"idpUserId": "mock-001", "email": "admin@tenant.com", "groups": ["IdP_Managers"]}' }
			});
			Alert.alert("Test Success", res.data.testSsoConnection.message);
			refetchAudit();
		} catch (error: any) {
			Alert.alert("SSO Test Error", error.message);
		}
	};

	const styles = useMemo(() => StyleSheet.create({
		root: {
			flex: 1,
			backgroundColor: theme.colors.background,
			padding: theme.spacing.md
		},
		center: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center"
		},
		title: {
			fontSize: theme.typography.heading,
			fontWeight: "900",
			color: theme.colors.textPrimary,
			textTransform: "uppercase",
			marginBottom: theme.spacing.xl,
			letterSpacing: -1
		},
		section: {
			backgroundColor: theme.colors.surface,
			padding: theme.spacing.lg,
			borderWidth: theme.borderWidth,
			borderColor: theme.colors.border,
			marginBottom: theme.spacing.xl,
			borderRadius: theme.radius.md,
			borderLeftWidth: 4,
			borderLeftColor: theme.colors.accent
		},
		sectionHeader: {
			fontSize: theme.typography.body,
			fontWeight: "800",
			color: theme.colors.textPrimary,
			textTransform: "uppercase",
			marginBottom: theme.spacing.md
		},
		rowText: {
			fontSize: theme.typography.caption,
			color: theme.colors.textSecondary,
			marginBottom: theme.spacing.xs
		},
		inputGroup: {
			flexDirection: "row",
			gap: theme.spacing.sm,
			marginTop: theme.spacing.md
		},
		input: {
			flex: 1,
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.border,
			padding: theme.spacing.sm,
			color: theme.colors.textPrimary,
			fontFamily: Platform.OS === "ios" ? "Courier" : "monospace"
		},
		button: {
			backgroundColor: theme.colors.accent,
			paddingHorizontal: theme.spacing.md,
			justifyContent: "center",
			alignItems: "center"
		},
		buttonText: {
			color: theme.colors.onAccent,
			fontWeight: "900",
			textTransform: "uppercase"
		},
		auditBox: {
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.border,
			padding: theme.spacing.sm,
			marginBottom: theme.spacing.sm
		},
		auditAction: {
			fontWeight: "900",
			color: theme.colors.accent,
			fontSize: theme.typography.caption
		},
		auditMeta: {
			color: theme.colors.textMuted,
			fontSize: theme.typography.tiny,
			marginTop: theme.spacing.xs
		}
	}), [theme]);

	if (orgLoading || detailsLoading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" color={theme.colors.accent} />
			</View>
		);
	}

	if (!activeOrgId && !orgLoading) {
		return (
			<View style={styles.center}>
				<Text style={[styles.title, { textAlign: "center" }]}>No Enterprise Access</Text>
				<Text style={styles.rowText}>Your account is not bound to a multi-tenant organization.</Text>
			</View>
		);
	}

	const org = detailsData?.organization;
	const sites = detailsData?.organizationSites || [];
	const teams = detailsData?.organizationTeams || [];
	const audits = auditData?.organizationAuditLogs || [];

	return (
		<ScrollView style={styles.root}>
			<Text style={styles.title}>Enterprise Admin</Text>

			{org && (
				<View style={styles.section}>
					<Text style={styles.sectionHeader}>Tenant Profile</Text>
					<Text style={styles.rowText}>Name: {org.name}</Text>
					<Text style={styles.rowText}>Tier: {org.billingTier}</Text>
					<Text style={styles.rowText}>Status: {org.isActive ? "Active" : "Suspended"}</Text>
				</View>
			)}

			<View style={[styles.section, { borderLeftColor: "#00FF00" }]}>
				<Text style={styles.sectionHeader}>Site Hierarchy ({sites.length})</Text>
				{sites.map((s: any) => (
					<Text key={s.id} style={styles.rowText}>• {s.name} ({s.timezone})</Text>
				))}
				
				<View style={styles.inputGroup}>
					<TextInput 
						style={styles.input} 
						placeholder="New Site Name..." 
						placeholderTextColor={theme.colors.textMuted}
						value={siteName} 
						onChangeText={setSiteName} 
					/>
					<Pressable style={styles.button} onPress={handleCreateSite}>
						<Text style={styles.buttonText}>Add Site</Text>
					</Pressable>
				</View>
			</View>

			<View style={[styles.section, { borderLeftColor: "#00FF00" }]}>
				<Text style={styles.sectionHeader}>Team Hierarchy ({teams.length})</Text>
				{teams.map((t: any) => (
					<Text key={t.id} style={styles.rowText}>• {t.name} (Site: {t.siteId || 'Global'})</Text>
				))}

				<View style={styles.inputGroup}>
					<TextInput 
						style={styles.input} 
						placeholder="New Team Name..." 
						placeholderTextColor={theme.colors.textMuted}
						value={teamName} 
						onChangeText={setTeamName} 
					/>
					<TextInput 
						style={[styles.input, { flex: 0.5 }]} 
						placeholder="Site ID (opt)" 
						placeholderTextColor={theme.colors.textMuted}
						value={teamSiteId} 
						onChangeText={setTeamSiteId} 
					/>
					<Pressable style={styles.button} onPress={handleCreateTeam}>
						<Text style={styles.buttonText}>Add Team</Text>
					</Pressable>
				</View>
			</View>

			<View style={[styles.section, { borderLeftColor: "#6CC7FF" }]}>
				<Text style={styles.sectionHeader}>Identity & Access (SSO)</Text>
				<Text style={styles.rowText}>Provider: {ssoData?.organizationSsoConfig?.ssoProvider || "None mapped"}</Text>
				<Text style={styles.rowText}>Status: {ssoData?.organizationSsoConfig?.ssoEnabled ? "ENABLED" : "Disabled"}</Text>
				<Text style={styles.rowText}>Enforce strict JIT SSO: {ssoData?.organizationSsoConfig?.ssoEnforce ? "Yes" : "No"}</Text>
				
				<View style={styles.inputGroup}>
					<Pressable 
						style={[styles.button, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border, borderWidth: 1 }]} 
						onPress={handleTestSso}
					>
						<Text style={[styles.buttonText, { color: theme.colors.textPrimary }]}>Send Mock Token</Text>
					</Pressable>
				</View>
			</View>

			<View style={[styles.section, { borderLeftColor: theme.colors.error || "#FF0000" }]}>
				<Text style={styles.sectionHeader}>Compliance & Audit Log</Text>
				{audits.length === 0 ? <Text style={styles.rowText}>No events recorded.</Text> : null}
				
				{audits.map((audit: any) => (
					<View key={audit.id} style={styles.auditBox}>
						<Text style={styles.auditAction}>{audit.action}</Text>
						<Text style={styles.auditMeta}>Actor: {audit.actorId}</Text>
						<Text style={styles.auditMeta}>Resource: {audit.resource} ({audit.resourceId})</Text>
						<Text style={styles.auditMeta}>At: {toLocalDateTime(audit.createdAt)}</Text>
						{audit.metadataString && (
							<Text style={[styles.auditMeta, { color: theme.colors.textPrimary, marginTop: 4 }]}>
								Data: {audit.metadataString}
							</Text>
						)}
					</View>
				))}
			</View>
		</ScrollView>
	);
}
