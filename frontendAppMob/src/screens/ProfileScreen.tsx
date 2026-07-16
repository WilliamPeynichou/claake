import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ClaakeMark } from "../components/ClaakeMark";
import { Glass } from "../components/Glass";
import { BRAND, fonts, spacing } from "../theme/brand";
import { useTheme } from "../theme/ThemeContext";

type RowProps = { label: string; value: string; last?: boolean };

function Row({ label, value, last }: RowProps) {
	const { c } = useTheme();
	return (
		<View style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
			<Text style={{ fontFamily: fonts.sans, fontSize: 14, color: c.ink }}>{label}</Text>
			<Text style={{ fontFamily: fonts.sans, fontSize: 13, color: c.muted }}>{value}</Text>
		</View>
	);
}

function ToggleSwitch({ value, onToggle }: { value: boolean; onToggle: () => void }) {
	const knobX = React.useRef(new Animated.Value(value ? 25 : 3)).current;

	React.useEffect(() => {
		Animated.timing(knobX, {
			toValue: value ? 25 : 3,
			duration: 220,
			useNativeDriver: true,
		}).start();
	}, [knobX, value]);

	return (
		<Pressable onPress={onToggle} style={[styles.toggle, value && styles.toggleOn]}>
			<LinearGradient
				colors={value ? [BRAND.brandLight, BRAND.brand] : ["rgba(0,0,0,0)", "rgba(0,0,0,0)"]}
				style={StyleSheet.absoluteFillObject}
			/>
			<Animated.View style={[styles.knob, { transform: [{ translateX: knobX }] }]} />
		</Pressable>
	);
}

export function ProfileScreen() {
	const { dark, setDark, c } = useTheme();

	const labelCaps = {
		fontFamily: fonts.sansMedium,
		fontSize: 11,
		letterSpacing: 0.8,
		textTransform: "uppercase" as const,
		color: c.muted,
		marginTop: 20,
		marginBottom: 8,
		marginLeft: 4,
	};

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			<Text style={[styles.title, { color: c.ink }]}>Profil</Text>

			{/* Identity card */}
			<Glass strong borderRadius={26} style={styles.identityCard}>
				<View style={styles.identityTop}>
					<View style={styles.avatarWrap}>
						<LinearGradient
							colors={[BRAND.brandLight, BRAND.brand, BRAND.brandDark]}
							style={styles.avatar}
						>
							<View style={styles.avatarHighlight} />
							<Text style={[styles.avatarText, { fontFamily: fonts.serif }]}>M</Text>
						</LinearGradient>
					</View>
					<View style={styles.identityInfo}>
						<Text style={[styles.userName, { color: c.ink, fontFamily: fonts.serif }]}>
							Marie Cadet
						</Text>
						<Text style={[styles.userEmail, { color: c.muted, fontFamily: fonts.sans }]}>
							marie@cadet.fr
						</Text>
						<View
							style={[
								styles.proBadge,
								{ backgroundColor: dark ? "rgba(80,180,120,0.22)" : "rgba(66,160,101,0.15)" },
							]}
						>
							<Text
								style={[
									styles.proText,
									{ color: dark ? "#7ec99a" : BRAND.brandDark, fontFamily: fonts.sansSemi },
								]}
							>
								PRO
							</Text>
						</View>
					</View>
				</View>
				<View style={[styles.statsRow, { borderTopColor: c.border, borderTopWidth: 1 }]}>
					{[
						["14", "Agents"],
						["38", "Chats"],
						["2", "Publiés"],
					].map(([v, l]) => (
						<View key={l} style={styles.statItem}>
							<Text style={[styles.statValue, { color: c.ink, fontFamily: fonts.serif }]}>{v}</Text>
							<Text style={[styles.statLabel, { color: c.muted, fontFamily: fonts.sans }]}>
								{l}
							</Text>
						</View>
					))}
				</View>
			</Glass>

			{/* Apparence */}
			<Text style={labelCaps}>Apparence</Text>
			<Glass strong borderRadius={20} style={styles.section}>
				<View style={[styles.settingRow, { borderBottomColor: c.border, borderBottomWidth: 1 }]}>
					<Text style={{ fontFamily: fonts.sans, fontSize: 14, color: c.ink }}>Mode sombre</Text>
					<ToggleSwitch value={dark} onToggle={() => setDark(!dark)} />
				</View>
				<Row label="Typographie" value="DM Serif + DM Sans" />
				<Row label="Langue" value="Français" last />
			</Glass>

			{/* Compte */}
			<Text style={labelCaps}>Compte</Text>
			<Glass strong borderRadius={20} style={styles.section}>
				<Row label="Abonnement" value="PRO · 12 €/mo" />
				<Row label="Clés API" value="2 actives" />
				<Row label="Facturation" value="→" />
				<Row label="Se déconnecter" value="→" last />
			</Glass>

			<View style={styles.footer}>
				<ClaakeMark size={24} color={c.muted} />
				<Text style={{ fontFamily: fonts.mono, fontSize: 11, color: c.muted, letterSpacing: 0.8 }}>
					claake · v 1.0.0 · build 2026.04
				</Text>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1 },
	content: { paddingTop: 16, paddingBottom: 140, paddingHorizontal: 20 },
	title: {
		fontSize: 38,
		fontWeight: "400",
		letterSpacing: -0.8,
		lineHeight: 38,
		marginTop: 10,
		marginBottom: 16,
	},
	identityCard: { padding: 18, marginBottom: 0 },
	identityTop: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 0 },
	avatarWrap: {},
	avatar: {
		width: 64,
		height: 64,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	avatarHighlight: {
		position: "absolute",
		top: 4,
		left: 10,
		width: 18,
		height: 12,
		borderRadius: 9,
		backgroundColor: "rgba(255,255,255,0.55)",
	},
	avatarText: { color: "#fff", fontSize: 30 },
	identityInfo: { flex: 1, gap: 2 },
	userName: { fontSize: 22, letterSpacing: -0.3 },
	userEmail: { fontSize: 12.5 },
	proBadge: {
		alignSelf: "flex-start",
		marginTop: 6,
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 999,
	},
	proText: { fontSize: 10.5, letterSpacing: 0.4 },
	statsRow: {
		flexDirection: "row",
		marginTop: 16,
		paddingTop: 14,
	},
	statItem: { flex: 1, alignItems: "center" },
	statValue: { fontSize: 24, lineHeight: 24 },
	statLabel: { fontSize: 11, marginTop: 4 },
	section: { overflow: "hidden" },
	settingRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	toggle: {
		width: 50,
		height: 28,
		borderRadius: 999,
		backgroundColor: "rgba(28,26,22,0.12)",
		overflow: "hidden",
		justifyContent: "center",
	},
	toggleOn: {},
	knob: {
		width: 22,
		height: 22,
		borderRadius: 11,
		backgroundColor: "#fff",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
		elevation: 2,
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	footer: { alignItems: "center", gap: spacing.sm, paddingTop: spacing.lg },
});
