import type { Agent } from "../types";

/** Search and filter agents — reusable across all frontends. */
export function searchAgents(agents: Agent[], query: string, category?: string): Agent[] {
	let results = agents.filter((a) => a.status === "approved");

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

export function getFeaturedAgents(agents: Agent[], limit = 3): Agent[] {
	return [...agents]
		.filter((a) => a.status === "approved")
		.sort((a, b) => b.download_count - a.download_count)
		.slice(0, limit);
}

export function getTrendingAgents(agents: Agent[], limit = 4): Agent[] {
	return [...agents]
		.filter((a) => a.status === "approved")
		.sort((a, b) => b.rating - a.rating)
		.slice(0, limit);
}

export function getAgentsByCategory(agents: Agent[], category: string): Agent[] {
	return agents.filter((a) => a.category === category && a.status === "approved");
}

export function getAgentById(agents: Agent[], id: string): Agent | null {
	return agents.find((a) => a.id === id) ?? null;
}

export function getProviderFromModel(model: string): string {
	if (model.includes("claude")) return "anthropic";
	if (model.includes("gpt") || model.includes("o1")) return "openai";
	if (model.includes("gemini")) return "google";
	if (model.includes("mistral")) return "mistral";
	return "unknown";
}

export function maskApiKey(key: string): string {
	if (key.length <= 8) return "••••••••";
	return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}
