import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeContext";

type Props = {
	children?: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	borderRadius?: number;
	strong?: boolean;
	tinted?: boolean;
	onPress?: () => void;
};

export function Glass({ children, style, borderRadius = 24, strong, tinted, onPress }: Props) {
	const { dark } = useTheme();

	const bg = dark
		? strong
			? "rgba(30,28,24,0.55)"
			: "rgba(40,38,34,0.35)"
		: strong
			? "rgba(255,255,255,0.55)"
			: "rgba(255,255,255,0.38)";

	const borderColor = dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.55)";

	const tintColors: [string, string] | null = tinted
		? dark
			? ["rgba(66,160,101,0.22)", "rgba(42,122,68,0.05)"]
			: ["rgba(66,160,101,0.18)", "rgba(255,255,255,0.15)"]
		: null;

	const Wrapper = onPress ? Pressable : View;

	return (
		<Wrapper onPress={onPress} style={[{ borderRadius, overflow: "hidden" }, style]}>
			<BlurView
				intensity={80}
				tint={dark ? "dark" : "light"}
				style={StyleSheet.absoluteFillObject}
			/>
			<View
				style={[
					StyleSheet.absoluteFillObject,
					{
						backgroundColor: bg,
						borderWidth: 1,
						borderColor,
						borderRadius,
					},
				]}
			/>
			{tintColors && (
				<LinearGradient
					colors={tintColors}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={StyleSheet.absoluteFillObject}
				/>
			)}
			{children}
		</Wrapper>
	);
}
