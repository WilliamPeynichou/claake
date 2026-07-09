export type AgentToolName = "knowledge_search" | "fetch_url" | "current_datetime";

export interface AgentToolConfig {
	name: AgentToolName;
	enabled: boolean;
	description?: string;
	config?: {
		allowed_domains?: string[];
		max_results?: number;
		timezone?: string;
	};
}

export interface PublicAgentTool {
	name: AgentToolName;
	description: string;
}

export function normalizeAgentTools(raw: unknown): AgentToolConfig[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.map((tool) => normalizeTool(tool))
		.filter((tool): tool is AgentToolConfig => tool !== null);
}

export function publicAgentTools(raw: unknown): PublicAgentTool[] {
	return normalizeAgentTools(raw)
		.filter((tool) => tool.enabled)
		.map((tool) => ({
			name: tool.name,
			description: tool.description ?? defaultToolDescription(tool.name),
		}));
}

export function defaultToolDescription(name: AgentToolName): string {
	switch (name) {
		case "knowledge_search":
			return "Recherche dans la base de connaissances de l'agent.";
		case "fetch_url":
			return "Lit une URL autorisée par l'agent.";
		case "current_datetime":
			return "Retourne la date et l'heure courantes.";
	}
}

function normalizeTool(raw: unknown): AgentToolConfig | null {
	if (!raw || typeof raw !== "object") return null;
	const data = raw as Record<string, unknown>;
	if (!isAgentToolName(data.name)) return null;
	return {
		name: data.name,
		enabled: data.enabled !== false,
		description: typeof data.description === "string" ? data.description.slice(0, 300) : undefined,
		config: normalizeToolConfig(data.config),
	};
}

function normalizeToolConfig(raw: unknown): AgentToolConfig["config"] {
	if (!raw || typeof raw !== "object") return undefined;
	const data = raw as Record<string, unknown>;
	const allowedDomains = Array.isArray(data.allowed_domains)
		? data.allowed_domains.filter((item): item is string => typeof item === "string").slice(0, 20)
		: undefined;
	return {
		allowed_domains: allowedDomains,
		max_results:
			typeof data.max_results === "number"
				? Math.min(Math.max(data.max_results, 1), 10)
				: undefined,
		timezone: typeof data.timezone === "string" ? data.timezone.slice(0, 80) : undefined,
	};
}

function isAgentToolName(value: unknown): value is AgentToolName {
	return value === "knowledge_search" || value === "fetch_url" || value === "current_datetime";
}
