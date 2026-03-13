import { AGENT_CATEGORIES, MOCK_AGENTS } from "@agentplace/shared";

export { MOCK_AGENTS, AGENT_CATEGORIES };

export function getAgentsByCategory(category: string) {
	return MOCK_AGENTS.filter((a) => a.category === category);
}

export function getFeaturedAgents() {
	return MOCK_AGENTS.sort((a, b) => b.downloads_count - a.downloads_count).slice(0, 3);
}

export function getTrendingAgents() {
	return MOCK_AGENTS.sort((a, b) => b.average_rating - a.average_rating).slice(0, 4);
}

export function searchAgents(query: string, category?: string) {
	let results = MOCK_AGENTS.filter((a) => a.status === "published");

	if (query) {
		const q = query.toLowerCase();
		results = results.filter(
			(a) =>
				a.name.toLowerCase().includes(q) ||
				a.description.toLowerCase().includes(q) ||
				a.tags.some((t) => t.toLowerCase().includes(q)),
		);
	}

	if (category && category !== "all") {
		results = results.filter((a) => a.category === category);
	}

	return results;
}

export function getAgentById(id: string) {
	return MOCK_AGENTS.find((a) => a.id === id) ?? null;
}
