import type { ReactNode } from "react";
import { View } from "react-native";
import { Glass } from "./Glass";

type Props = {
	icon: ReactNode;
	onPress?: () => void;
	size?: number;
};

export function IconGlass({ icon, onPress, size = 42 }: Props) {
	return (
		<Glass strong onPress={onPress} borderRadius={size / 2} style={{ width: size, height: size }}>
			<View
				style={{
					width: "100%",
					height: "100%",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{icon}
			</View>
		</Glass>
	);
}
