import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const DEFAULT_FAV: Record<string, boolean> = { a1: true, a2: true, a3: true };

type FavCtx = {
	fav: Record<string, boolean>;
	toggleFav: (id: string) => void;
};

const FavContext = createContext<FavCtx>({ fav: DEFAULT_FAV, toggleFav: () => {} });

export function FavProvider({ children }: { children: React.ReactNode }) {
	const [fav, setFav] = useState(DEFAULT_FAV);

	useEffect(() => {
		AsyncStorage.getItem("claake.fav").then((v) => {
			if (v) {
				try {
					setFav(JSON.parse(v));
				} catch {}
			}
		});
	}, []);

	const toggleFav = (id: string) => {
		setFav((prev) => {
			const next = { ...prev, [id]: !prev[id] };
			AsyncStorage.setItem("claake.fav", JSON.stringify(next));
			return next;
		});
	};

	return <FavContext.Provider value={{ fav, toggleFav }}>{children}</FavContext.Provider>;
}

export const useFav = () => useContext(FavContext);
