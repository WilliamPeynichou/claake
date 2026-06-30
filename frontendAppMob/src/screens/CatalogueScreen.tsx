import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ClaakeMark } from "../components/ClaakeMark";
import { Droplet } from "../components/Droplet";
import { Glass } from "../components/Glass";
import { GlassButton } from "../components/GlassButton";
import { FilterIcon, SearchIcon, SparkleIcon, StarIcon } from "../components/Icons";
import { Agent, CATEGORIES, MOCK_AGENTS } from "../data/mock";
import { BRAND, fonts } from "../theme/brand";
import { useTheme } from "../theme/ThemeContext";

type Props = { onAgentPress: (id: string) => void };

function FeaturedHero({ agent, onPress }: { agent: Agent; onPress: () => void }) {
	const { c } = useTheme();
	return (
		<Pressable onPress={onPress} style={styles.hero}>
			<LinearGradient
				colors={["#2a7a44", "#42a065", "#7ec99a"]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]}
			/>
			<Droplet
				size={28}
				color="rgba(255,255,255,0.7)"
				drift
				driftDuration={7500}
				toX={-4}
				toY={10}
				style={styles.hDrop1}
			/>
			<Droplet
				size={18}
				color="rgba(255,255,255,0.7)"
				drift
				driftDuration={6200}
				toX={4}
				toY={-8}
				style={styles.hDrop2}
			/>
			<Droplet
				size={40}
				color="rgba(255,255,255,0.5)"
				drift
				driftDuration={9000}
				toX={-8}
				toY={14}
				style={styles.hDrop3}
			/>

			<View style={styles.heroContent}>
				<View style={styles.heroChip}>
					<SparkleIcon size={14} color="#fff" />
					<Text style={[styles.heroChipText, { fontFamily: fonts.sansMedium }]}>En vedette</Text>
				</View>
				<Text style={[styles.heroName, { fontFamily: fonts.serif }]}>{agent.name}</Text>
				<Text style={[styles.heroDesc, { fontFamily: fonts.sans }]} numberOfLines={2}>
					{agent.description}
				</Text>
				<View style={styles.heroFooter}>
					<GlassButton size="sm" style={styles.heroBtn}>
						Essayer →
					</GlassButton>
					<Text style={[styles.heroPrice, { fontFamily: fonts.sans }]}>
						{agent.price > 0 ? `${agent.price} €/mois` : "Gratuit"}
					</Text>
				</View>
			</View>
		</Pressable>
	);
}

function AgentRow({ agent, onPress }: { agent: Agent; onPress: () => void }) {
	const { dark, c } = useTheme();
	return (
		<Glass strong borderRadius={22} onPress={onPress} style={styles.agentRow}>
			<View style={styles.agentRowInner}>
				<View style={styles.avatarWrap}>
					<LinearGradient colors={[BRAND.brandLight, BRAND.brand]} style={styles.avatar}>
						<View style={styles.avatarHighlight} />
						<ClaakeMark size={26} color="#fff" bgColor="rgba(255,255,255,0.3)" />
					</LinearGradient>
				</View>
				<View style={styles.agentInfo}>
					<Text style={[styles.agentName, { color: c.ink, fontFamily: fonts.serif }]}>
						{agent.name}
					</Text>
					<Text
						style={[styles.agentDesc, { color: c.muted, fontFamily: fonts.sans }]}
						numberOfLines={1}
					>
						{agent.description}
					</Text>
					<View style={styles.agentMeta}>
						<View style={styles.ratingRow}>
							<StarIcon size={11} color={BRAND.brand} fill={BRAND.brand} />
							<Text style={[styles.ratingText, { color: c.muted, fontFamily: fonts.sans }]}>
								{agent.rating.toFixed(1)}
							</Text>
						</View>
						<Text style={[styles.agentCat, { color: c.muted, fontFamily: fonts.sans }]}>
							· {agent.category}
						</Text>
					</View>
				</View>
				<View
					style={[
						styles.priceBadge,
						agent.free
							? {
									backgroundColor: dark ? "rgba(80,180,120,0.25)" : "rgba(66,160,101,0.15)",
									borderWidth: 0,
								}
							: {
									borderWidth: 1,
									borderColor: dark ? "rgba(255,255,255,0.14)" : "rgba(28,26,22,0.12)",
								},
					]}
				>
					<Text
						style={{
							fontFamily: fonts.sansMedium,
							fontSize: 12,
							color: agent.free ? (dark ? "#7ec99a" : BRAND.brandDark) : c.ink,
						}}
					>
						{agent.free ? "Free" : `${agent.price} €`}
					</Text>
				</View>
			</View>
		</Glass>
	);
}

export function CatalogueScreen({ onAgentPress }: Props) {
	const { dark, c } = useTheme();
	const [q, setQ] = useState("");
	const [cat, setCat] = useState("TOUS");

	const featured = MOCK_AGENTS.find((a) => a.featured);
	const filtered = MOCK_AGENTS.filter((a) => {
		const mC = cat === "TOUS" || a.category.toUpperCase() === cat;
		const mQ =
			!q || (a.name + a.description + a.tags.join(" ")).toLowerCase().includes(q.toLowerCase());
		return mC && mQ;
	});

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			{/* Greeting */}
			<View style={styles.greetingWrap}>
				<Text style={[styles.greetingSub, { color: c.muted, fontFamily: fonts.sans }]}>
					Bonjour Marie —
				</Text>
				<Text style={[styles.greetingTitle, { color: c.ink }]}>
					<Text style={{ fontFamily: fonts.serif }}>Quel agent pour </Text>
					<Text style={{ fontFamily: fonts.serifItalic, color: BRAND.brand }}>aujourd'hui</Text>
					<Text style={{ fontFamily: fonts.serif }}> ?</Text>
				</Text>
			</View>

			{/* Search */}
			<Glass borderRadius={18} style={styles.searchBar}>
				<SearchIcon size={18} color={c.muted} />
				<TextInput
					value={q}
					onChangeText={setQ}
					placeholder="Chercher un agent, un tag…"
					placeholderTextColor={c.muted}
					style={[styles.searchInput, { color: c.ink, fontFamily: fonts.sans }]}
				/>
				<FilterIcon size={18} color={c.muted} />
			</Glass>

			{/* Featured hero */}
			{featured && cat === "TOUS" && !q && (
				<FeaturedHero agent={featured} onPress={() => onAgentPress(featured.id)} />
			)}

			{/* Categories */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.catList}
				style={styles.catScroll}
			>
				{CATEGORIES.map((c2) => {
					const isActive = c2 === cat;
					return (
						<Pressable
							key={c2}
							onPress={() => setCat(c2)}
							style={[
								styles.catChip,
								{
									backgroundColor: isActive
										? dark
											? "rgba(255,255,255,0.9)"
											: "#1c1a16"
										: dark
											? "rgba(255,255,255,0.06)"
											: "rgba(255,255,255,0.5)",
									borderWidth: isActive ? 0 : 1,
									borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(28,26,22,0.12)",
								},
							]}
						>
							<Text
								style={{
									fontFamily: fonts.sansMedium,
									fontSize: 12,
									color: isActive ? (dark ? "#1c1a16" : "#fff") : dark ? "#f4f0e8" : "#1c1a16",
								}}
							>
								{c2.charAt(0) + c2.slice(1).toLowerCase()}
							</Text>
						</Pressable>
					);
				})}
			</ScrollView>

			{/* Agent list */}
			<View style={styles.agentList}>
				{filtered.map((agent) => (
					<AgentRow key={agent.id} agent={agent} onPress={() => onAgentPress(agent.id)} />
				))}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1 },
	content: { paddingTop: 16, paddingBottom: 140, paddingHorizontal: 20 },
	greetingWrap: { marginTop: 10, marginBottom: 14 },
	greetingSub: { fontSize: 13, letterSpacing: -0.05, marginBottom: 4 },
	greetingTitle: { fontSize: 38, lineHeight: 40, letterSpacing: -0.8 },
	searchBar: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingHorizontal: 14,
		paddingVertical: 12,
		marginBottom: 18,
	},
	searchInput: { flex: 1, fontSize: 14 },
	hero: {
		borderRadius: 28,
		overflow: "hidden",
		marginBottom: 22,
		padding: 20,
		minHeight: 180,
		shadowColor: BRAND.brand,
		shadowOffset: { width: 0, height: 24 },
		shadowOpacity: 0.55,
		shadowRadius: 32,
		elevation: 10,
	},
	heroContent: { position: "relative", zIndex: 2 },
	hDrop1: { position: "absolute", top: 16, right: 22, opacity: 0.5 },
	hDrop2: { position: "absolute", bottom: 30, right: 60, opacity: 0.35 },
	hDrop3: { position: "absolute", top: 90, right: 14, opacity: 0.3 },
	heroChip: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
	heroChipText: {
		fontSize: 11,
		letterSpacing: 0.8,
		textTransform: "uppercase",
		color: "rgba(255,255,255,0.85)",
	},
	heroName: { fontSize: 34, lineHeight: 34, color: "#fff", letterSpacing: -0.6, marginBottom: 6 },
	heroDesc: {
		fontSize: 13.5,
		lineHeight: 19.5,
		color: "rgba(255,255,255,0.94)",
		maxWidth: 260,
		marginBottom: 16,
	},
	heroFooter: { flexDirection: "row", alignItems: "center", gap: 10 },
	heroBtn: {
		backgroundColor: "rgba(255,255,255,0.22)",
		borderColor: "rgba(255,255,255,0.35)",
	},
	heroPrice: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
	catScroll: { marginBottom: 16 },
	catList: { flexDirection: "row", gap: 8, paddingBottom: 4 },
	catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
	agentList: { gap: 10 },
	agentRow: { marginBottom: 0 },
	agentRowInner: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		padding: 14,
	},
	avatarWrap: {},
	avatar: {
		width: 52,
		height: 52,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
		shadowColor: BRAND.brand,
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.35,
		shadowRadius: 10,
		elevation: 4,
	},
	avatarHighlight: {
		position: "absolute",
		top: 4,
		left: 6,
		width: 16,
		height: 10,
		borderRadius: 8,
		backgroundColor: "rgba(255,255,255,0.5)",
	},
	agentInfo: { flex: 1, minWidth: 0 },
	agentName: { fontSize: 18, lineHeight: 21, letterSpacing: -0.3 },
	agentDesc: { fontSize: 12.5, marginTop: 2, opacity: 0.9 },
	agentMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
	ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
	ratingText: { fontSize: 11 },
	agentCat: { fontSize: 11 },
	priceBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
});
