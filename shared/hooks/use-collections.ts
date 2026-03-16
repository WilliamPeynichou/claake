import { useCallback, useEffect, useState } from "react";
import type { ApiClient } from "../api/client";
import type { Collection } from "../types";

export function useCollections(apiClient: ApiClient, token: string | null) {
	const [collections, setCollections] = useState<Collection[]>([]);
	const [loading, setLoading] = useState(false);

	const refresh = useCallback(async () => {
		if (!token) return;
		setLoading(true);
		try {
			const data = await apiClient.collections.list(token);
			setCollections(data);
		} catch {
			// ignore
		} finally {
			setLoading(false);
		}
	}, [apiClient, token]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const create = useCallback(
		async (data: { name: string; description?: string; is_public?: boolean }) => {
			if (!token) return null;
			const collection = await apiClient.collections.create(data, token);
			await refresh();
			return collection;
		},
		[apiClient, token, refresh],
	);

	const remove = useCallback(
		async (id: string) => {
			if (!token) return;
			await apiClient.collections.delete(id, token);
			await refresh();
		},
		[apiClient, token, refresh],
	);

	const addAgent = useCallback(
		async (collectionId: string, agentId: string) => {
			if (!token) return;
			await apiClient.collections.addAgent(collectionId, agentId, token);
			await refresh();
		},
		[apiClient, token, refresh],
	);

	const removeAgent = useCallback(
		async (collectionId: string, agentId: string) => {
			if (!token) return;
			await apiClient.collections.removeAgent(collectionId, agentId, token);
			await refresh();
		},
		[apiClient, token, refresh],
	);

	return { collections, loading, create, remove, addAgent, removeAgent, refresh };
}
