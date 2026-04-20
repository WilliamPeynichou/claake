import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Tab = "catalogue" | "chat" | "library" | "profile";

type NavState = {
	tab: Tab;
	viewing: string | null;
	chatAgentId: string | null;
};

type NavCtx = NavState & {
	setTab: (tab: Tab) => void;
	openAgent: (id: string) => void;
	back: () => void;
	startChat: (agentId: string) => void;
	pickChat: (agentId: string) => void;
};

const NavContext = createContext<NavCtx>({
	tab: "catalogue",
	viewing: null,
	chatAgentId: null,
	setTab: () => {},
	openAgent: () => {},
	back: () => {},
	startChat: () => {},
	pickChat: () => {},
});

export function NavProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<NavState>({
		tab: "catalogue",
		viewing: null,
		chatAgentId: null,
	});

	useEffect(() => {
		Promise.all([
			AsyncStorage.getItem("claake.tab"),
			AsyncStorage.getItem("claake.viewing"),
			AsyncStorage.getItem("claake.chatAgent"),
		]).then(([tab, viewing, chatAgentId]) => {
			setState({
				tab: (tab as Tab) || "catalogue",
				viewing: viewing || null,
				chatAgentId: chatAgentId || null,
			});
		});
	}, []);

	const persist = (next: NavState) => {
		AsyncStorage.setItem("claake.tab", next.tab);
		AsyncStorage.setItem("claake.viewing", next.viewing ?? "");
		AsyncStorage.setItem("claake.chatAgent", next.chatAgentId ?? "");
		setState(next);
	};

	const ctx: NavCtx = {
		...state,
		setTab: (tab) => persist({ tab, viewing: null, chatAgentId: null }),
		openAgent: (id) => persist({ ...state, viewing: id }),
		back: () => persist({ ...state, viewing: null, chatAgentId: null }),
		startChat: (agentId) => persist({ tab: "chat", viewing: null, chatAgentId: agentId }),
		pickChat: (agentId) => persist({ ...state, chatAgentId: agentId }),
	};

	return <NavContext.Provider value={ctx}>{children}</NavContext.Provider>;
}

export const useNav = () => useContext(NavContext);
