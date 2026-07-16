import { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

const { width, height } = Dimensions.get("window");

type BlobConfig = {
	topPct: number;
	leftPct: number;
	size: number;
	durationMs: number;
	toX: number;
	toY: number;
	toScale: number;
	delay?: number;
	darkColor: string;
	lightColor: string;
};

function Blob({
	topPct,
	leftPct,
	size,
	durationMs,
	toX,
	toY,
	toScale,
	delay = 0,
	darkColor,
	lightColor,
}: BlobConfig) {
	const { dark } = useTheme();
	const tx = useRef(new Animated.Value(0)).current;
	const ty = useRef(new Animated.Value(0)).current;
	const sc = useRef(new Animated.Value(1)).current;

	// biome-ignore lint/correctness/useExhaustiveDependencies: animation runs once on mount
	useEffect(() => {
		const loop = (node: Animated.Value, toValue: number, dur: number) =>
			Animated.loop(
				Animated.sequence([
					Animated.timing(node, { toValue, duration: dur, useNativeDriver: true, delay }),
					Animated.timing(node, { toValue: 0, duration: dur, useNativeDriver: true }),
				]),
			);
		const xa = loop(tx, toX, durationMs);
		const ya = loop(ty, toY, Math.round(durationMs * 1.3));
		const sa = loop(sc, toScale, Math.round(durationMs * 1.6));
		xa.start();
		ya.start();
		sa.start();
		return () => {
			xa.stop();
			ya.stop();
			sa.stop();
		};
	}, []);

	return (
		<Animated.View
			style={{
				position: "absolute",
				top: height * topPct - size / 2,
				left: width * leftPct - size / 2,
				width: size,
				height: size,
				borderRadius: size / 2,
				backgroundColor: dark ? darkColor : lightColor,
				transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }],
			}}
		/>
	);
}

const BLOBS: BlobConfig[] = [
	{
		topPct: 0.08,
		leftPct: 0.1,
		size: 360,
		durationMs: 18000,
		toX: 40,
		toY: 60,
		toScale: 1.15,
		darkColor: "rgba(66,160,101,0.45)",
		lightColor: "rgba(66,160,101,0.32)",
	},
	{
		topPct: 0.55,
		leftPct: 0.9,
		size: 320,
		durationMs: 22000,
		toX: -50,
		toY: -40,
		toScale: 1.12,
		delay: 1500,
		darkColor: "rgba(80,180,120,0.30)",
		lightColor: "rgba(150,220,180,0.45)",
	},
	{
		topPct: 0.7,
		leftPct: 0.6,
		size: 220,
		durationMs: 15000,
		toX: -30,
		toY: 50,
		toScale: 0.88,
		delay: 3000,
		darkColor: "rgba(42,122,68,0.35)",
		lightColor: "rgba(200,240,215,0.55)",
	},
];

export function BackgroundBlobs() {
	return (
		<View style={StyleSheet.absoluteFillObject} pointerEvents="none">
			{BLOBS.map((b) => (
				<Blob key={b.topPct} {...b} />
			))}
		</View>
	);
}
