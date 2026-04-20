import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ClaakeMark } from "../components/ClaakeMark";
import { Droplet } from "../components/Droplet";
import { Glass } from "../components/Glass";
import { GlassButton } from "../components/GlassButton";
import { IconGlass } from "../components/IconGlass";
import { BackIcon, DownloadIcon, HeartIcon, StarIcon } from "../components/Icons";
import { MOCK_AGENTS } from "../data/mock";
import { useFav } from "../state/FavContext";
import { BRAND, fonts } from "../theme/brand";
import { useTheme } from "../theme/ThemeContext";

type Props = {
	agentId: string;
	onBack: () => void;
	onChat: (agentId: string) => void;
};

const MOCK_REVIEWS = [
	{ user: "marc.p", rating: 5, text: "Exactement ce que je cherchais." },
	{
		user: "julie.l",
		rating: 4,
		text: "Très bon, quelques oublis de contexte sur les longues conv.",
	},
];

export function AgentDetailScreen({ agentId, onBack, onChat }: Props) {
	const { dark, c } = useTheme();
	const { fav, toggleFav } = useFav();
	const agent = MOCK_AGENTS.find((a) => a.id === agentId);

	if (!agent) return null;

	const isFav = !!fav[agent.id];

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			{/* Nav */}
			<View style={styles.nav}>
				<IconGlass icon={<BackIcon size={18} color={c.ink} />} onPress={onBack} size={42} />
				<IconGlass
					icon={
						<HeartIcon
							size={18}
							color={isFav ? BRAND.brand : c.ink}
							fill={isFav ? BRAND.brand : "none"}
						/>
					}
					onPress={() => toggleFav(agent.id)}
					size={42}
				/>
			</View>

			{/* Hero */}
			<View style={[styles.hero, { shadowColor: BRAND.brand }]}>
				<LinearGradient
					colors={["#1e5c34", "#2a7a44", "#42a065"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]}
				/>
				<Droplet
					size={26}
					color="rgba(255,255,255,0.7)"
					drift
					driftDuration={7500}
					toX={-5}
					toY={10}
					style={styles.drop1}
				/>
				<Droplet
					size={44}
					color="rgba(255,255,255,0.4)"
					drift
					driftDuration={8500}
					toX={4}
					toY={-8}
					style={styles.drop2}
				/>
				<Droplet
					size={22}
					color="rgba(255,255,255,0.6)"
					drift
					driftDuration={9000}
					toX={-8}
					toY={12}
					style={styles.drop3}
				/>

				<View style={styles.heroContent}>
					<View style={styles.heroRow}>
						<View style={styles.heroAvatar}>
							<ClaakeMark size={38} color="#fff" bgColor="rgba(255,255,255,0.3)" />
						</View>
						<View style={{ flex: 1 }}>
							<Text style={[styles.heroCategory, { fontFamily: fonts.sansMedium }]}>
								{agent.category}
							</Text>
							<Text style={[styles.heroName, { fontFamily: fonts.serif }]}>{agent.name}</Text>
							<Text style={[styles.heroCreator, { fontFamily: fonts.sans }]}>
								par {agent.creator}
							</Text>
						</View>
					</View>
					<Text style={[styles.heroDesc, { fontFamily: fonts.sans }]}>{agent.description}</Text>
				</View>
			</View>

			{/* Metrics */}
			<View style={styles.metrics}>
				{[
					{ k: "Note", v: agent.rating.toFixed(1), s: `${agent.reviews} avis` },
					{
						k: "Téléch.",
						v:
							agent.downloads > 999
								? `${(agent.downloads / 1000).toFixed(1)}k`
								: String(agent.downloads),
						s: "utilisateurs",
					},
					{
						k: "Prix",
						v: agent.free ? "Free" : `${agent.price} €`,
						s: agent.free ? "à vie" : "/ mois",
					},
				].map((m) => (
					<Glass key={m.k} borderRadius={20} style={styles.metricTile}>
						<Text style={[styles.metricK, { color: c.muted, fontFamily: fonts.sansMedium }]}>
							{m.k}
						</Text>
						<Text style={[styles.metricV, { color: c.ink, fontFamily: fonts.serif }]}>{m.v}</Text>
						<Text style={[styles.metricS, { color: c.muted, fontFamily: fonts.sans }]}>{m.s}</Text>
					</Glass>
				))}
			</View>

			{/* CTA */}
			<View style={styles.ctaRow}>
				<GlassButton
					primary
					size="lg"
					icon={<View style={{ width: 4 }} />}
					onPress={() => onChat(agent.id)}
					style={{ flex: 1 }}
				>
					Démarrer une conversation
				</GlassButton>
				<GlassButton size="lg" icon={<DownloadIcon size={16} color={c.ink} />} />
			</View>

			{/* Tags */}
			<View style={styles.tagsSection}>
				<Text style={[styles.sectionLabel, { color: c.muted, fontFamily: fonts.sansMedium }]}>
					Tags
				</Text>
				<View style={styles.tags}>
					{agent.tags.map((t) => (
						<View
							key={t}
							style={[
								styles.tagPill,
								{
									backgroundColor: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)",
									borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.8)",
								},
							]}
						>
							<Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: c.ink }}>#{t}</Text>
						</View>
					))}
				</View>
			</View>

			{/* System prompt */}
			<View style={styles.promptSection}>
				<Text style={[styles.sectionLabel, { color: c.muted, fontFamily: fonts.sansMedium }]}>
					Prompt système
				</Text>
				<Glass borderRadius={18} style={styles.promptBox}>
					<Text style={[styles.promptText, { color: c.ink, fontFamily: fonts.mono }]}>
						{agent.system}
					</Text>
				</Glass>
			</View>

			{/* Reviews */}
			<View style={styles.reviewsSection}>
				<Text style={[styles.sectionLabel, { color: c.muted, fontFamily: fonts.sansMedium }]}>
					Avis récents
				</Text>
				{MOCK_REVIEWS.map((rv) => (
					<Glass key={rv.user} borderRadius={18} style={styles.reviewCard}>
						<View style={styles.reviewHeader}>
							<Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: c.ink }}>
								@{rv.user}
							</Text>
							<View style={{ flexDirection: "row", gap: 1 }}>
								{[1, 2, 3, 4, 5].map((s) => (
									<StarIcon
										key={s}
										size={11}
										color={BRAND.brand}
										fill={s <= rv.rating ? BRAND.brand : "none"}
									/>
								))}
							</View>
						</View>
						<Text style={[styles.reviewText, { color: c.ink, fontFamily: fonts.sans }]}>
							{rv.text}
						</Text>
					</Glass>
				))}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1 },
	content: { paddingTop: 16, paddingBottom: 140, paddingHorizontal: 20 },
	nav: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
	hero: {
		borderRadius: 32,
		padding: 22,
		paddingTop: 28,
		overflow: "hidden",
		marginBottom: 14,
		shadowOffset: { width: 0, height: 30 },
		shadowOpacity: 0.6,
		shadowRadius: 40,
		elevation: 12,
		minHeight: 200,
	},
	drop1: { position: "absolute", top: 10, right: 30, opacity: 0.45 },
	drop2: { position: "absolute", top: 120, right: 20, opacity: 0.3 },
	drop3: { position: "absolute", bottom: 20, left: 30, opacity: 0.25 },
	heroContent: { position: "relative", zIndex: 2 },
	heroRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
	heroAvatar: {
		width: 68,
		height: 68,
		borderRadius: 22,
		backgroundColor: "rgba(255,255,255,0.22)",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.35)",
	},
	heroCategory: {
		fontSize: 11,
		letterSpacing: 0.8,
		textTransform: "uppercase",
		color: "rgba(255,255,255,0.8)",
		marginBottom: 4,
	},
	heroName: { fontSize: 34, lineHeight: 34, letterSpacing: -0.6, color: "#fff" },
	heroCreator: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 },
	heroDesc: { fontSize: 14, lineHeight: 21, color: "rgba(255,255,255,0.95)" },
	metrics: { flexDirection: "row", gap: 8, marginBottom: 18 },
	metricTile: { flex: 1, padding: 14, alignItems: "center", gap: 2 },
	metricK: { fontSize: 10.5, letterSpacing: 0.8, textTransform: "uppercase" },
	metricV: { fontSize: 24, lineHeight: 24 },
	metricS: { fontSize: 10.5 },
	ctaRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
	tagsSection: { marginBottom: 22 },
	sectionLabel: { fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 },
	tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
	tagPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
	promptSection: { marginBottom: 22 },
	promptBox: { padding: 14 },
	promptText: { fontSize: 12, lineHeight: 18.6, opacity: 0.85 },
	reviewsSection: { gap: 8 },
	reviewCard: { marginBottom: 0 },
	reviewHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 12,
		paddingBottom: 6,
	},
	reviewText: {
		fontSize: 12.5,
		lineHeight: 18,
		opacity: 0.82,
		paddingHorizontal: 12,
		paddingBottom: 12,
	},
});
