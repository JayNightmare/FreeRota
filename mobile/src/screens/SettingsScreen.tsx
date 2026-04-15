import { useEffect, useMemo, useState } from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery } from "@apollo/client";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { FormField } from "../components/FormField";
import { ActionButton } from "../components/ActionButton";
import { StateNotice } from "../components/StateNotice";
import {
	CREATE_SHIFT_TYPE_MUTATION,
	CONTACT_SUPPORT_MUTATION,
	DELETE_SHIFT_TYPE_MUTATION,
	ME_QUERY,
	MY_SHIFT_TYPES_QUERY,
	UPDATE_ACCOUNT_MUTATION,
	UPDATE_SHIFT_TYPE_MUTATION,
} from "../graphql/operations";
import { useTheme } from "../theme/useTheme";
import { getAutoContrastTextColor } from "../theme/themes";
import { toUserErrorMessage } from "../utils/errors";

interface ShiftTypeItem {
	id: string;
	name: string;
	color: string;
}

interface MyShiftTypesQuery {
	myShiftTypes: ShiftTypeItem[];
}

interface MeQuery {
	me: {
		id: string;
		uiAccentColor: string | null;
	};
}

type ContactReason =
	| "BUG_REPORT"
	| "FEATURE_REQUEST"
	| "ACCOUNT_LOGIN_PROBLEM"
	| "OTHER";
type ContactUrgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface ContactSupportMutation {
	contactSupport: {
		success: boolean;
		message: string;
		issueCreated: boolean;
		issueNumber: number | null;
		issueUrl: string | null;
	};
}

const SHIFT_TYPE_COLOR_PRESETS = [
	"#1E3A8A",
	"#0F766E",
	"#92400E",
	"#BE123C",
	"#6D28D9",
	"#166534",
	"#334155",
	"#C2410C",
	"#0369A1",
	"#B45309",
	"#0E7490",
	"#4C1D95",
] as const;

const APPARENCE_COLOR_PRESETS = [
	"#142248",
	"#14532D",
	"#0E7490",
	"#7C2D12",
	"#7F1D1D",
	"#4C1D95",
	"#0369A1",
	"#B45309",
	"#BE185D",
	"#1D4ED8",
	"#0F766E",
	"#6D28D9",
] as const;

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

type SettingsCategoryKey = "APPARENCE" | "SHIFT_TYPES" | "CONTACT_SUPPORT";

const CONTACT_REASON_OPTIONS: Array<{
	value: ContactReason;
	label: string;
}> = [
	{ value: "BUG_REPORT", label: "Bug Report" },
	{ value: "FEATURE_REQUEST", label: "Feature Request" },
	{
		value: "ACCOUNT_LOGIN_PROBLEM",
		label: "Account/Login Problem",
	},
	{ value: "OTHER", label: "Other" },
];

const CONTACT_URGENCY_OPTIONS: Array<{
	value: ContactUrgency;
	label: string;
}> = [
	{ value: "LOW", label: "Low" },
	{ value: "MEDIUM", label: "Medium" },
	{ value: "HIGH", label: "High" },
	{ value: "CRITICAL", label: "Critical" },
];

const SETTINGS_CATEGORIES: Array<{
	key: SettingsCategoryKey;
	label: string;
	description: string;
}> = [
	{
		key: "APPARENCE",
		label: "Apparence",
		description: "Theme and UI color personalization",
	},
	{
		key: "SHIFT_TYPES",
		label: "Shift Types",
		description: "Tag names and chip colors",
	},
	{
		key: "CONTACT_SUPPORT",
		label: "Contact Support",
		description: "Send tester feedback and issues",
	},
];

function normalizeHexColor(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}

	if (!HEX_COLOR_REGEX.test(trimmed)) {
		return null;
	}

	if (trimmed.length === 4) {
		return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toUpperCase();
	}

	return trimmed.toUpperCase();
}

function hslToHexColor(
	hue: number,
	saturation: number,
	lightness: number,
): string {
	const safeHue = ((hue % 360) + 360) % 360;
	const safeSaturation = Math.max(0, Math.min(100, saturation)) / 100;
	const safeLightness = Math.max(0, Math.min(100, lightness)) / 100;

	const chroma = (1 - Math.abs(2 * safeLightness - 1)) * safeSaturation;
	const huePrime = safeHue / 60;
	const x = chroma * (1 - Math.abs((huePrime % 2) - 1));

	let redPrime = 0;
	let greenPrime = 0;
	let bluePrime = 0;

	if (huePrime >= 0 && huePrime < 1) {
		redPrime = chroma;
		greenPrime = x;
	} else if (huePrime >= 1 && huePrime < 2) {
		redPrime = x;
		greenPrime = chroma;
	} else if (huePrime >= 2 && huePrime < 3) {
		greenPrime = chroma;
		bluePrime = x;
	} else if (huePrime >= 3 && huePrime < 4) {
		greenPrime = x;
		bluePrime = chroma;
	} else if (huePrime >= 4 && huePrime < 5) {
		redPrime = x;
		bluePrime = chroma;
	} else {
		redPrime = chroma;
		bluePrime = x;
	}

	const match = safeLightness - chroma / 2;
	const red = Math.round((redPrime + match) * 255);
	const green = Math.round((greenPrime + match) * 255);
	const blue = Math.round((bluePrime + match) * 255);

	const toHex = (value: number): string =>
		value.toString(16).padStart(2, "0").toUpperCase();
	return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function randomAccentColor(): string {
	const hue = Math.floor(Math.random() * 360);
	return hslToHexColor(hue, 72, 48);
}

function randomShiftTagColor(): string {
	const index = Math.floor(
		Math.random() * SHIFT_TYPE_COLOR_PRESETS.length,
	);
	return SHIFT_TYPE_COLOR_PRESETS[index];
}

export function SettingsScreen() {
	const { theme } = useTheme();
	const [activeCategory, setActiveCategory] =
		useState<SettingsCategoryKey>("APPARENCE");
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const [editingId, setEditingId] = useState<string | null>(null);
	const [tagName, setTagName] = useState("");
	const [selectedColor, setSelectedColor] = useState<string | null>(null);
	const [customColor, setCustomColor] = useState("");
	const [shiftTypeError, setShiftTypeError] = useState<string | null>(
		null,
	);

	const [customAccentColor, setCustomAccentColor] = useState("");
	const [selectedAccentPreset, setSelectedAccentPreset] = useState<
		string | null
	>(null);
	const [apparenceError, setApparenceError] = useState<string | null>(
		null,
	);

	const [contactTitle, setContactTitle] = useState("");
	const [contactReason, setContactReason] =
		useState<ContactReason>("BUG_REPORT");
	const [contactUrgency, setContactUrgency] =
		useState<ContactUrgency>("MEDIUM");
	const [contactMessage, setContactMessage] = useState("");
	const [contactError, setContactError] = useState<string | null>(null);
	const [contactSuccess, setContactSuccess] = useState<string | null>(
		null,
	);
	const [contactIssueUrl, setContactIssueUrl] = useState<string | null>(
		null,
	);
	const [reasonPickerOpen, setReasonPickerOpen] = useState(false);
	const [urgencyPickerOpen, setUrgencyPickerOpen] = useState(false);

	const {
		data: shiftTypeData,
		loading: shiftTypeLoading,
		error: shiftTypeLoadError,
		refetch: refetchShiftTypes,
	} = useQuery<MyShiftTypesQuery>(MY_SHIFT_TYPES_QUERY);
	const {
		data: meData,
		loading: meLoading,
		error: meError,
		refetch: refetchMe,
	} = useQuery<MeQuery>(ME_QUERY);

	const [createShiftType, { loading: creating }] = useMutation(
		CREATE_SHIFT_TYPE_MUTATION,
	);
	const [updateShiftType, { loading: updating }] = useMutation(
		UPDATE_SHIFT_TYPE_MUTATION,
	);
	const [deleteShiftType] = useMutation(DELETE_SHIFT_TYPE_MUTATION);
	const [updateAccount, { loading: updatingApparence }] = useMutation(
		UPDATE_ACCOUNT_MUTATION,
	);
	const [contactSupport, { loading: submittingContact }] =
		useMutation<ContactSupportMutation>(CONTACT_SUPPORT_MUTATION);

	const shiftTypeMutationLoading = creating || updating;

	useEffect(() => {
		const normalizedAccent = normalizeHexColor(
			meData?.me?.uiAccentColor ?? "",
		);
		if (
			normalizedAccent &&
			APPARENCE_COLOR_PRESETS.includes(
				normalizedAccent as (typeof APPARENCE_COLOR_PRESETS)[number],
			)
		) {
			setSelectedAccentPreset(normalizedAccent);
			setCustomAccentColor("");
			return;
		}

		setSelectedAccentPreset(null);
		setCustomAccentColor(normalizedAccent ?? "");
	}, [meData?.me?.uiAccentColor]);

	const previewAccentColor = normalizeHexColor(
		customAccentColor.trim() || selectedAccentPreset || "",
	);
	const previewAccentTextColor = previewAccentColor
		? getAutoContrastTextColor(previewAccentColor)
		: theme.colors.onAccent;

	const activeCategoryMeta = SETTINGS_CATEGORIES.find(
		(item) => item.key === activeCategory,
	);

	const styles = useMemo(
		() =>
			StyleSheet.create({
				screenContent: {
					flex: 1,
					gap: theme.spacing.md,
				},
				scrollArea: {
					flex: 1,
				},
				container: {
					gap: theme.spacing.lg,
				},
				section: {
					gap: theme.spacing.md,
				},
				sectionKicker: {
					fontSize: theme.typography.tiny,
					fontWeight: "800",
					letterSpacing: 0.7,
					textTransform: "uppercase",
					color: theme.colors.textMuted,
				},
				sectionTitle: {
					fontSize: theme.typography.body,
					fontWeight: "800",
					color: theme.colors.textPrimary,
				},
				sectionDivider: {
					height: 1,
					backgroundColor: theme.colors.border,
					marginVertical: theme.spacing.sm,
				},
				subsectionTitle: {
					fontSize: theme.typography.caption,
					fontWeight: "800",
					color: theme.colors.textSecondary,
				},
				topBar: {
					flexDirection: "row",
					alignItems: "center",
					gap: theme.spacing.md,
				},
				hamburgerButton: {
					width: 44,
					height: 44,
					borderRadius: theme.radius.md,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: theme.colors.surface,
					borderWidth: 1,
					borderColor: theme.colors.border,
				},
				topBarCopy: {
					flex: 1,
					gap: theme.spacing.xs,
				},
				topBarTitle: {
					fontSize: theme.typography.heading,
					fontWeight: "800",
					color: theme.colors.textPrimary,
				},
				topBarSubtitle: {
					fontSize: theme.typography.caption,
					color: theme.colors.textMuted,
				},
				sidebarBackdrop: {
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: "rgba(0, 0, 0, 0.26)",
					zIndex: 20,
				},
				sidebarPanel: {
					width: 248,
					height: "100%",
					backgroundColor: theme.colors.surface,
					borderRightWidth: 1,
					borderColor: theme.colors.border,
					paddingHorizontal: theme.spacing.md,
					paddingVertical: theme.spacing.xl,
					gap: theme.spacing.sm,
				},
				sidebarHeading: {
					fontSize: theme.typography.caption,
					fontWeight: "800",
					color: theme.colors.textSecondary,
					marginBottom: theme.spacing.xs,
				},
				sidebarItem: {
					paddingHorizontal: theme.spacing.md,
					paddingVertical: theme.spacing.sm,
					borderRadius: theme.radius.md,
					borderWidth: 1,
					borderColor: theme.colors.border,
					backgroundColor:
						theme.colors.surfaceElevated,
					gap: theme.spacing.xs,
				},
				sidebarItemActive: {
					backgroundColor:
						theme.colors.accentBackground,
					borderColor: theme.colors.accent,
				},
				sidebarItemLabel: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					color: theme.colors.textPrimary,
				},
				sidebarItemMeta: {
					fontSize: theme.typography.tiny,
					color: theme.colors.textMuted,
				},
				subtitle: {
					fontSize: theme.typography.caption,
					color: theme.colors.textMuted,
				},
				label: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
					color: theme.colors.textSecondary,
				},
				pickerTrigger: {
					borderWidth: theme.borderWidth,
					borderRadius: theme.radius.md,
					borderColor: theme.colors.border,
					backgroundColor:
						theme.colors.surfaceElevated,
					paddingHorizontal: theme.spacing.md,
					paddingVertical: theme.spacing.sm,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					gap: theme.spacing.sm,
				},
				pickerTriggerValue: {
					fontSize: theme.typography.body,
					fontWeight: "600",
					color: theme.colors.textPrimary,
					flex: 1,
				},
				dropdownContainer: {
					marginTop: theme.spacing.xs,
					borderWidth: theme.borderWidth,
					borderRadius: theme.radius.md,
					borderColor: theme.colors.border,
					backgroundColor:
						theme.colors.surfaceElevated,
					overflow: "hidden",
				},
				dropdownOption: {
					paddingHorizontal: theme.spacing.md,
					paddingVertical: theme.spacing.sm,
				},
				dropdownOptionActive: {
					backgroundColor:
						theme.colors.accentBackground,
				},
				dropdownOptionText: {
					fontSize: theme.typography.body,
					fontWeight: "600",
					color: theme.colors.textPrimary,
				},
				messageInput: {
					borderWidth: theme.borderWidth,
					borderRadius: theme.radius.md,
					borderColor: theme.colors.border,
					backgroundColor:
						theme.colors.surfaceElevated,
					paddingHorizontal: theme.spacing.md,
					paddingVertical: theme.spacing.sm,
					fontSize: theme.typography.body,
					color: theme.colors.textPrimary,
					minHeight: 120,
					textAlignVertical: "top",
				},
				helpText: {
					fontSize: theme.typography.tiny,
					color: theme.colors.textMuted,
				},
				colorGrid: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
				colorChip: {
					width: 34,
					height: 34,
					borderRadius: theme.radius.pill,
					borderWidth: 1,
					borderColor: theme.colors.border,
				},
				colorChipSelected: {
					borderWidth: 3,
					borderColor: theme.colors.textPrimary,
				},
				row: {
					flexDirection: "row",
					gap: theme.spacing.sm,
					flexWrap: "wrap",
				},
				accentPreview: {
					paddingHorizontal: theme.spacing.md,
					paddingVertical: theme.spacing.sm,
					borderRadius: theme.radius.md,
					alignSelf: "flex-start",
					borderWidth: 1,
					borderColor: theme.colors.border,
				},
				accentPreviewText: {
					fontSize: theme.typography.caption,
					fontWeight: "700",
				},
				shiftRow: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					gap: theme.spacing.md,
					borderWidth: 1,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.md,
					padding: theme.spacing.md,
					backgroundColor:
						theme.colors.surfaceElevated,
				},
				shiftInfo: {
					flexDirection: "row",
					alignItems: "center",
					gap: theme.spacing.sm,
					flex: 1,
				},
				swatch: {
					width: 18,
					height: 18,
					borderRadius: theme.radius.sm,
				},
				shiftName: {
					fontSize: theme.typography.body,
					fontWeight: "700",
					color: theme.colors.textPrimary,
				},
			}),
		[theme],
	);

	const resetShiftTypeForm = () => {
		setEditingId(null);
		setTagName("");
		setSelectedColor(null);
		setCustomColor("");
		setShiftTypeError(null);
	};

	const saveShiftType = async () => {
		setShiftTypeError(null);
		if (!tagName.trim()) {
			setShiftTypeError("Tag name is required.");
			return;
		}

		const colorInput = customColor.trim() || selectedColor;

		try {
			if (editingId) {
				await updateShiftType({
					variables: {
						id: editingId,
						input: {
							name: tagName.trim(),
							color: colorInput,
						},
					},
				});
			} else {
				await createShiftType({
					variables: {
						input: {
							name: tagName.trim(),
							color: colorInput,
						},
					},
				});
			}
			resetShiftTypeForm();
			await refetchShiftTypes();
		} catch (mutationError) {
			setShiftTypeError(
				toUserErrorMessage(
					mutationError,
					"Unable to save shift type.",
				),
			);
		}
	};

	const editShiftType = (item: ShiftTypeItem) => {
		setEditingId(item.id);
		setTagName(item.name);
		setSelectedColor(item.color);
		setCustomColor(item.color);
		setShiftTypeError(null);
	};

	const removeShiftType = async (id: string) => {
		setShiftTypeError(null);
		try {
			await deleteShiftType({ variables: { id } });
			if (editingId === id) {
				resetShiftTypeForm();
			}
			await refetchShiftTypes();
		} catch (mutationError) {
			setShiftTypeError(
				toUserErrorMessage(
					mutationError,
					"Unable to delete shift type.",
				),
			);
		}
	};

	const saveApparence = async () => {
		setApparenceError(null);

		const accentInputValue =
			customAccentColor.trim() || selectedAccentPreset || "";
		const normalizedAccentColor =
			normalizeHexColor(accentInputValue);

		if (accentInputValue && !normalizedAccentColor) {
			setApparenceError(
				"UI accent color must be a valid hex value like #1E3A8A.",
			);
			return;
		}

		try {
			await updateAccount({
				variables: {
					input: {
						uiAccentColor:
							normalizedAccentColor,
					},
				},
			});
			await refetchMe();
		} catch (mutationError) {
			setApparenceError(
				toUserErrorMessage(
					mutationError,
					"Unable to save apparence settings.",
				),
			);
		}
	};

	const selectedReasonLabel =
		CONTACT_REASON_OPTIONS.find(
			(option) => option.value === contactReason,
		)?.label ?? "Bug Report";
	const selectedUrgencyLabel =
		CONTACT_URGENCY_OPTIONS.find(
			(option) => option.value === contactUrgency,
		)?.label ?? "Medium";

	const submitContactSupport = async () => {
		setContactError(null);
		setContactSuccess(null);
		setContactIssueUrl(null);

		const trimmedTitle = contactTitle.trim();
		const trimmedMessage = contactMessage.trim();

		if (trimmedTitle.length < 3) {
			setContactError("Title must be at least 3 characters.");
			return;
		}

		if (trimmedMessage.length < 10) {
			setContactError(
				"Message must be at least 10 characters.",
			);
			return;
		}

		try {
			const result = await contactSupport({
				variables: {
					input: {
						title: trimmedTitle,
						reason: contactReason,
						urgency: contactUrgency,
						message: trimmedMessage,
					},
				},
			});

			const response = result.data?.contactSupport;
			if (!response?.success) {
				setContactError(
					response?.message ??
						"Unable to send message. Please try again.",
				);
				return;
			}

			setContactSuccess(response.message);
			setContactIssueUrl(response.issueUrl ?? null);
			setContactTitle("");
			setContactMessage("");
			setContactReason("BUG_REPORT");
			setContactUrgency("MEDIUM");
			setReasonPickerOpen(false);
			setUrgencyPickerOpen(false);
		} catch (mutationError) {
			setContactError(
				toUserErrorMessage(
					mutationError,
					"Unable to send message. Please try again.",
				),
			);
		}
	};

	const renderSidebar = () => {
		if (!sidebarOpen) {
			return null;
		}

		return (
			<Pressable
				style={styles.sidebarBackdrop}
				onPress={() => setSidebarOpen(false)}
			>
				<Pressable
					style={styles.sidebarPanel}
					onPress={() => {
						// Keep panel open when pressing inside.
					}}
				>
					<Text style={styles.sidebarHeading}>
						Settings Categories
					</Text>
					{SETTINGS_CATEGORIES.map((category) => {
						const isActive =
							category.key ===
							activeCategory;
						return (
							<Pressable
								key={
									category.key
								}
								onPress={() => {
									setActiveCategory(
										category.key,
									);
									setSidebarOpen(
										false,
									);
								}}
								style={[
									styles.sidebarItem,
									isActive
										? styles.sidebarItemActive
										: undefined,
								]}
							>
								<Text
									style={
										styles.sidebarItemLabel
									}
								>
									{
										category.label
									}
								</Text>
								<Text
									style={
										styles.sidebarItemMeta
									}
								>
									{
										category.description
									}
								</Text>
							</Pressable>
						);
					})}
				</Pressable>
			</Pressable>
		);
	};

	const renderApparenceCategory = () => (
		<View style={styles.section}>
			<Text style={styles.sectionKicker}>Apparence</Text>
			<Text style={styles.sectionTitle}>UI Colors</Text>
			<Text style={styles.subtitle}>
				Personalize app accent colors. Text contrast is
				handled automatically.
			</Text>
			{meLoading ? (
				<StateNotice
					mode="loading"
					message="Loading apparence settings..."
				/>
			) : null}
			{meError ? (
				<StateNotice
					mode="error"
					message={toUserErrorMessage(
						meError,
						"Unable to load apparence settings.",
					)}
				/>
			) : null}

			<Text style={styles.label}>UI Accent Color</Text>
			<FormField
				label="Accent Color (hex)"
				value={customAccentColor}
				onChangeText={(text) => {
					setCustomAccentColor(text);
					if (text.trim()) {
						setSelectedAccentPreset(null);
					}
				}}
				autoCapitalize="none"
				placeholder="#2D5BFF"
			/>
			<View style={styles.colorGrid}>
				{APPARENCE_COLOR_PRESETS.map((color) => {
					const isSelected =
						selectedAccentPreset ===
							color &&
						!customAccentColor.trim();
					return (
						<Pressable
							key={color}
							onPress={() => {
								setSelectedAccentPreset(
									color,
								);
								setCustomAccentColor(
									"",
								);
							}}
							style={[
								styles.colorChip,
								{
									backgroundColor:
										color,
								},
								isSelected
									? styles.colorChipSelected
									: undefined,
							]}
						/>
					);
				})}
			</View>
			<View style={styles.row}>
				<ActionButton
					label="Randomize Accent"
					onPress={() => {
						setCustomAccentColor(
							randomAccentColor(),
						);
						setSelectedAccentPreset(null);
					}}
					variant="muted"
				/>
				<ActionButton
					label="Use Theme Default"
					onPress={() => {
						setCustomAccentColor("");
						setSelectedAccentPreset(null);
					}}
					variant="muted"
				/>
			</View>
			{previewAccentColor ? (
				<View
					style={[
						styles.accentPreview,
						{
							backgroundColor:
								previewAccentColor,
						},
					]}
				>
					<Text
						style={[
							styles.accentPreviewText,
							{
								color: previewAccentTextColor,
							},
						]}
					>
						Accent preview
					</Text>
				</View>
			) : null}
			<Text style={styles.helpText}>
				Changes apply globally after saving.
			</Text>
			{apparenceError ? (
				<StateNotice
					mode="error"
					message={apparenceError}
				/>
			) : null}
			<ActionButton
				label="Save Apparence"
				onPress={() => void saveApparence()}
				loading={updatingApparence}
			/>
			<View style={styles.sectionDivider} />
		</View>
	);

	const renderShiftTypeCategory = () => (
		<View style={styles.section}>
			<Text style={styles.sectionKicker}>Shift Types</Text>
			<Text style={styles.sectionTitle}>Create Tags</Text>
			<Text style={styles.subtitle}>
				Create tags for your shift chips. Tag name
				becomes the default shift title.
			</Text>
			<FormField
				label="Tag Name"
				value={tagName}
				onChangeText={setTagName}
				placeholder="e.g. Bar Shift"
				autoCapitalize="words"
			/>
			<FormField
				label="Color (hex)"
				value={customColor}
				onChangeText={setCustomColor}
				placeholder="#1E3A8A"
				autoCapitalize="none"
			/>
			<View style={styles.colorGrid}>
				{SHIFT_TYPE_COLOR_PRESETS.map((color) => {
					const isSelected =
						selectedColor === color &&
						!customColor.trim();
					return (
						<Pressable
							key={color}
							onPress={() => {
								setSelectedColor(
									color,
								);
								setCustomColor(
									"",
								);
							}}
							style={[
								styles.colorChip,
								{
									backgroundColor:
										color,
								},
								isSelected
									? styles.colorChipSelected
									: undefined,
							]}
						/>
					);
				})}
			</View>
			<View style={styles.row}>
				<ActionButton
					label={
						editingId
							? "Save Tag"
							: "Add Tag"
					}
					onPress={() => void saveShiftType()}
					loading={shiftTypeMutationLoading}
				/>
				{editingId ? (
					<ActionButton
						label="Cancel"
						onPress={resetShiftTypeForm}
						variant="muted"
					/>
				) : null}
				<ActionButton
					label="Use Random Color"
					onPress={() => {
						const randomColor =
							randomShiftTagColor();
						setSelectedColor(randomColor);
						setCustomColor("");
					}}
					variant="muted"
				/>
			</View>
			{shiftTypeError ? (
				<StateNotice
					mode="error"
					message={shiftTypeError}
				/>
			) : null}

			<View style={styles.sectionDivider} />
			<Text style={styles.subsectionTitle}>
				Existing Tags
			</Text>
			{shiftTypeLoading ? (
				<StateNotice
					mode="loading"
					message="Loading shift types..."
				/>
			) : null}
			{shiftTypeLoadError ? (
				<StateNotice
					mode="error"
					message={toUserErrorMessage(
						shiftTypeLoadError,
						"Unable to load shift types.",
					)}
				/>
			) : null}
			{!shiftTypeLoading &&
			!shiftTypeLoadError &&
			(shiftTypeData?.myShiftTypes?.length ?? 0) === 0 ? (
				<StateNotice
					mode="empty"
					message="No shift tags yet."
				/>
			) : null}
			{shiftTypeData?.myShiftTypes?.map((item) => (
				<View key={item.id} style={styles.shiftRow}>
					<View style={styles.shiftInfo}>
						<View
							style={[
								styles.swatch,
								{
									backgroundColor:
										item.color,
								},
							]}
						/>
						<Text style={styles.shiftName}>
							{item.name}
						</Text>
					</View>
					<View style={styles.row}>
						<ActionButton
							label="Edit"
							variant="muted"
							onPress={() =>
								editShiftType(
									item,
								)
							}
						/>
						<ActionButton
							label="Delete"
							variant="danger"
							onPress={() =>
								void removeShiftType(
									item.id,
								)
							}
						/>
					</View>
				</View>
			))}
		</View>
	);

	const renderContactSupportCategory = () => (
		<View style={styles.section}>
			<Text style={styles.sectionKicker}>Tester Support</Text>
			<Text style={styles.sectionTitle}>Contact Team</Text>
			<Text style={styles.subtitle}>
				Send tester feedback to the team. Critical
				urgency also attempts an automatic GitHub issue.
			</Text>

			<FormField
				label="Title"
				value={contactTitle}
				onChangeText={setContactTitle}
				placeholder="Short summary of your feedback"
				autoCapitalize="sentences"
			/>

			<Text style={styles.label}>Reason</Text>
			<Pressable
				style={styles.pickerTrigger}
				onPress={() => {
					setReasonPickerOpen((value) => !value);
					setUrgencyPickerOpen(false);
				}}
			>
				<Text style={styles.pickerTriggerValue}>
					{selectedReasonLabel}
				</Text>
				<Ionicons
					name={
						reasonPickerOpen
							? "chevron-up"
							: "chevron-down"
					}
					size={18}
					color={theme.colors.textMuted}
				/>
			</Pressable>
			{reasonPickerOpen ? (
				<View style={styles.dropdownContainer}>
					{CONTACT_REASON_OPTIONS.map(
						(option) => {
							const isActive =
								option.value ===
								contactReason;
							return (
								<Pressable
									key={
										option.value
									}
									onPress={() => {
										setContactReason(
											option.value,
										);
										setReasonPickerOpen(
											false,
										);
									}}
									style={[
										styles.dropdownOption,
										isActive
											? styles.dropdownOptionActive
											: undefined,
									]}
								>
									<Text
										style={
											styles.dropdownOptionText
										}
									>
										{
											option.label
										}
									</Text>
								</Pressable>
							);
						},
					)}
				</View>
			) : null}

			<Text style={styles.label}>Urgency</Text>
			<Pressable
				style={styles.pickerTrigger}
				onPress={() => {
					setUrgencyPickerOpen((value) => !value);
					setReasonPickerOpen(false);
				}}
			>
				<Text style={styles.pickerTriggerValue}>
					{selectedUrgencyLabel}
				</Text>
				<Ionicons
					name={
						urgencyPickerOpen
							? "chevron-up"
							: "chevron-down"
					}
					size={18}
					color={theme.colors.textMuted}
				/>
			</Pressable>
			{urgencyPickerOpen ? (
				<View style={styles.dropdownContainer}>
					{CONTACT_URGENCY_OPTIONS.map(
						(option) => {
							const isActive =
								option.value ===
								contactUrgency;
							return (
								<Pressable
									key={
										option.value
									}
									onPress={() => {
										setContactUrgency(
											option.value,
										);
										setUrgencyPickerOpen(
											false,
										);
									}}
									style={[
										styles.dropdownOption,
										isActive
											? styles.dropdownOptionActive
											: undefined,
									]}
								>
									<Text
										style={
											styles.dropdownOptionText
										}
									>
										{
											option.label
										}
									</Text>
								</Pressable>
							);
						},
					)}
				</View>
			) : null}

			<Text style={styles.label}>Message</Text>
			<TextInput
				style={styles.messageInput}
				value={contactMessage}
				onChangeText={setContactMessage}
				multiline
				numberOfLines={6}
				placeholder="Share details, expected behaviour, and what happened."
				placeholderTextColor={theme.colors.textMuted}
			/>

			<Text style={styles.helpText}>
				Every message goes to Discord. Critical urgency
				also triggers GitHub issue escalation.
			</Text>
			{contactError ? (
				<StateNotice
					mode="error"
					message={contactError}
				/>
			) : null}
			{contactSuccess ? (
				<StateNotice
					mode="empty"
					message={contactSuccess}
				/>
			) : null}
			{contactIssueUrl ? (
				<Text style={styles.helpText}>
					Escalation issue: {contactIssueUrl}
				</Text>
			) : null}
			<ActionButton
				label="Send Message"
				onPress={() => void submitContactSupport()}
				loading={submittingContact}
			/>
		</View>
	);

	return (
		<ScreenScaffold>
			{renderSidebar()}
			<View style={styles.screenContent}>
				<View style={styles.topBar}>
					<Pressable
						style={styles.hamburgerButton}
						onPress={() =>
							setSidebarOpen(true)
						}
					>
						<Ionicons
							name="menu"
							size={22}
							color={
								theme.colors
									.textPrimary
							}
						/>
					</Pressable>
					<View style={styles.topBarCopy}>
						<Text
							style={
								styles.topBarTitle
							}
						>
							Settings
						</Text>
						<Text
							style={
								styles.topBarSubtitle
							}
						>
							{
								activeCategoryMeta?.label
							}
						</Text>
					</View>
				</View>

				<ScrollView
					style={styles.scrollArea}
					contentContainerStyle={styles.container}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="on-drag"
				>
					{activeCategory === "APPARENCE"
						? renderApparenceCategory()
						: null}
					{activeCategory === "SHIFT_TYPES"
						? renderShiftTypeCategory()
						: null}
					{activeCategory === "CONTACT_SUPPORT"
						? renderContactSupportCategory()
						: null}
				</ScrollView>
			</View>
		</ScreenScaffold>
	);
}
