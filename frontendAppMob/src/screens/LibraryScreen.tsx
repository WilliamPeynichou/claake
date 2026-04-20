import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ClaakeMark } from "../components/ClaakeMark";
import { Droplet } from "../components/Droplet";
import { Glass } from "../components/Glass";
import { StarIcon } from "../components/Icons";
import { MOCK_AGENTS } from "../data/mock";
import { useFav } from "../state/FavContext";
import { BRAND, fonts, radius } from "../theme/brand";
import { useTheme } from "../theme/ThemeContext";

type Props = { onAgentPress: (id: string) => void };

const TABS = ["Épinglés", "Achats", "Historique"] as const;
type LibTab = (typeof TABS)[number];

function AgentGridCard({
	agent,
	onPress,
}: {
	agent: (typeof MOCK_AGENTS)[0];
	onPress: () => void;
}) {
	const { dark, c } = useTheme();
	return (
		<Pressable onPress={onPress} style={styles.gridItem}>
			<Glass strong borderRadius={22} style={styles.gridCard}>
				<LinearGradient colors={[BRAND.brandLight, BRAND.brand]} style={styles.gridAvatar}>
					<ClaakeMark size={22} color="#fff" bgColor="rgba(255,255,255,0.3)" />
				</LinearGradient>
				<Text style={[styles.gridCat, { color: c.muted, fontFamily: fonts.sansMedium }]}>
					{agent.category}
				</Text>
				<Text
					style={[styles.gridName, { color: c.ink, fontFamily: fonts.serif }]}
					numberOfLines={2}
				>
					{agent.name}
				</Text>
				<View style={styles.gridMeta}>
					<View style={styles.gridRating}>
						<StarIcon size={10} color={BRAND.brand} fill={BRAND.brand} />
						<Text style={[styles.gridRatingText, { color: c.muted, fontFamily: fonts.sans }]}>
							{agent.rating.toFixed(1)}
						</Text>
					</View>
					<Text style={[styles.gridPrice, { color: c.muted, fontFamily: fonts.sans }]}>
						{agent.free ? "Free" : `${agent.price} €`}
					</Text>
				</View>
			</Glass>
		</Pressable>
	);
}

function EmptyState() {
	const { c } = useTheme();
	return (
		<View style={styles.emptyState}>
			<Droplet size={80} color={BRAND.brand} />
			<Text style={[styles.emptyTitle, { color: c.ink, fontFamily: fonts.serif }]}>
				Rien d'épinglé
			</Text>
			<Text style={[styles.emptyDesc, { color: c.muted, fontFamily: fonts.sans }]}>
				Explore le catalogue et ajoute tes favoris.
			</Text>
		</View>
	);
}

export function LibraryScreen({ onAgentPress }: Props) {
	const { dark, c } = useTheme();
	const { fav } = useFav();
	const [activeTab, setActiveTab] = useState<LibTab>("Épinglés");

	const favAgents = MOCK_AGENTS.filter((a) => fav[a.id]);
	const bought = MOCK_AGENTS.filter((a) => !a.free);
	const agents = activeTab === "Épinglés" ? favAgents : activeTab === "Achats" ? bought : [];

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			<Text style={[styles.title, { color: c.ink }]}>
				Ta <Text style={{ fontFamily: fonts.serifItalic, color: BRAND.brand }}>bibliothèque</Text>
			</Text>

			{/* Segmented tabs */}
			<Glass strong borderRadius={999} style={styles.tabsWrap}>
				{TABS.map((tab) => {
					const isActive = tab === activeTab;
					const activeBg = dark ? "rgba(255,255,255,0.9)" : "#1c1a16";
					const activeColor = dark ? "#1c1a16" : "#fff";
					const inactiveColor = dark ? c.muted : "rgba(28,26,22,0.65)";
					return (
						<Pressable
							key={tab}
							onPress={() => setActiveTab(tab)}
							style={[styles.tabItem, isActive && { backgroundColor: activeBg, borderRadius: 999 }]}
						>
							<Text
								style={{
									fontFamily: fonts.sansMedium,
									fontSize: 12.5,
									color: isActive ? activeColor : inactiveColor,
								}}
							>
								{tab}
							</Text>
						</Pressable>
					);
				})}
			</Glass>

			{agents.length === 0 ? (
				<EmptyState />
			) : (
				<View style={styles.grid}>
					{agents.map((agent) => (
						<AgentGridCard key={agent.id} agent={agent} onPress={() => onAgentPress(agent.id)} />
					))}
				</View>
			)}
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
	tabsWrap: { flexDirection: "row", padding: 4, marginBottom: 18 },
	tabItem: { flex: 1, paddingVertical: 9, paddingHorizontal: 8, alignItems: "center" },
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
	gridItem: { width: "47.5%" },
	gridCard: { padding: 14, gap: 0 },
	gridAvatar: {
		width: 46,
		height: 46,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 10,
		shadowColor: BRAND.brand,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 8,
		elevation: 4,
	},
	gridCat: { fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 2 },
	gridName: { fontSize: 19, lineHeight: 21, letterSpacing: -0.3, marginBottom: 8 },
	gridMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	gridRating: { flexDirection: "row", alignItems: "center", gap: 3 },
	gridRatingText: { fontSize: 11 },
	gridPrice: { fontSize: 11 },
	emptyState: { alignItems: "center", paddingTop: 40, gap: 12 },
	emptyTitle: { fontSize: 24, fontWeight: "400" },
	emptyDesc: { fontSize: 13, textAlign: "center" },
});
