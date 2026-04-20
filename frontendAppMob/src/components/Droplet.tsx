import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from "react-native-svg";

type Props = {
	size?: number;
	color?: string;
	drift?: boolean;
	driftDuration?: number;
	toX?: number;
	toY?: number;
	style?: object;
};

export function Droplet({
	size = 40,
	color = "#42a065",
	drift = false,
	driftDuration = 7500,
	toX = -8,
	toY = 14,
	style,
}: Props) {
	const tx = useRef(new Animated.Value(0)).current;
	const ty = useRef(new Animated.Value(0)).current;
	const sc = useRef(new Animated.Value(1)).current;

	// biome-ignore lint/correctness/useExhaustiveDependencies: animation runs once on mount
	useEffect(() => {
		if (!drift) return;
		const loop = (node: Animated.Value, to: number, dur: number) =>
			Animated.loop(
				Animated.sequence([
					Animated.timing(node, { toValue: to, duration: dur, useNativeDriver: true }),
					Animated.timing(node, { toValue: 0, duration: dur, useNativeDriver: true }),
				]),
			);
		const xa = loop(tx, toX, driftDuration);
		const ya = loop(ty, toY, Math.round(driftDuration * 1.2));
		const sa = loop(sc, 1.08, Math.round(driftDuration * 1.5));
		xa.start();
		ya.start();
		sa.start();
		return () => {
			xa.stop();
			ya.stop();
			sa.stop();
		};
	}, [drift]);

	const svgH = size * 1.18;

	const inner = (
		<Svg width={size} height={svgH} viewBox="0 0 40 48">
			<Defs>
				<RadialGradient id="dg" cx="35%" cy="30%" r="70%" gradientUnits="objectBoundingBox">
					<Stop offset="0%" stopColor="#fff" stopOpacity={0.7} />
					<Stop offset="60%" stopColor={color} stopOpacity={0.95} />
					<Stop offset="100%" stopColor={color} stopOpacity={1} />
				</RadialGradient>
			</Defs>
			<Path
				d="M20 2 C 20 16, 38 22, 38 32 C 38 41, 30 46, 20 46 C 10 46, 2 41, 2 32 C 2 22, 20 16, 20 2 Z"
				fill="url(#dg)"
			/>
			<Ellipse cx="14" cy="14" rx="4" ry="2.5" fill="rgba(255,255,255,0.75)" />
		</Svg>
	);

	if (!drift) return <Animated.View style={style}>{inner}</Animated.View>;

	return (
		<Animated.View
			style={[style, { transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }] }]}
		>
			{inner}
		</Animated.View>
	);
}
