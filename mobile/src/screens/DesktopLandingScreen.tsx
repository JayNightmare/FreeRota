import { useCallback, useEffect, useMemo, useRef } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
	Animated,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
	useWindowDimensions,
} from "react-native";
import { HeaderNavBar } from "../components/desktop/HeaderNavBar";
import * as THREE from "three";
import { navigateToDesktopScreen, navigateWebPath } from "./desktopRoutes";

const TOKENS = {
	background: "#0E0E0E",
	surfaceLow: "#131313",
	surface: "#1A1919",
	surfaceHigh: "#262626",
	surfaceBright: "#2C2C2C",
	text: "#FFFFFF",
	textDim: "#ADAAAA",
	textMuted: "rgba(255, 255, 255, 0.45)",
	primary: "#BE9DFF",
	primaryDeep: "#3D0088",
	secondary: "#C78DF7",
	tertiary: "#FF97B1",
	outline: "rgba(72, 72, 71, 0.35)",
};

const TRUSTED_ORGANIZATIONS = ["BE THE FIRST CLIENT!"];

const FEATURES: Array<{
	title: string;
	accent: string;
	icon: keyof typeof Ionicons.glyphMap;
	description: string;
}> = [
	{
		title: "Sync",
		accent: TOKENS.primary,
		icon: "sync-outline",
		description:
			"Effortlessly import schedules from any major HR platform. One-way or two-way, your time is always current.",
	},
	{
		title: "Privacy",
		accent: TOKENS.tertiary,
		icon: "shield-checkmark-outline",
		description:
			"Granular controls allow you to share only when you're busy or specific shift details. You own your time data.",
	},
	{
		title: "Real-time",
		accent: TOKENS.secondary,
		icon: "pulse-outline",
		description:
			"Push notifications for shift swaps, friend requests, and availability matches as they happen.",
	},
];

const TESTIMONIALS = [
	{
		quote: '"FreeRota completely changed how my friend group plans weekends. No more \"when do you finish?\" texts-we just look at the shared grid and go."',
		author: "Alex Chen",
		role: "Hospitality Worker",
		color: TOKENS.primary,
	},
	{
		quote: '"The API integration was seamless. We synced 500+ employees into our internal dashboard in a single afternoon. Pure efficiency."',
		author: "Sarah Miller",
		role: "HR Manager, Novus Grid",
		color: TOKENS.secondary,
	},
	{
		quote: "\"Privacy was my main concern, but FreeRota's controls are the best I've seen. I share availability with family while keeping shift details private.\"",
		author: "Marcus Thorne",
		role: "Freelance Consultant",
		color: TOKENS.tertiary,
	},
];

const ENTERPRISE_BENEFITS = [
	"SSO & SAML Integration",
	"Custom API Endpoints",
	"Data Residency Compliance",
];

const ENTERPRISE_API_SNIPPET = `{
	"rota": "enterprise_v1",
	"endpoint": "/api/sync",
	"method": "POST",
	"payload": {
		"staff_id": "FR_9921",
		"timezone": "UTC",
		"availability": [
			{"start": "09:00", "end": "17:00"},
			{"start": "21:00", "end": "03:00"}
		]
	}
}`;

const HERO_THREE_STYLES = StyleSheet.create({
	mount: {
		...StyleSheet.absoluteFillObject,
	},
});

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value: number): number {
	const inverse = 1 - value;
	return 1 - inverse * inverse * inverse;
}

function HeroVisualThreeAnimation() {
	const mountRef = useRef<View | null>(null);

	useEffect(() => {
		if (Platform.OS !== "web" || typeof window === "undefined") {
			return;
		}

		const hostElement = mountRef.current as unknown as {
			clientWidth?: number;
			clientHeight?: number;
			appendChild?: (node: unknown) => void;
			removeChild?: (node: unknown) => void;
		};

		if (!hostElement?.appendChild) {
			return;
		}

		const scene = new THREE.Scene();
		const camera = new THREE.OrthographicCamera(
			-1,
			1,
			1,
			-1,
			0.1,
			10,
		);
		camera.position.set(0, 0, 5);

		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
			powerPreference: "high-performance",
		});
		renderer.setClearColor(0x000000, 0);

		const canvas = renderer.domElement as unknown as {
			style?: {
				position?: string;
				inset?: string;
				width?: string;
				height?: string;
				pointerEvents?: string;
				display?: string;
			};
		};

		if (canvas.style) {
			canvas.style.position = "absolute";
			canvas.style.inset = "0";
			canvas.style.width = "100%";
			canvas.style.height = "100%";
			canvas.style.pointerEvents = "none";
			canvas.style.display = "block";
		}

		hostElement.appendChild(renderer.domElement);

		const panelMaterial = new THREE.MeshBasicMaterial({
			color: 0x1a1919,
			transparent: true,
			opacity: 0.58,
		});
		const panel = new THREE.Mesh(
			new THREE.PlaneGeometry(2.48, 1.02),
			panelMaterial,
		);
		panel.position.set(0, 0.02, 0.2);
		scene.add(panel);

		const primaryCircleMaterial = new THREE.MeshBasicMaterial({
			color: 0xbe9dff,
			transparent: true,
			opacity: 0.26,
		});
		const primaryCircle = new THREE.Mesh(
			new THREE.CircleGeometry(0.9, 64),
			primaryCircleMaterial,
		);
		primaryCircle.position.set(-0.2, 0.02, -0.1);
		scene.add(primaryCircle);

		const secondaryCircleMaterial = new THREE.MeshBasicMaterial({
			color: 0xff97b1,
			transparent: true,
			opacity: 0.18,
		});
		const secondaryCircle = new THREE.Mesh(
			new THREE.CircleGeometry(0.74, 64),
			secondaryCircleMaterial,
		);
		secondaryCircle.position.set(0.34, -0.28, -0.08);
		scene.add(secondaryCircle);

		const barConfigs = [
			{ maxWidth: 1.9, y: 0.34, color: 0xbe9dff, delay: 0.0 },
			{
				maxWidth: 1.56,
				y: 0.22,
				color: 0xc78df7,
				delay: 0.32,
			},
			{ maxWidth: 1.1, y: 0.1, color: 0xff97b1, delay: 0.62 },
		];

		const barLeft = -0.94;
		const bars = barConfigs.map((config) => {
			const material = new THREE.MeshBasicMaterial({
				color: config.color,
				transparent: true,
				opacity: 0.9,
			});
			const mesh = new THREE.Mesh(
				new THREE.PlaneGeometry(config.maxWidth, 0.028),
				material,
			);
			mesh.position.set(
				barLeft + config.maxWidth / 2,
				config.y,
				0.5,
			);
			scene.add(mesh);

			const cursorMaterial = new THREE.MeshBasicMaterial({
				color: 0xffffff,
				transparent: true,
				opacity: 0.0,
			});
			const cursor = new THREE.Mesh(
				new THREE.PlaneGeometry(0.018, 0.048),
				cursorMaterial,
			);
			cursor.position.set(barLeft, config.y, 0.52);
			scene.add(cursor);

			return {
				...config,
				mesh,
				material,
				cursor,
				cursorMaterial,
			};
		});

		const boxConfigs = [
			{
				width: 0.54,
				height: 0.1,
				x: -0.72,
				y: -0.22,
				delay: 0.0,
			},
			{
				width: 0.4,
				height: 0.1,
				x: -0.1,
				y: -0.22,
				delay: 0.16,
			},
			{
				width: 0.3,
				height: 0.1,
				x: 0.42,
				y: -0.22,
				delay: 0.28,
			},
			{
				width: 0.38,
				height: 0.1,
				x: -0.48,
				y: -0.38,
				delay: 0.4,
			},
			{
				width: 0.48,
				height: 0.1,
				x: 0.14,
				y: -0.38,
				delay: 0.52,
			},
		];

		const boxes = boxConfigs.map((config, index) => {
			const material = new THREE.MeshBasicMaterial({
				color: index % 2 === 0 ? 0x67008c : 0x4f0046,
				transparent: true,
				opacity: 0.0,
			});
			const mesh = new THREE.Mesh(
				new THREE.PlaneGeometry(
					config.width,
					config.height,
				),
				material,
			);
			mesh.position.set(config.x, config.y - 0.12, 0.45);
			mesh.scale.set(0.9, 0.9, 1);
			scene.add(mesh);
			return {
				...config,
				mesh,
				material,
			};
		});

		const cycleDuration = 6.2;
		const writeDuration = 1.85;
		const holdDuration = 0.9;
		const eraseDuration = 1.5;
		const boxFadeDuration = 0.8;

		const resizeRenderer = () => {
			const nextWidth = Math.max(
				hostElement.clientWidth ?? 0,
				280,
			);
			const nextHeight = Math.max(
				hostElement.clientHeight ?? 0,
				180,
			);
			renderer.setPixelRatio(
				Math.min(window.devicePixelRatio || 1, 2),
			);
			renderer.setSize(nextWidth, nextHeight, false);

			const aspect = nextWidth / nextHeight;
			const halfHeight = aspect < 1.15 ? 1.32 : 1.18;
			const halfWidth = halfHeight * aspect;

			camera.left = -halfWidth;
			camera.right = halfWidth;
			camera.top = halfHeight;
			camera.bottom = -halfHeight;
			camera.updateProjectionMatrix();
		};

		resizeRenderer();

		const timer = new THREE.Timer();
		timer.connect(document);
		let frameId = 0;

		const animate = () => {
			timer.update();
			const elapsed = timer.getElapsed();
			const cycleTime = elapsed % cycleDuration;

			bars.forEach((bar, index) => {
				const localTime =
					(cycleTime + bar.delay) % cycleDuration;
				let progress = 0;

				if (localTime <= writeDuration) {
					progress = easeOutCubic(
						localTime / writeDuration,
					);
				} else if (
					localTime <=
					writeDuration + holdDuration
				) {
					progress = 1;
				} else if (
					localTime <=
					writeDuration +
						holdDuration +
						eraseDuration
				) {
					const eraseProgress =
						(localTime -
							writeDuration -
							holdDuration) /
						eraseDuration;
					progress = 1 - eraseProgress;
				}

				progress = clamp(progress, 0.05, 1);
				bar.mesh.scale.x = progress;
				bar.mesh.position.x =
					barLeft + (bar.maxWidth * progress) / 2;

				const pulse =
					0.75 +
					Math.sin(elapsed * 2.2 + index) * 0.12;
				bar.material.opacity = clamp(pulse, 0.62, 0.96);

				const cursorVisible =
					localTime <= writeDuration + 0.2 &&
					progress < 0.995;
				bar.cursor.position.x =
					barLeft + bar.maxWidth * progress;
				bar.cursorMaterial.opacity = cursorVisible
					? 0.4 + Math.sin(elapsed * 10) * 0.2
					: 0;
			});

			boxes.forEach((box) => {
				const localTime =
					(cycleTime -
						0.65 +
						box.delay +
						cycleDuration) %
					cycleDuration;

				const showProgress = clamp(
					localTime / boxFadeDuration,
					0,
					1,
				);
				const hideWindowStart =
					writeDuration + holdDuration + 0.6;
				const hideProgress = clamp(
					(localTime - hideWindowStart) / 1.15,
					0,
					1,
				);

				const visibility = clamp(
					showProgress - hideProgress,
					0,
					1,
				);

				box.material.opacity = visibility * 0.92;
				box.mesh.position.y =
					box.y - (1 - visibility) * 0.14;
				box.mesh.scale.x = 0.9 + visibility * 0.1;
				box.mesh.scale.y = 0.9 + visibility * 0.1;
			});

			primaryCircle.scale.setScalar(
				1 + Math.sin(elapsed * 0.65) * 0.03,
			);
			primaryCircleMaterial.opacity =
				0.22 + Math.sin(elapsed * 0.8) * 0.05;

			secondaryCircle.scale.setScalar(
				1 + Math.cos(elapsed * 0.72) * 0.035,
			);
			secondaryCircleMaterial.opacity =
				0.14 + Math.cos(elapsed * 0.9) * 0.04;

			renderer.render(scene, camera);
			frameId = window.requestAnimationFrame(animate);
		};

		animate();

		const ResizeObserverConstructor = (
			globalThis as {
				ResizeObserver?: new (callback: () => void) => {
					observe: (target: unknown) => void;
					disconnect: () => void;
				};
			}
		).ResizeObserver;

		let resizeObserver:
			| {
					observe: (target: unknown) => void;
					disconnect: () => void;
			  }
			| undefined;

		if (ResizeObserverConstructor) {
			resizeObserver = new ResizeObserverConstructor(
				resizeRenderer,
			);
			resizeObserver.observe(hostElement);
		} else {
			window.addEventListener("resize", resizeRenderer);
		}

		return () => {
			window.cancelAnimationFrame(frameId);
			timer.disconnect();
			timer.dispose();
			if (resizeObserver) {
				resizeObserver.disconnect();
			} else {
				window.removeEventListener(
					"resize",
					resizeRenderer,
				);
			}

			scene.traverse((node) => {
				const maybeGeometry = node as unknown as {
					geometry?: { dispose: () => void };
					material?:
						| { dispose: () => void }
						| Array<{
								dispose: () => void;
						  }>;
				};

				maybeGeometry.geometry?.dispose?.();
				if (Array.isArray(maybeGeometry.material)) {
					maybeGeometry.material.forEach(
						(material) =>
							material.dispose(),
					);
				} else {
					maybeGeometry.material?.dispose?.();
				}
			});

			renderer.dispose();
			if (hostElement.removeChild) {
				hostElement.removeChild(renderer.domElement);
			}
		};
	}, []);

	return (
		<View
			ref={mountRef}
			pointerEvents="none"
			style={HERO_THREE_STYLES.mount}
		/>
	);
}

export function DesktopLandingScreen() {
	const { width } = useWindowDimensions();
	const isDesktop = width >= 1024;
	const isTablet = width >= 760;
	const canUseThreeHero = Platform.OS === "web";

	const heroAnim = useRef(new Animated.Value(0)).current;
	const bodyAnim = useRef(new Animated.Value(0)).current;
	const featureAnims = useRef(
		FEATURES.map(() => new Animated.Value(0)),
	).current;

	const handlePlatformPress = useCallback(() => {
		navigateToDesktopScreen("platform");
	}, []);

	const handleSolutionsPress = useCallback(() => {
		navigateToDesktopScreen("solutions");
	}, []);

	const handleEnterprisePress = useCallback(() => {
		navigateToDesktopScreen("enterprise");
	}, []);

	const handlePricingPress = useCallback(() => {
		navigateToDesktopScreen("pricing");
	}, []);

	const handleGetStartedPress = useCallback(() => {
		navigateToDesktopScreen("get-started");
	}, []);

	const handleGetAppPress = useCallback(() => {
		navigateWebPath("/");
	}, []);

	const handleEnterpriseInquiryPress = useCallback(() => {
		navigateToDesktopScreen("enterprise-inquiry");
	}, []);

	useEffect(() => {
		heroAnim.setValue(0);
		bodyAnim.setValue(0);
		featureAnims.forEach((value) => value.setValue(0));

		Animated.parallel([
			Animated.timing(heroAnim, {
				toValue: 1,
				duration: 520,
				useNativeDriver: true,
			}),
			Animated.sequence([
				Animated.delay(120),
				Animated.timing(bodyAnim, {
					toValue: 1,
					duration: 450,
					useNativeDriver: true,
				}),
			]),
			Animated.stagger(
				90,
				featureAnims.map((value) =>
					Animated.timing(value, {
						toValue: 1,
						duration: 320,
						useNativeDriver: true,
					}),
				),
			),
		]).start();
	}, [bodyAnim, featureAnims, heroAnim]);

	const styles = useMemo(
		() =>
			StyleSheet.create({
				root: {
					flex: 1,
					backgroundColor: TOKENS.background,
				},
				scrollContent: {
					paddingBottom: 64,
				},
				heroSection: {
					minHeight: isDesktop ? 720 : 620,
					paddingHorizontal: isDesktop ? 48 : 20,
					paddingTop: isDesktop ? 80 : 56,
					paddingBottom: isDesktop ? 100 : 64,
					justifyContent: "center",
				},
				heroGrid: {
					maxWidth: 1220,
					width: "100%",
					alignSelf: "center",
					flexDirection: isTablet
						? "row"
						: "column",
					gap: isDesktop ? 40 : 28,
				},
				heroCopy: {
					flex: 1,
					gap: 18,
					justifyContent: "center",
				},
				heroTitle: {
					fontSize: isDesktop
						? 90
						: isTablet
							? 70
							: 52,
					lineHeight: isDesktop
						? 92
						: isTablet
							? 72
							: 54,
					fontWeight: "900",
					letterSpacing: -3,
					color: TOKENS.text,
				},
				heroSubtitle: {
					maxWidth: 620,
					fontSize: isDesktop ? 24 : 19,
					lineHeight: isDesktop ? 34 : 28,
					fontWeight: "300",
					color: TOKENS.textDim,
				},
				heroActions: {
					flexDirection: "row",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 14,
					paddingTop: 10,
				},
				heroPrimaryButton: {
					backgroundColor: TOKENS.primary,
					paddingHorizontal: 24,
					paddingVertical: 14,
					borderWidth: 2,
					borderColor: "rgba(178, 139, 255, 0.8)",
				},
				heroPrimaryButtonText: {
					fontSize: 14,
					fontWeight: "900",
					letterSpacing: 1,
					textTransform: "uppercase",
					color: TOKENS.primaryDeep,
				},
				heroSecondaryButton: {
					backgroundColor: TOKENS.surfaceHigh,
					paddingHorizontal: 24,
					paddingVertical: 14,
				},
				heroSecondaryButtonText: {
					fontSize: 14,
					fontWeight: "800",
					letterSpacing: 1,
					textTransform: "uppercase",
					color: TOKENS.text,
				},
				heroVisual: {
					flex: 1,
					minHeight: isDesktop ? 520 : 300,
					position: "relative",
					overflow: "hidden",
					justifyContent: "center",
					alignItems: "center",
				},
				heroGlowPrimary: {
					position: "absolute",
					width: isDesktop ? 420 : 290,
					height: isDesktop ? 420 : 290,
					backgroundColor:
						"rgba(190, 157, 255, 0.28)",
					borderRadius: 420,
				},
				heroGlowSecondary: {
					position: "absolute",
					width: isDesktop ? 320 : 220,
					height: isDesktop ? 320 : 220,
					backgroundColor:
						"rgba(255, 151, 177, 0.2)",
					borderRadius: 320,
					transform: [
						{ translateX: 80 },
						{ translateY: 70 },
					],
				},
				heroStroke: {
					width: isDesktop ? 520 : 320,
					height: isDesktop ? 220 : 180,
					backgroundColor:
						"rgba(26, 25, 25, 0.7)",
					paddingHorizontal: 20,
					paddingVertical: 24,
					gap: 16,
				},
				heroStrokeLinePrimary: {
					height: 4,
					width: "86%",
					backgroundColor:
						"rgba(190, 157, 255, 0.8)",
				},
				heroStrokeLineSecondary: {
					height: 4,
					width: "72%",
					backgroundColor:
						"rgba(199, 141, 247, 0.66)",
				},
				heroStrokeLineTertiary: {
					height: 4,
					width: "54%",
					backgroundColor:
						"rgba(255, 151, 177, 0.82)",
				},
				trustedSection: {
					paddingVertical: 40,
					paddingHorizontal: isDesktop ? 48 : 20,
					backgroundColor: "#090909",
					gap: 18,
				},
				trustedTitle: {
					textAlign: "center",
					fontSize: 11,
					fontWeight: "800",
					letterSpacing: 3,
					textTransform: "uppercase",
					color: TOKENS.textMuted,
				},
				trustedRow: {
					alignSelf: "center",
					maxWidth: 1220,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					flexWrap: "wrap",
					gap: isDesktop ? 34 : 20,
				},
				trustedName: {
					fontSize: 20,
					fontWeight: "900",
					letterSpacing: -0.5,
					color: "rgba(255, 255, 255, 0.45)",
				},
				featureSection: {
					paddingHorizontal: isDesktop ? 48 : 20,
					paddingVertical: isDesktop ? 90 : 68,
				},
				featureGrid: {
					maxWidth: 1220,
					width: "100%",
					alignSelf: "center",
					flexDirection: isTablet
						? "row"
						: "column",
					gap: 18,
				},
				featureCard: {
					flex: 1,
					backgroundColor: TOKENS.surfaceLow,
					paddingHorizontal: 20,
					paddingVertical: 24,
					minHeight: 240,
					borderLeftWidth: 4,
					borderLeftColor: TOKENS.primary,
					gap: 12,
				},
				featureHeaderRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: 10,
				},
				featureIconWrap: {
					width: 36,
					height: 36,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor:
						"rgba(255, 255, 255, 0.04)",
				},
				featureTitle: {
					fontSize: 28,
					fontWeight: "800",
					letterSpacing: -0.8,
					color: TOKENS.text,
				},
				featureDescription: {
					fontSize: 15,
					lineHeight: 24,
					fontWeight: "400",
					color: TOKENS.textDim,
				},
				testimonialSection: {
					backgroundColor: "#0A0A0A",
					paddingHorizontal: isDesktop ? 48 : 20,
					paddingVertical: isDesktop ? 90 : 72,
					gap: 30,
				},
				testimonialHeading: {
					textAlign: "center",
					fontSize: isDesktop ? 54 : 40,
					lineHeight: isDesktop ? 58 : 43,
					fontWeight: "900",
					letterSpacing: -1.4,
					color: TOKENS.text,
				},
				testimonialGrid: {
					maxWidth: 1220,
					width: "100%",
					alignSelf: "center",
					flexDirection: isDesktop
						? "row"
						: "column",
					gap: 18,
				},
				testimonialCard: {
					flex: 1,
					backgroundColor: TOKENS.surface,
					padding: 24,
					gap: 16,
					minHeight: 280,
				},
				testimonialQuote: {
					fontSize: 17,
					lineHeight: 30,
					fontWeight: "300",
					fontStyle: "italic",
					color: TOKENS.textDim,
				},
				testimonialAuthor: {
					fontSize: 18,
					fontWeight: "800",
					letterSpacing: -0.3,
				},
				testimonialRole: {
					fontSize: 11,
					fontWeight: "700",
					letterSpacing: 1,
					textTransform: "uppercase",
					color: TOKENS.textMuted,
				},
				enterpriseSection: {
					backgroundColor: TOKENS.surfaceBright,
					paddingHorizontal: isDesktop ? 48 : 20,
					paddingVertical: isDesktop ? 104 : 76,
				},
				enterpriseGrid: {
					maxWidth: 1220,
					width: "100%",
					alignSelf: "center",
					flexDirection: isTablet
						? "row"
						: "column",
					gap: 26,
					alignItems: "stretch",
				},
				enterpriseCopy: {
					flex: 1,
					gap: 18,
				},
				enterpriseTitle: {
					fontSize: isDesktop ? 72 : 48,
					lineHeight: isDesktop ? 74 : 50,
					fontWeight: "900",
					letterSpacing: -2,
					color: TOKENS.text,
				},
				enterpriseDescription: {
					fontSize: 19,
					lineHeight: 30,
					fontWeight: "300",
					color: TOKENS.textDim,
				},
				benefitList: {
					gap: 12,
					paddingTop: 8,
					paddingBottom: 16,
				},
				benefitRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: 10,
				},
				benefitDot: {
					width: 10,
					height: 10,
					backgroundColor: TOKENS.primary,
				},
				benefitText: {
					fontSize: 15,
					fontWeight: "600",
					color: TOKENS.text,
				},
				outlineButton: {
					alignSelf: "flex-start",
					paddingHorizontal: 22,
					paddingVertical: 12,
					borderWidth: 2,
					borderColor: TOKENS.primary,
				},
				outlineButtonText: {
					fontSize: 13,
					fontWeight: "900",
					letterSpacing: 1,
					textTransform: "uppercase",
					color: TOKENS.primary,
				},
				codeCard: {
					flex: 1,
					backgroundColor: TOKENS.background,
					paddingHorizontal: 20,
					paddingVertical: 24,
					borderLeftWidth: 4,
					borderLeftColor: TOKENS.primary,
				},
				codeText: {
					fontSize: 13,
					lineHeight: 20,
					color: "#B28BFF",
				},
				contactSection: {
					paddingHorizontal: isDesktop ? 48 : 20,
					paddingVertical: isDesktop ? 100 : 72,
				},
				contactInner: {
					width: "100%",
					maxWidth: 900,
					alignSelf: "center",
					gap: 18,
				},
				contactTitle: {
					fontSize: isDesktop ? 44 : 34,
					lineHeight: isDesktop ? 48 : 38,
					fontWeight: "800",
					textAlign: "center",
					letterSpacing: -1,
					color: TOKENS.text,
				},
				contactSubtitle: {
					fontSize: 16,
					lineHeight: 24,
					textAlign: "center",
					color: TOKENS.textDim,
				},
				inputGrid: {
					paddingTop: 18,
					flexDirection: isTablet
						? "row"
						: "column",
					flexWrap: "wrap",
					gap: 18,
				},
				fieldWrap: {
					width: isTablet ? "48%" : "100%",
					backgroundColor: TOKENS.surfaceHigh,
					paddingHorizontal: 14,
					paddingVertical: 6,
					borderBottomWidth: 2,
					borderBottomColor: TOKENS.outline,
				},
				fieldWrapWide: {
					width: "100%",
				},
				input: {
					height: 42,
					fontSize: 15,
					color: TOKENS.text,
					padding: 0,
				},
				inputMulti: {
					height: 110,
					textAlignVertical: "top",
					paddingTop: 10,
				},
				sendRow: {
					alignItems: "flex-end",
					paddingTop: 6,
				},
				sendButton: {
					backgroundColor: TOKENS.primary,
					paddingHorizontal: 24,
					paddingVertical: 14,
					borderWidth: 2,
					borderColor:
						"rgba(178, 139, 255, 0.85)",
				},
				sendButtonText: {
					fontSize: 12,
					fontWeight: "900",
					letterSpacing: 1,
					textTransform: "uppercase",
					color: TOKENS.primaryDeep,
				},
				footer: {
					paddingHorizontal: isDesktop ? 48 : 20,
					paddingVertical: 52,
					backgroundColor: TOKENS.background,
					flexDirection: isTablet
						? "row"
						: "column",
					justifyContent: "space-between",
					gap: 22,
				},
				footerBrand: {
					fontSize: 20,
					fontWeight: "900",
					letterSpacing: -0.8,
					textTransform: "uppercase",
					color: TOKENS.primary,
				},
				footerMeta: {
					fontSize: 11,
					fontWeight: "700",
					letterSpacing: 1,
					textTransform: "uppercase",
					color: TOKENS.textMuted,
				},
				footerLinks: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: 20,
				},
				footerLink: {
					fontSize: 11,
					fontWeight: "700",
					letterSpacing: 1,
					textTransform: "uppercase",
					color: TOKENS.textDim,
				},
			}),
		[isDesktop, isTablet],
	);

	const heroContainerStyle = {
		opacity: heroAnim,
		transform: [
			{
				translateY: heroAnim.interpolate({
					inputRange: [0, 1],
					outputRange: [32, 0],
				}),
			},
		],
	};

	const bodyContainerStyle = {
		opacity: bodyAnim,
		transform: [
			{
				translateY: bodyAnim.interpolate({
					inputRange: [0, 1],
					outputRange: [24, 0],
				}),
			},
		],
	};

	return (
		<View style={styles.root}>
			<ScrollView
				style={styles.root}
				contentContainerStyle={styles.scrollContent}
			>
				<HeaderNavBar variant="landing" />

				<Animated.View
					style={[
						styles.heroSection,
						heroContainerStyle,
					]}
				>
					<View style={styles.heroGrid}>
						<View style={styles.heroCopy}>
							<Text
								style={
									styles.heroTitle
								}
							>
								Coordination,
								{"\n"}clarified.
							</Text>
							<Text
								style={
									styles.heroSubtitle
								}
							>
								Share your rota,
								sync with
								friends, and
								find the perfect
								time to connect.
								Built for
								people, adopted
								by enterprises.
							</Text>
							<View
								style={
									styles.heroActions
								}
							>
								<Pressable
									style={
										styles.heroPrimaryButton
									}
									onPress={
										handleGetAppPress
									}
								>
									<Text
										style={
											styles.heroPrimaryButtonText
										}
									>
										Get
										The
										App
									</Text>
								</Pressable>
								<Pressable
									style={
										styles.heroSecondaryButton
									}
									onPress={
										handleEnterpriseInquiryPress
									}
								>
									<Text
										style={
											styles.heroSecondaryButtonText
										}
									>
										Enterprise
										Inquiry
									</Text>
								</Pressable>
							</View>
						</View>
						<View style={styles.heroVisual}>
							{canUseThreeHero ? (
								<HeroVisualThreeAnimation />
							) : (
								<>
									<View
										style={
											styles.heroGlowPrimary
										}
									/>
									<View
										style={
											styles.heroGlowSecondary
										}
									/>
									<View
										style={
											styles.heroStroke
										}
									>
										<View
											style={
												styles.heroStrokeLinePrimary
											}
										/>
										<View
											style={
												styles.heroStrokeLineSecondary
											}
										/>
										<View
											style={
												styles.heroStrokeLineTertiary
											}
										/>
									</View>
								</>
							)}
						</View>
					</View>
				</Animated.View>

				<Animated.View style={bodyContainerStyle}>
					<View style={styles.trustedSection}>
						<Text
							style={
								styles.trustedTitle
							}
						>
							Trusted by Hospitality
							Workers Nationwide
						</Text>
						<View style={styles.trustedRow}>
							{TRUSTED_ORGANIZATIONS.map(
								(name) => (
									<Text
										key={
											name
										}
										style={
											styles.trustedName
										}
									>
										{
											name
										}
									</Text>
								),
							)}
						</View>
					</View>

					<View style={styles.featureSection}>
						<View
							style={
								styles.featureGrid
							}
						>
							{FEATURES.map(
								(
									feature,
									index,
								) => {
									const featureAnimStyle =
										{
											opacity: featureAnims[
												index
											],
											transform: [
												{
													translateY: featureAnims[
														index
													].interpolate(
														{
															inputRange: [
																0,
																1,
															],
															outputRange:
																[
																	20,
																	0,
																],
														},
													),
												},
											],
										};

									return (
										<Animated.View
											key={
												feature.title
											}
											style={[
												styles.featureCard,
												{
													borderLeftColor:
														feature.accent,
												},
												featureAnimStyle,
											]}
										>
											<View
												style={
													styles.featureHeaderRow
												}
											>
												<View
													style={
														styles.featureIconWrap
													}
												>
													<Ionicons
														name={
															feature.icon
														}
														size={
															20
														}
														color={
															feature.accent
														}
													/>
												</View>
												<Text
													style={
														styles.featureTitle
													}
												>
													{
														feature.title
													}
												</Text>
											</View>
											<Text
												style={
													styles.featureDescription
												}
											>
												{
													feature.description
												}
											</Text>
										</Animated.View>
									);
								},
							)}
						</View>
					</View>

					<View style={styles.testimonialSection}>
						<Text
							style={
								styles.testimonialHeading
							}
						>
							What people are saying.
						</Text>
						<View
							style={
								styles.testimonialGrid
							}
						>
							{TESTIMONIALS.map(
								(
									testimonial,
								) => (
									<View
										key={
											testimonial.author
										}
										style={
											styles.testimonialCard
										}
									>
										<Text
											style={
												styles.testimonialQuote
											}
										>
											{
												testimonial.quote
											}
										</Text>
										<View>
											<Text
												style={[
													styles.testimonialAuthor,
													{
														color: testimonial.color,
													},
												]}
											>
												{
													testimonial.author
												}
											</Text>
											<Text
												style={
													styles.testimonialRole
												}
											>
												{
													testimonial.role
												}
											</Text>
										</View>
									</View>
								),
							)}
						</View>
					</View>

					<View style={styles.enterpriseSection}>
						<View
							style={
								styles.enterpriseGrid
							}
						>
							<View
								style={
									styles.enterpriseCopy
								}
							>
								<Text
									style={
										styles.enterpriseTitle
									}
								>
									Scale
									your
									{"\n"}
									schedule.
								</Text>
								<Text
									style={
										styles.enterpriseDescription
									}
								>
									Enterprise-grade
									coordination
									for
									distributed
									teams.
									Integrate
									FreeRota
									into
									your
									existing
									workforce
									management
									software
									via our
									robust
									REST
									API.
								</Text>
								<View
									style={
										styles.benefitList
									}
								>
									{ENTERPRISE_BENEFITS.map(
										(
											benefit,
										) => (
											<View
												key={
													benefit
												}
												style={
													styles.benefitRow
												}
											>
												<View
													style={
														styles.benefitDot
													}
												/>
												<Text
													style={
														styles.benefitText
													}
												>
													{
														benefit
													}
												</Text>
											</View>
										),
									)}
								</View>
								<Pressable
									style={
										styles.outlineButton
									}
									onPress={
										handleSolutionsPress
									}
								>
									<Text
										style={
											styles.outlineButtonText
										}
									>
										API
										Documentation
									</Text>
								</Pressable>
							</View>
							<View
								style={
									styles.codeCard
								}
							>
								<Text
									style={
										styles.codeText
									}
								>
									{
										ENTERPRISE_API_SNIPPET
									}
								</Text>
							</View>
						</View>
					</View>

					<View style={styles.contactSection}>
						<View
							style={
								styles.contactInner
							}
						>
							<Text
								style={
									styles.contactTitle
								}
							>
								Partner with
								FreeRota
							</Text>
							<Text
								style={
									styles.contactSubtitle
								}
							>
								Tell us about
								your
								organization's
								coordination
								needs.
							</Text>
							<View
								style={
									styles.inputGrid
								}
							>
								<View
									style={
										styles.fieldWrap
									}
								>
									<TextInput
										style={
											styles.input
										}
										placeholder="Full Name"
										placeholderTextColor={
											TOKENS.textMuted
										}
									/>
								</View>
								<View
									style={
										styles.fieldWrap
									}
								>
									<TextInput
										style={
											styles.input
										}
										placeholder="Work Email"
										placeholderTextColor={
											TOKENS.textMuted
										}
									/>
								</View>
								<View
									style={[
										styles.fieldWrap,
										styles.fieldWrapWide,
									]}
								>
									<TextInput
										style={
											styles.input
										}
										placeholder="Organization"
										placeholderTextColor={
											TOKENS.textMuted
										}
									/>
								</View>
								<View
									style={[
										styles.fieldWrap,
										styles.fieldWrapWide,
									]}
								>
									<TextInput
										multiline
										style={[
											styles.input,
											styles.inputMulti,
										]}
										placeholder="How can we help?"
										placeholderTextColor={
											TOKENS.textMuted
										}
									/>
								</View>
							</View>
							<View
								style={
									styles.sendRow
								}
							>
								<Pressable
									style={
										styles.sendButton
									}
									onPress={
										handleEnterpriseInquiryPress
									}
								>
									<Text
										style={
											styles.sendButtonText
										}
									>
										Send
										Inquiry
									</Text>
								</Pressable>
							</View>
						</View>
					</View>

					<View style={styles.footer}>
						<View>
							<Text
								style={
									styles.footerBrand
								}
							>
								FreeRota
							</Text>
							<Text
								style={
									styles.footerMeta
								}
							>
								© 2026 FreeRota.
								Precision Social
								Coordination.
							</Text>
						</View>
						<View
							style={
								styles.footerLinks
							}
						>
							<Pressable
								onPress={
									handlePlatformPress
								}
							>
								<Text
									style={
										styles.footerLink
									}
								>
									Platform
								</Text>
							</Pressable>
							<Pressable
								onPress={
									handleSolutionsPress
								}
							>
								<Text
									style={
										styles.footerLink
									}
								>
									Solutions
								</Text>
							</Pressable>
							<Pressable
								onPress={
									handleEnterprisePress
								}
							>
								<Text
									style={
										styles.footerLink
									}
								>
									Enterprise
								</Text>
							</Pressable>
							<Pressable
								onPress={
									handlePricingPress
								}
							>
								<Text
									style={
										styles.footerLink
									}
								>
									Pricing
								</Text>
							</Pressable>
							<Pressable
								onPress={
									handleGetStartedPress
								}
							>
								<Text
									style={
										styles.footerLink
									}
								>
									Get
									Started
								</Text>
							</Pressable>
						</View>
					</View>
				</Animated.View>
			</ScrollView>
		</View>
	);
}
