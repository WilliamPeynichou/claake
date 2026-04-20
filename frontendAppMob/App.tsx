import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { BackgroundBlobs } from "./src/components/BackgroundBlobs";
import { ScreenFade } from "./src/components/ScreenFade";
import { TabBar } from "./src/components/TabBar";
import { useClaakeFonts } from "./src/hooks/useClaakeFonts";
import { AgentDetailScreen } from "./src/screens/AgentDetailScreen";
import { CatalogueScreen } from "./src/screens/CatalogueScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { LibraryScreen } from "./src/screens/LibraryScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { FavProvider } from "./src/state/FavContext";
import type { Tab } from "./src/state/NavContext";
import { NavProvider, useNav } from "./src/state/NavContext";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";

SplashScreen.preventAutoHideAsync();

function Root() {
	const { tab, viewing, chatAgentId, setTab, openAgent, back, startChat, pickChat } = useNav();
	const { dark, c } = useTheme();

	const showTabBar = !viewing && !(tab === "chat" && chatAgentId);
	const screenKey = `${tab}|${viewing ?? ""}|${chatAgentId ?? ""}`;

	function renderScreen() {
		if (viewing && tab !== "chat") {
			return <AgentDetailScreen agentId={viewing} onBack={back} onChat={startChat} />;
		}
		switch (tab) {
			case "catalogue":
				return <CatalogueScreen onAgentPress={openAgent} />;
			case "chat":
				return <ChatScreen chatAgentId={chatAgentId} onChatPress={pickChat} onBack={back} />;
			case "library":
				return <LibraryScreen onAgentPress={openAgent} />;
			case "profile":
				return <ProfileScreen />;
		}
	}

	return (
		<View style={[styles.container, { backgroundColor: c.bg }]}>
			<StatusBar style={dark ? "light" : "dark"} />
			<BackgroundBlobs />
			<ScreenFade screenKey={screenKey}>{renderScreen()}</ScreenFade>
			{showTabBar && <TabBar active={tab} onTabPress={(t: Tab) => setTab(t)} />}
		</View>
	);
}

export default function App() {
	const [fontsLoaded, fontError] = useClaakeFonts();
	const [appReady, setAppReady] = useState(false);

	useEffect(() => {
		if (fontsLoaded || fontError) {
			setAppReady(true);
		}
	}, [fontsLoaded, fontError]);

	const onLayoutRootView = useCallback(async () => {
		if (appReady) {
			await SplashScreen.hideAsync();
		}
	}, [appReady]);

	if (!appReady) return null;

	return (
		<ThemeProvider>
			<FavProvider>
				<NavProvider>
					<View style={styles.full} onLayout={onLayoutRootView}>
						<Root />
					</View>
				</NavProvider>
			</FavProvider>
		</ThemeProvider>
	);
}

const styles = StyleSheet.create({
	full: { flex: 1 },
	container: { flex: 1 },
});
