"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { type Locale, type TranslationKey, translations } from "./translations";

interface I18nContextValue {
	locale: Locale;
	setLocale: (locale: Locale) => void;
	t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>("en");

	useEffect(() => {
		const saved = localStorage.getItem("claake-locale") as Locale | null;
		if (saved && (saved === "en" || saved === "fr")) {
			setLocaleState(saved);
		}
	}, []);

	const setLocale = useCallback((newLocale: Locale) => {
		setLocaleState(newLocale);
		localStorage.setItem("claake-locale", newLocale);
		document.documentElement.lang = newLocale;
	}, []);

	const t = useCallback(
		(key: TranslationKey) => {
			return translations[locale][key] ?? key;
		},
		[locale],
	);

	return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
	const context = useContext(I18nContext);
	if (!context) throw new Error("useI18n must be used within I18nProvider");
	return context;
}
