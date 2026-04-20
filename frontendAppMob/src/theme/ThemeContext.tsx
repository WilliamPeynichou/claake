import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { type PaletteColors, palette } from "./brand";

type ThemeCtx = {
	dark: boolean;
	setDark: (b: boolean) => void;
	c: PaletteColors;
};

const ThemeContext = createContext<ThemeCtx>({
	dark: true,
	setDark: () => {},
	c: palette.dark,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [dark, setDarkState] = useState(true);

	useEffect(() => {
		AsyncStorage.getItem("claake.dark").then((v) => {
			if (v !== null) setDarkState(v === "1");
		});
	}, []);

	const setDark = (b: boolean) => {
		setDarkState(b);
		AsyncStorage.setItem("claake.dark", b ? "1" : "0");
	};

	return (
		<ThemeContext.Provider value={{ dark, setDark, c: dark ? palette.dark : palette.light }}>
			{children}
		</ThemeContext.Provider>
	);
}

export const useTheme = () => useContext(ThemeContext);
