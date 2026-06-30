import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import { Animated, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useRipple } from "../hooks/useRipple";
import { BRAND, fonts, radius } from "../theme/brand";
import { useTheme } from "../theme/ThemeContext";

type Size = "sm" | "md" | "lg";

type Props = {
	children?: React.ReactNode;
	onPress?: () => void;
	primary?: boolean;
	icon?: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	size?: Size;
	disabled?: boolean;
};

const paddingMap: Record<Size, [number, number]> = { sm: [8, 14], md: [11, 18], lg: [14, 22] };
const fontSizeMap: Record<Size, number> = { sm: 12, md: 13, lg: 15 };

export function GlassButton({
	children,
	onPress,
	primary,
	icon,
	style,
	size = "md",
	disabled,
}: Props) {
	const { dark } = useTheme();
	const { onPress: addRipple, nodes } = useRipple();
	const scale = useRef(new Animated.Value(1)).current;

	const [py, px] = paddingMap[size];
	const fontSize = fontSizeMap[size];

	const handlePress = (e: Parameters<typeof addRipple>[0]) => {
		addRipple(e);
		onPress?.();
	};

	const pressIn = () =>
		Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
	const pressOut = () =>
		Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

	const color = primary ? "#fff" : dark ? "#f4f0e8" : "#1c1a16";
	const borderColor = primary
		? "rgba(255,255,255,0.3)"
		: dark
			? "rgba(255,255,255,0.14)"
			: "rgba(255,255,255,0.7)";

	return (
		<Animated.View style={[{ transform: [{ scale }] }, style]}>
			<Pressable
				onPress={handlePress}
				onPressIn={pressIn}
				onPressOut={pressOut}
				disabled={disabled}
				style={[
					styles.btn,
					{
						paddingVertical: py,
						paddingHorizontal: px,
						borderRadius: radius.full,
						borderColor,
						borderWidth: 1,
					},
					primary && styles.primaryShadow,
					!primary && dark && styles.glassDarkShadow,
					!primary && !dark && styles.glassLightShadow,
				]}
			>
				{!primary && (
					<BlurView
						intensity={50}
						tint={dark ? "dark" : "light"}
						style={StyleSheet.absoluteFillObject}
					/>
				)}
				{primary && (
					<LinearGradient
						colors={
							dark
								? ["rgba(80,180,120,0.75)", "rgba(42,122,68,0.85)"]
								: ["rgba(66,160,101,0.92)", "rgba(42,122,68,1)"]
						}
						start={{ x: 0, y: 0 }}
						end={{ x: 0, y: 1 }}
						style={StyleSheet.absoluteFillObject}
					/>
				)}
				{!primary && (
					<View
						style={[
							StyleSheet.absoluteFillObject,
							{ backgroundColor: dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.45)" },
						]}
					/>
				)}
				<View style={styles.inner}>
					{icon && <View>{icon}</View>}
					{children && (
						<Text style={{ color, fontFamily: fonts.sansMedium, fontSize, letterSpacing: -0.05 }}>
							{children}
						</Text>
					)}
				</View>
				{nodes}
			</Pressable>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	btn: {
		position: "relative",
		overflow: "hidden",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	inner: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
	primaryShadow: {
		shadowColor: BRAND.brand,
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.45,
		shadowRadius: 20,
		elevation: 8,
	},
	glassDarkShadow: {
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.4,
		shadowRadius: 12,
		elevation: 4,
	},
	glassLightShadow: {
		shadowColor: "rgba(0,0,0,0.15)",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 1,
		shadowRadius: 16,
		elevation: 4,
	},
});
