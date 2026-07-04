"use client";

import type { Agent, AgentChatConfig } from "@claake/shared";
import { useChat } from "@claake/shared/hooks";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

/**
 * Orchestre tout l'état nécessaire pour afficher un agent dans le chat :
 * - auth ;
 * - chargement du contrat `AgentChatConfig` (règle métier côté backend) ;
 * - liste des agents (pour la sidebar) ;
 * - sessions et messages (via `useChat`) ;
 * - navigation liée à l'accès (login requis, clé API requise).
 *
 * Le composant qui consomme ce hook ne doit pas recalculer de règle métier :
 * il affiche uniquement les états renvoyés ici.
 */
export function useAgentChat(agentId: string, options: { testMode?: boolean } = {}) {
	const router = useRouter();
	const { token, loading: authLoading } = useAuth();

	const [agents, setAgents] = useState<Agent[]>([]);
	const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
	const [chatConfig, setChatConfig] = useState<AgentChatConfig | null>(null);
	const [chatConfigLoading, setChatConfigLoading] = useState(true);
	const [chatConfigError, setChatConfigError] = useState<string | null>(null);

	// Test mode : demandé via `?test=1`, ou forcé quand l'agent n'est pas publié
	// mais que le backend autorise le chat (owner draft/rejected, admin pending).
	// Le backend re-vérifie les droits ; ce flag évite juste une création de session refusée.
	const testMode =
		options.testMode === true ||
		(chatConfig !== null && chatConfig.status !== "approved" && chatConfig.access.can_chat);

	const chat = useChat({
		apiClient,
		token: token ?? "",
		agentId,
		testMode,
	});
	const { loadSession, createSession, deleteSession, refreshSessions } = chat;

	useEffect(() => {
		apiClient.agents
			.list({ limit: 100 })
			.then((res) => {
				setAgents(res.agents);
				const found = res.agents.find((a) => a.id === agentId);
				if (found) setCurrentAgent(found);
			})
			.catch(() => {});
	}, [agentId]);

	useEffect(() => {
		if (authLoading) return;
		setChatConfigLoading(true);
		setChatConfigError(null);
		apiClient.agents
			.chatConfig(agentId, token ?? undefined)
			.then(setChatConfig)
			.catch((err) => {
				setChatConfigError(
					err instanceof Error ? err.message : "Impossible de charger la configuration du chat.",
				);
			})
			.finally(() => setChatConfigLoading(false));
	}, [agentId, authLoading, token]);

	const handleSelectSession = useCallback(
		async (sessionId: string) => {
			await loadSession(sessionId);
		},
		[loadSession],
	);

	const handleNewChat = useCallback(async () => {
		await createSession(agentId);
		await refreshSessions();
	}, [agentId, createSession, refreshSessions]);

	const handleDeleteSession = useCallback(
		async (sessionId: string) => {
			await deleteSession(sessionId);
		},
		[deleteSession],
	);

	const goToLogin = useCallback(() => router.push("/login"), [router]);
	const goToApiKeys = useCallback(() => {
		const provider =
			chatConfig?.access.required_provider ?? chatConfig?.required_user_provider ?? "";
		const params = new URLSearchParams({ returnTo: `/chat/${agentId}` });
		if (provider) params.set("provider", provider);
		router.push(`/dashboard/api-keys?${params.toString()}`);
	}, [router, agentId, chatConfig]);

	const displayAgent = chatConfig ?? currentAgent;
	const accessNotice = chatConfig?.access.can_chat === false ? chatConfig.access : null;
	const loading = authLoading || chatConfigLoading;
	const loginRequired = !token || chatConfig?.access.reason === "login_required";

	return {
		...chat,
		testMode,
		token,
		loading,
		loginRequired,
		agents,
		currentAgent,
		chatConfig,
		chatConfigError,
		displayAgent,
		accessNotice,
		goToLogin,
		goToApiKeys,
		handleSelectSession,
		handleNewChat,
		handleDeleteSession,
	};
}

export type UseAgentChatReturn = ReturnType<typeof useAgentChat>;
