import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiClient } from "../api/client";
import { getFeaturedAgents, getTrendingAgents, searchAgents } from "../lib/agents";
import type { Agent } from "../types";

export interface UseAgentsOptions {
	apiClient: ApiClient;
}

export interface UseAgentsReturn {
	agents: Agent[];
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * Fetch all agents from the backend.
 * Falls back to MOCK_AGENTS during MVP (pass them as initialData).
 */
export function useAgents({ apiClient }: UseAgentsOptions): UseAgentsReturn {
	const [agents, setAgents] = useState<Agent[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAgents = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await apiClient.agents.list();
			setAgents(data.agents);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erreur lors du chargement des agents.");
		} finally {
			setLoading(false);
		}
	}, [apiClient]);

	useEffect(() => {
		fetchAgents();
	}, [fetchAgents]);

	return { agents, loading, error, refetch: fetchAgents };
}

export interface UseAgentSearchOptions {
	agents: Agent[];
	query: string;
	category?: string;
}

/** Client-side search/filter on a pre-loaded agent list. */
export function useAgentSearch({ agents, query, category }: UseAgentSearchOptions): Agent[] {
	return useMemo(() => searchAgents(agents, query, category), [agents, query, category]);
}

/** Get featured agents from a list. */
export function useFeaturedAgents(agents: Agent[], limit?: number): Agent[] {
	return useMemo(() => getFeaturedAgents(agents, limit), [agents, limit]);
}

/** Get trending agents from a list. */
export function useTrendingAgents(agents: Agent[], limit?: number): Agent[] {
	return useMemo(() => getTrendingAgents(agents, limit), [agents, limit]);
}
