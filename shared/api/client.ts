import type {
	ActivityLog,
	AdminPermissions,
	Agent,
	AgentCategory,
	AgentChatConfig,
	AgentKnowledge,
	ApiKeyConfig,
	ChatMessage,
	ChatSession,
	Collection,
	CreateAgentInput,
	CreatorProfile,
	Favorite,
	Purchase,
	Review,
	UserProfile,
	ValidationResult,
} from "../types";
import type {
	CreateMcpServerInput,
	McpReviewDecision,
	McpReviewItem,
	McpServer,
	SelectMcpToolsInput,
	UpdateMcpServerInput,
} from "../types/mcp";

export interface AgentListResponse {
	agents: Agent[];
	total: number;
}

export interface AgentSearchParams {
	q?: string;
	category?: string;
	all?: boolean;
	pricing_model?: string;
	mode?: string;
	min_rating?: number;
	tags?: string[];
	sort_by?: string;
	page?: number;
	limit?: number;
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
			...init,
			headers: {
				"Content-Type": "application/json",
				...init?.headers,
			},
		});
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			// AllExceptionsFilter returns { error: { code, message, statusCode } }
			const message =
				typeof body.error === "string"
					? body.error
					: (body.error?.message ?? `API error: ${res.status} ${res.statusText}`);
			throw new ApiError(res.status, message);
		}
		const json = await res.json();
		// Unwrap { data: ... } envelope from ResponseTransformInterceptor
		if (json && typeof json === "object" && "data" in json) {
			return json.data as T;
		}
		return json as T;
	}

	async function fetchForm<T>(path: string, form: FormData, token: string): Promise<T> {
		const res = await fetch(`${baseUrl}${path}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token}` },
			body: form,
		});
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			const message =
				typeof body.error === "string"
					? body.error
					: (body.error?.message ?? `API error: ${res.status} ${res.statusText}`);
			throw new ApiError(res.status, message);
		}
		const json = await res.json();
		return json && typeof json === "object" && "data" in json ? (json.data as T) : (json as T);
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
			list: (params?: AgentSearchParams, token?: string) => {
				const qs = new URLSearchParams();
				if (params?.q) qs.set("q", params.q);
				if (params?.category) qs.set("category", params.category);
				if (params?.all) qs.set("all", "true");
				if (params?.pricing_model) qs.set("pricing_model", params.pricing_model);
				if (params?.mode) qs.set("mode", params.mode);
				if (params?.min_rating) qs.set("min_rating", String(params.min_rating));
				if (params?.tags?.length) qs.set("tags", params.tags.join(","));
				if (params?.sort_by) qs.set("sort_by", params.sort_by);
				if (params?.page) qs.set("page", String(params.page));
				if (params?.limit) qs.set("limit", String(params.limit));
				const query = qs.toString();
				return fetchJson<AgentListResponse>(
					`/agents${query ? `?${query}` : ""}`,
					token ? withAuth(token) : undefined,
				);
			},
			get: (id: string) => fetchJson<Agent>(`/agents/${id}`),
			chatConfig: (id: string, token?: string) =>
				fetchJson<AgentChatConfig>(
					`/agents/${id}/chat-config`,
					token ? withAuth(token) : undefined,
				),
			knowledge: {
				list: (agentId: string, token: string) =>
					fetchJson<AgentKnowledge[]>(`/agents/${agentId}/knowledge`, withAuth(token)),
				create: (agentId: string, input: { title: string; content: string }, token: string) =>
					fetchJson<AgentKnowledge>(
						`/agents/${agentId}/knowledge`,
						withAuth(token, { method: "POST", body: JSON.stringify(input) }),
					),
				reindex: (agentId: string, token: string) =>
					fetchJson<{ indexed: number }>(
						`/agents/${agentId}/knowledge/reindex`,
						withAuth(token, { method: "POST" }),
					),
				createFromPdf: (agentId: string, file: Blob, fileName: string, token: string) => {
					const form = new FormData();
					form.append("file", file, fileName);
					return fetchForm<AgentKnowledge>(`/agents/${agentId}/knowledge/pdf`, form, token);
				},
				update: (
					agentId: string,
					knowledgeId: string,
					input: { title?: string; content?: string },
					token: string,
				) =>
					fetchJson<AgentKnowledge>(
						`/agents/${agentId}/knowledge/${knowledgeId}`,
						withAuth(token, { method: "PATCH", body: JSON.stringify(input) }),
					),
				delete: (agentId: string, knowledgeId: string, token: string) =>
					fetchJson<void>(
						`/agents/${agentId}/knowledge/${knowledgeId}`,
						withAuth(token, { method: "DELETE" }),
					),
			},
			mine: (token: string) => fetchJson<AgentListResponse>("/agents/mine", withAuth(token)),
			create: (agent: CreateAgentInput, token: string) =>
				fetchJson<Agent>(
					"/agents",
					withAuth(token, {
						method: "POST",
						body: JSON.stringify(agent),
					}),
				),
			update: (agentId: string, agent: Partial<CreateAgentInput>, token: string) =>
				fetchJson<Agent>(
					`/agents/${agentId}`,
					withAuth(token, {
						method: "PATCH",
						body: JSON.stringify(agent),
					}),
				),
			review: (
				agentId: string,
				decision: "approve" | "reject" | "suspend" | "back_to_draft",
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
			submit: (agentId: string, token: string) =>
				fetchJson<ValidationResult>(
					`/agents/${agentId}/submit`,
					withAuth(token, { method: "PATCH" }),
				),
			downloadInfo: (agentId: string, token: string) =>
				fetchJson<{
					docker_image: string | null;
					download_url: string | null;
					models: string[];
					system_prompt: string | null;
				}>(`/agents/${agentId}/download-info`, withAuth(token)),
			delete: async (agentId: string, token: string): Promise<void> => {
				const res = await fetch(
					`${baseUrl}/agents/${agentId}`,
					withAuth(token, { method: "DELETE" }),
				);
				if (!res.ok) {
					const body = await res.json().catch(() => ({}));
					const message =
						typeof body.error === "string"
							? body.error
							: (body.error?.message ?? `API error: ${res.status} ${res.statusText}`);
					throw new ApiError(res.status, message);
				}
			},
			unpublish: (agentId: string, token: string) =>
				fetchJson<{ status: string }>(
					`/agents/${agentId}/unpublish`,
					withAuth(token, { method: "PATCH" }),
				),
			mcp: {
				list: (agentId: string, token: string) =>
					fetchJson<McpServer[]>(`/agents/${agentId}/mcp`, withAuth(token)),
				create: (agentId: string, input: CreateMcpServerInput, token: string) =>
					fetchJson<McpServer>(
						`/agents/${agentId}/mcp`,
						withAuth(token, { method: "POST", body: JSON.stringify(input) }),
					),
				update: (agentId: string, serverId: string, input: UpdateMcpServerInput, token: string) =>
					fetchJson<McpServer>(
						`/agents/${agentId}/mcp/${serverId}`,
						withAuth(token, { method: "PATCH", body: JSON.stringify(input) }),
					),
				delete: (agentId: string, serverId: string, token: string) =>
					fetchJson<{ deleted: boolean }>(
						`/agents/${agentId}/mcp/${serverId}`,
						withAuth(token, { method: "DELETE" }),
					),
				discover: (agentId: string, serverId: string, token: string) =>
					fetchJson<McpServer>(
						`/agents/${agentId}/mcp/${serverId}/discover`,
						withAuth(token, { method: "POST" }),
					),
				selectTools: (
					agentId: string,
					serverId: string,
					input: SelectMcpToolsInput,
					token: string,
				) =>
					fetchJson<McpServer>(
						`/agents/${agentId}/mcp/${serverId}/tools`,
						withAuth(token, { method: "PATCH", body: JSON.stringify(input) }),
					),
				submit: (agentId: string, serverId: string, token: string) =>
					fetchJson<McpServer>(
						`/agents/${agentId}/mcp/${serverId}/submit`,
						withAuth(token, { method: "POST" }),
					),
			},
		},
		admin: {
			mcp: {
				list: (token: string) => fetchJson<McpReviewItem[]>("/admin/mcp/pending", withAuth(token)),
				review: (serverId: string, decision: McpReviewDecision, token: string, reason?: string) =>
					fetchJson<McpServer>(
						`/admin/mcp/${serverId}/review`,
						withAuth(token, {
							method: "PATCH",
							body: JSON.stringify({ decision, reason }),
						}),
					),
			},
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
			createSession: (agentId: string, token: string, options?: { test_mode?: boolean }) =>
				fetchJson<{ id: string; agent_id: string; created_at: string }>(
					"/chat/sessions",
					withAuth(token, {
						method: "POST",
						body: JSON.stringify({ agent_id: agentId, ...(options ?? {}) }),
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
			sendMessageSSE: (sessionId: string, content: string, token: string, fileIds?: string[]) =>
				fetch(`${baseUrl}/chat/sessions/${sessionId}/messages`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ content, ...(fileIds?.length ? { file_ids: fileIds } : {}) }),
				}),
			uploadFile: (file: File, token: string, opts: { sessionId?: string; agentId?: string }) => {
				const formData = new FormData();
				formData.append("file", file);
				const params = new URLSearchParams();
				if (opts.sessionId) params.set("sessionId", opts.sessionId);
				if (opts.agentId) params.set("agentId", opts.agentId);
				return fetch(`${baseUrl}/uploads?${params}`, {
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
					body: formData,
				});
			},
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
			apiKeys: {
				list: (token: string) => fetchJson<ApiKeyConfig[]>("/auth/api-keys", withAuth(token)),
				add: (provider: string, label: string, key: string, token: string) =>
					fetchJson<ApiKeyConfig>(
						"/auth/api-keys",
						withAuth(token, {
							method: "POST",
							body: JSON.stringify({ provider, label, key }),
						}),
					),
				remove: (keyId: string, token: string) =>
					fetchJson<{ deleted: boolean }>(
						`/auth/api-keys/${keyId}`,
						withAuth(token, { method: "DELETE" }),
					),
			},
		},
		favorites: {
			toggle: (agentId: string, token: string) =>
				fetchJson<{ favorited: boolean }>(
					`/favorites/${agentId}`,
					withAuth(token, { method: "POST" }),
				),
			list: (token: string) => fetchJson<Favorite[]>("/favorites", withAuth(token)),
			check: (agentId: string, token: string) =>
				fetchJson<{ favorited: boolean }>(`/favorites/check/${agentId}`, withAuth(token)),
		},
		collections: {
			list: (token: string) => fetchJson<Collection[]>("/collections", withAuth(token)),
			get: (id: string, token: string) =>
				fetchJson<Collection>(`/collections/${id}`, withAuth(token)),
			create: (data: { name: string; description?: string; is_public?: boolean }, token: string) =>
				fetchJson<Collection>(
					"/collections",
					withAuth(token, {
						method: "POST",
						body: JSON.stringify(data),
					}),
				),
			update: (
				id: string,
				data: { name?: string; description?: string; is_public?: boolean },
				token: string,
			) =>
				fetchJson<Collection>(
					`/collections/${id}`,
					withAuth(token, {
						method: "PATCH",
						body: JSON.stringify(data),
					}),
				),
			delete: (id: string, token: string) =>
				fetchJson<{ deleted: boolean }>(
					`/collections/${id}`,
					withAuth(token, { method: "DELETE" }),
				),
			addAgent: (id: string, agentId: string, token: string) =>
				fetchJson<Collection>(
					`/collections/${id}/agents/${agentId}`,
					withAuth(token, { method: "POST" }),
				),
			removeAgent: (id: string, agentId: string, token: string) =>
				fetchJson<Collection>(
					`/collections/${id}/agents/${agentId}`,
					withAuth(token, { method: "DELETE" }),
				),
		},
		reviews: {
			list: (agentId: string, page = 1, limit = 10) =>
				fetchJson<{ reviews: Review[]; total: number }>(
					`/agents/${agentId}/reviews?page=${page}&limit=${limit}`,
				),
			create: (agentId: string, data: { rating: number; comment?: string }, token: string) =>
				fetchJson<Review>(
					`/agents/${agentId}/reviews`,
					withAuth(token, {
						method: "POST",
						body: JSON.stringify(data),
					}),
				),
			update: (
				agentId: string,
				reviewId: string,
				data: { rating?: number; comment?: string },
				token: string,
			) =>
				fetchJson<Review>(
					`/agents/${agentId}/reviews/${reviewId}`,
					withAuth(token, {
						method: "PATCH",
						body: JSON.stringify(data),
					}),
				),
			delete: (agentId: string, reviewId: string, token: string) =>
				fetchJson<{ deleted: boolean }>(
					`/agents/${agentId}/reviews/${reviewId}`,
					withAuth(token, { method: "DELETE" }),
				),
		},
		payments: {
			checkout: (agentId: string, token: string) =>
				fetchJson<{ url: string }>(
					"/payments/checkout",
					withAuth(token, {
						method: "POST",
						body: JSON.stringify({ agent_id: agentId }),
					}),
				),
			purchases: (token: string) => fetchJson<Purchase[]>("/payments/purchases", withAuth(token)),
			checkAccess: (agentId: string, token: string) =>
				fetchJson<{ has_access: boolean }>(`/payments/access/${agentId}`, withAuth(token)),
			connectOnboard: (token: string) =>
				fetchJson<{ url: string }>(
					"/payments/connect/onboard",
					withAuth(token, { method: "POST" }),
				),
			connectStatus: (token: string) =>
				fetchJson<{ connected: boolean; details_submitted: boolean }>(
					"/payments/connect/status",
					withAuth(token),
				),
		},
		creators: {
			get: (id: string) => fetchJson<CreatorProfile>(`/creators/${id}`),
		},
		activity: {
			list: (token: string, params?: { action?: string; page?: number; limit?: number }) => {
				const qs = new URLSearchParams();
				if (params?.action) qs.set("action", params.action);
				if (params?.page) qs.set("page", String(params.page));
				if (params?.limit) qs.set("limit", String(params.limit));
				const query = qs.toString();
				return fetchJson<{ logs: ActivityLog[]; total: number }>(
					`/admin/activity${query ? `?${query}` : ""}`,
					withAuth(token),
				);
			},
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
