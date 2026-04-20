import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BRAND, fonts } from "../theme/brand";
import { useTheme } from "../theme/ThemeContext";
import { Glass } from "./Glass";
import { ChatIcon, LibIcon, SearchIcon, UserIcon } from "./Icons";

export type Tab = "catalogue" | "chat" | "library" | "profile";

type Props = {
	active: Tab;
	onTabPress: (tab: Tab) => void;
};

const TABS: { id: Tab; label: string; Icon: typeof SearchIcon }[] = [
	{ id: "catalogue", label: "Explore", Icon: SearchIcon },
	{ id: "chat", label: "Chat", Icon: ChatIcon },
	{ id: "library", label: "Biblio", Icon: LibIcon },
	{ id: "profile", label: "Moi", Icon: UserIcon },
];

export function TabBar({ active, onTabPress }: Props) {
	const { dark } = useTheme();

	return (
		<View style={styles.container}>
			<Glass strong borderRadius={28} style={styles.pill}>
				{TABS.map((tab) => {
					const isActive = tab.id === active;
					const iconColor = isActive
						? dark
							? "#fff"
							: "#1c1a16"
						: dark
							? "rgba(255,255,255,0.55)"
							: "rgba(28,26,22,0.55)";

					return (
						<Pressable key={tab.id} onPress={() => onTabPress(tab.id)} style={styles.tabWrap}>
							{isActive ? (
								<LinearGradient
									colors={
										dark
											? ["rgba(80,180,120,0.35)", "rgba(42,122,68,0.5)"]
											: ["rgba(255,255,255,0.9)", "rgba(255,255,255,0.65)"]
									}
									start={{ x: 0, y: 0 }}
									end={{ x: 0, y: 1 }}
									style={styles.activeTab}
								>
									<tab.Icon size={20} color={iconColor} />
									<Text style={[styles.label, { color: iconColor, fontFamily: fonts.sansMedium }]}>
										{tab.label}
									</Text>
								</LinearGradient>
							) : (
								<View style={styles.inactiveTab}>
									<tab.Icon size={20} color={iconColor} />
									<Text style={[styles.label, { color: iconColor, fontFamily: fonts.sansMedium }]}>
										{tab.label}
									</Text>
								</View>
							)}
						</Pressable>
					);
				})}
			</Glass>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		bottom: 24,
		left: 16,
		right: 16,
	},
	pill: {
		flexDirection: "row",
		padding: 6,
	},
	tabWrap: {
		flex: 1,
	},
	activeTab: {
		borderRadius: 22,
		paddingVertical: 10,
		paddingHorizontal: 4,
		alignItems: "center",
		gap: 3,
		shadowColor: BRAND.brand,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 3,
	},
	inactiveTab: {
		paddingVertical: 10,
		paddingHorizontal: 4,
		alignItems: "center",
		gap: 3,
	},
	label: {
		fontSize: 10.5,
		letterSpacing: -0.02,
	},
});
