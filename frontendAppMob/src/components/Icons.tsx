import Svg, { Circle, Path, Rect } from "react-native-svg";

type P = { size?: number; color?: string; fill?: string };

const sw = 1.6;

export function SearchIcon({ size = 20, color = "currentColor" }: P) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={sw} />
			<Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
		</Svg>
	);
}

export function ChatIcon({ size = 20, color = "currentColor" }: P) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M21 12a8 8 0 01-11.8 7L4 20l1-4.3A8 8 0 1121 12z"
				stroke={color}
				strokeWidth={sw}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function LibIcon({ size = 20, color = "currentColor" }: P) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path d="M6 4v16M18 4v16M12 8v12" stroke={color} strokeWidth={sw} strokeLinecap="round" />
		</Svg>
	);
}

export function UserIcon({ size = 20, color = "currentColor" }: P) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={sw} />
			<Path
				d="M4 21c0-4.5 4-7 8-7s8 2.5 8 7"
				stroke={color}
				strokeWidth={sw}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

export function SendIcon({ size = 20, color = "currentColor" }: P) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M22 2L11 13M22 2l-7 20-4-9-9-4z"
				stroke={color}
				strokeWidth={sw}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function BackIcon({ size = 20, color = "currentColor" }: P) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M19 12H5M12 19l-7-7 7-7"
				stroke={color}
				strokeWidth={sw}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function HeartIcon({ size = 20, color = "currentColor", fill = "none" }: P) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
			<Path
				d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"
				stroke={color}
				strokeWidth={1.5}
			/>
		</Svg>
	);
}

export function StarIcon({ size = 20, color = "currentColor", fill = "none" }: P) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
			<Path
				d="M12 3l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18l-5.9 3 1.2-6.5L2.5 9.9 9.1 9z"
				stroke={color}
				strokeWidth={1.5}
			/>
		</Svg>
	);
}

export function MoreIcon({ size = 20, color = "currentColor" }: P) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
			<Circle cx="5" cy="12" r="1.7" />
			<Circle cx="12" cy="12" r="1.7" />
			<Circle cx="19" cy="12" r="1.7" />
		</Svg>
	);
}

export function SparkleIcon({ size = 20, color = "currentColor" }: P) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
			<Path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5zM19 14l.8 2.7L22 17.5l-2.2.8L19 21l-.8-2.7L16 17.5l2.2-.8z" />
		</Svg>
	);
}

export function FilterIcon({ size = 20, color = "currentColor" }: P) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path d="M3 6h18M6 12h12M10 18h4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
		</Svg>
	);
}

export function PlusIcon({ size = 20, color = "currentColor" }: P) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
		</Svg>
	);
}

export function DownloadIcon({ size = 20, color = "currentColor" }: P) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d="M12 3v13M6 11l6 6 6-6M4 21h16"
				stroke={color}
				strokeWidth={sw}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function BotIcon({ size = 20, color = "currentColor" }: P) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Rect x="4" y="8" width="16" height="12" rx="4" stroke={color} strokeWidth={sw} />
			<Path d="M12 4v4M9 14h.01M15 14h.01" stroke={color} strokeWidth={sw} strokeLinecap="round" />
		</Svg>
	);
}
