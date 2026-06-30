export const BRAND = {
	brand: "#2a7a44",
	brandLight: "#42a065",
	brandDark: "#1e5c34",
	brandAccent: "#7ec99a",
};

export const palette = {
	light: {
		bg: "#f6f1e8",
		bgDeep: "#e9e4da",
		ink: "#1c1a16",
		muted: "rgba(28,26,22,0.55)",
		faint: "rgba(28,26,22,0.25)",
		border: "rgba(28,26,22,0.08)",
		glass: "rgba(255,255,255,0.38)",
		glassStrong: "rgba(255,255,255,0.55)",
		glassBorder: "rgba(255,255,255,0.55)",
	},
	dark: {
		bg: "#0c0a08",
		bgDeep: "#050403",
		ink: "#f4f0e8",
		muted: "rgba(244,240,232,0.55)",
		faint: "rgba(244,240,232,0.25)",
		border: "rgba(255,255,255,0.08)",
		glass: "rgba(40,38,34,0.35)",
		glassStrong: "rgba(30,28,24,0.55)",
		glassBorder: "rgba(255,255,255,0.08)",
	},
};

export type PaletteColors = typeof palette.light;

export const fonts = {
	serif: "DMSerifDisplay_400Regular",
	serifItalic: "DMSerifDisplay_400Regular_Italic",
	sans: "DMSans_400Regular",
	sansMedium: "DMSans_500Medium",
	sansSemi: "DMSans_600SemiBold",
	sansBold: "DMSans_700Bold",
	mono: "JetBrainsMono_400Regular",
	monoMedium: "JetBrainsMono_500Medium",
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 8, md: 14, lg: 20, xl: 28, xxl: 32, full: 999 };

export const shadows = {
	card: {
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 12,
		elevation: 8,
	},
	glow: {
		shadowColor: "#2a7a44",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.4,
		shadowRadius: 20,
		elevation: 10,
	},
};
