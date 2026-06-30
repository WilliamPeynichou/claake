import { useRef, useState } from "react";
import { Animated, type GestureResponderEvent, StyleSheet } from "react-native";

type Ripple = { id: number; x: number; y: number; anim: Animated.Value };

export function useRipple() {
	const [ripples, setRipples] = useState<Ripple[]>([]);
	const counter = useRef(0);

	const onPress = (e: GestureResponderEvent) => {
		const { locationX, locationY } = e.nativeEvent;
		const id = counter.current++;
		const anim = new Animated.Value(0);

		setRipples((rs) => [...rs, { id, x: locationX, y: locationY, anim }]);

		Animated.timing(anim, {
			toValue: 1,
			duration: 900,
			useNativeDriver: true,
		}).start(() => {
			setRipples((rs) => rs.filter((r) => r.id !== id));
		});
	};

	const nodes = ripples.map((r) => {
		const size = r.anim.interpolate({ inputRange: [0, 1], outputRange: [0, 280] });
		const opacity = r.anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.4, 0] });
		return (
			<Animated.View
				key={r.id}
				pointerEvents="none"
				style={[
					styles.ripple,
					{
						left: r.x,
						top: r.y,
						width: size,
						height: size,
						borderRadius: 140,
						marginLeft: -140,
						marginTop: -140,
						opacity,
					},
				]}
			/>
		);
	});

	return { onPress, nodes };
}

const styles = StyleSheet.create({
	ripple: {
		position: "absolute",
		backgroundColor: "rgba(255,255,255,0.45)",
	},
});
