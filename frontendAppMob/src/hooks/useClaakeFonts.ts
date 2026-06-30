import {
	DMSans_400Regular,
	DMSans_500Medium,
	DMSans_600SemiBold,
	DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
	DMSerifDisplay_400Regular,
	DMSerifDisplay_400Regular_Italic,
} from "@expo-google-fonts/dm-serif-display";
import {
	JetBrainsMono_400Regular,
	JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";
import { useFonts } from "expo-font";

export function useClaakeFonts() {
	return useFonts({
		DMSerifDisplay_400Regular,
		DMSerifDisplay_400Regular_Italic,
		DMSans_400Regular,
		DMSans_500Medium,
		DMSans_600SemiBold,
		DMSans_700Bold,
		JetBrainsMono_400Regular,
		JetBrainsMono_500Medium,
	});
}
