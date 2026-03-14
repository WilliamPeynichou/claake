import type { Agent, AgentCategory, UserProfile } from "../types";

export interface ChatRequest {
	agent_id: string;
	message: string;
	api_key?: string;
	history: Array<{ role: string; content: string }>;
	system_prompt?: string;
	model: string;
}

export interface ChatResponse {
	content: string;
}

export interface AgentListResponse {
	agents: Agent[];
	total: number;
}

export interface AgentSearchParams {
	q?: string;
	category?: string;
	all?: boolean;
}

export interface DashboardStats {
	agents_used: number;
	conversations: number;
	agents_published: number;
	rating: string;
}

export interface AdminStats {
	published_agents: number;
	users: number;
	pending_review: number;
	chat_sessions: number;
}

export interface UserWithAgentsCount extends UserProfile {
	agents_count: number;
}

export function createApiClient(baseUrl: string) {
	async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
		const res = await fetch(`${baseUrl}${path}`, {
			headers: { "Content-Type": "application/json" },
			...init,
		});
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new ApiError(res.status, body.error ?? `API error: ${res.status} ${res.statusText}`);
		}
		const json = await res.json();
		// Unwrap { data: ... } envelope from ResponseTransformInterceptor
		if (json && typeof json === "object" && "data" in json) {
			return json.data as T;
		}
		return json as T;
	}

	function withAuth(token: string, init?: RequestInit): RequestInit {
		return {
			...init,
			headers: {
				...init?.headers,
				Authorization: `Bearer ${token}`,
			},
		};
	}

	return {
		agents: {
			list: (params?: AgentSearchParams) => {
				const qs = new URLSearchParams();
				if (params?.q) qs.set("q", params.q);
				if (params?.category) qs.set("category", params.category);
				if (params?.all) qs.set("all", "true");
				const query = qs.toString();
				return fetchJson<AgentListResponse>(`/agents${query ? `?${query}` : ""}`);
			},
			get: (id: string) => fetchJson<Agent>(`/agents/${id}`),
			create: (agent: Partial<Agent>, token: string) =>
				fetchJson<Agent>(
					"/agents",
					withAuth(token, {
						method: "POST",
						body: JSON.stringify(agent),
					}),
				),
		},
		categories: {
			list: () => fetchJson<AgentCategory[]>("/categories"),
		},
		stats: {
			dashboard: (token: string) => fetchJson<DashboardStats>("/stats/dashboard", withAuth(token)),
			admin: (token: string) => fetchJson<AdminStats>("/stats/admin", withAuth(token)),
		},
		users: {
			list: (token: string) => fetchJson<UserWithAgentsCount[]>("/users", withAuth(token)),
		},
		chat: {
			send: (req: ChatRequest) =>
				fetchJson<ChatResponse>("/chat", {
					method: "POST",
					body: JSON.stringify(req),
				}),
		},
		auth: {
			profile: (token: string) => fetchJson<UserProfile>("/auth/profile", withAuth(token)),
			updateProfile: (data: Partial<UserProfile>, token: string) =>
				fetchJson<UserProfile>(
					"/auth/profile",
					withAuth(token, {
						method: "PATCH",
						body: JSON.stringify(data),
					}),
				),
		},
	};
}

export type ApiClient = ReturnType<typeof createApiClient>;

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
		this.name = "ApiError";
	}
}
