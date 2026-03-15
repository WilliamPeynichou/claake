import type {
	AdminPermissions,
	Agent,
	AgentCategory,
	ChatMessage,
	ChatSession,
	UserProfile,
	ValidationResult,
} from "../types";

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
			mine: (token: string) =>
				fetchJson<AgentListResponse>("/agents/mine", withAuth(token)),
			create: (agent: Partial<Agent>, token: string) =>
				fetchJson<Agent & { validation: ValidationResult }>(
					"/agents",
					withAuth(token, {
						method: "POST",
						body: JSON.stringify(agent),
					}),
				),
			review: (
				agentId: string,
				decision: "approve" | "reject",
				token: string,
				reason?: string,
			) =>
				fetchJson<{ status: string; reason?: string }>(
					`/agents/${agentId}/review`,
					withAuth(token, {
						method: "PATCH",
						body: JSON.stringify({ decision, reason }),
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
			updateRole: (
				userId: string,
				role: string,
				adminPermissions: AdminPermissions | null,
				token: string,
			) =>
				fetchJson<UserProfile>(
					`/users/${userId}/role`,
					withAuth(token, {
						method: "PATCH",
						body: JSON.stringify({ role, admin_permissions: adminPermissions }),
					}),
				),
		},
		chat: {
			createSession: (agentId: string, token: string) =>
				fetchJson<{ id: string; agent_id: string; created_at: string }>(
					"/chat/sessions",
					withAuth(token, {
						method: "POST",
						body: JSON.stringify({ agent_id: agentId }),
					}),
				),
			listSessions: (token: string, limit = 20, offset = 0) =>
				fetchJson<{ sessions: ChatSession[]; total: number }>(
					`/chat/sessions?limit=${limit}&offset=${offset}`,
					withAuth(token),
				),
			getMessages: (sessionId: string, token: string, limit = 50, offset = 0) =>
				fetchJson<{ messages: ChatMessage[]; total: number }>(
					`/chat/sessions/${sessionId}/messages?limit=${limit}&offset=${offset}`,
					withAuth(token),
				),
			sendMessageSSE: (sessionId: string, content: string, token: string) =>
				fetch(`${baseUrl}/chat/sessions/${sessionId}/messages`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ content }),
				}),
			deleteSession: (sessionId: string, token: string) =>
				fetchJson<{ deleted: boolean }>(
					`/chat/sessions/${sessionId}`,
					withAuth(token, { method: "DELETE" }),
				),
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
