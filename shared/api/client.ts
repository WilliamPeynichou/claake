import type { Agent } from "../types";

export function createApiClient(baseUrl: string) {
	async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
		const res = await fetch(`${baseUrl}${path}`, {
			headers: { "Content-Type": "application/json" },
			...init,
		});
		if (!res.ok) {
			throw new Error(`API error: ${res.status} ${res.statusText}`);
		}
		return res.json();
	}

	return {
		agents: {
			list: () => fetchJson<Agent[]>("/agents"),
			get: (id: string) => fetchJson<Agent>(`/agents/${id}`),
		},
	};
}

export type ApiClient = ReturnType<typeof createApiClient>;
