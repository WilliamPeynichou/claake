import Svg, { Circle, Path } from "react-native-svg";

type Props = {
	size?: number;
	color?: string;
	bgColor?: string;
};

export function ClaakeMark({ size = 40, color = "#2a7a44", bgColor = "#fff" }: Props) {
	return (
		<Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
			<Circle cx="32" cy="14" r="5" fill={color} />
			<Path
				d="M8 26 C 8 44, 24 56, 32 56 C 40 56, 56 44, 56 26 C 50 24, 44 26, 40 30 C 36 34, 34 40, 32 40 C 30 40, 28 34, 24 30 C 20 26, 14 24, 8 26 Z"
				fill={color}
			/>
			<Circle cx="32" cy="40" r="5.5" fill={bgColor} />
		</Svg>
	);
}
