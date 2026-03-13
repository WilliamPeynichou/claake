import {
	AGENT_CATEGORIES,
	MOCK_AGENTS,
	getAgentsByCategory as sharedGetByCategory,
	getAgentById as sharedGetById,
	getFeaturedAgents as sharedGetFeatured,
	getTrendingAgents as sharedGetTrending,
	searchAgents as sharedSearchAgents,
} from "@agentplace/shared";

export { AGENT_CATEGORIES, MOCK_AGENTS };

/**
 * Wrappers that use MOCK_AGENTS — delegates to shared pure functions.
 * Once the backend is live, these will be replaced by API calls via hooks.
 */
export function getAgentsByCategory(category: string) {
	return sharedGetByCategory(MOCK_AGENTS, category);
}

export function getFeaturedAgents() {
	return sharedGetFeatured(MOCK_AGENTS);
}

export function getTrendingAgents() {
	return sharedGetTrending(MOCK_AGENTS);
}

export function searchAgents(query: string, category?: string) {
	return sharedSearchAgents(MOCK_AGENTS, query, category);
}

export function getAgentById(id: string) {
	return sharedGetById(MOCK_AGENTS, id);
}
