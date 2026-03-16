import { useCallback, useEffect, useState } from "react";
import type { ApiClient } from "../api/client";
import type { Favorite } from "../types";

export function useFavorites(apiClient: ApiClient, token: string | null) {
	const [favorites, setFavorites] = useState<Favorite[]>([]);
	const [loading, setLoading] = useState(false);

	const refresh = useCallback(async () => {
		if (!token) return;
		setLoading(true);
		try {
			const data = await apiClient.favorites.list(token);
			setFavorites(data);
		} catch {
			// ignore
		} finally {
			setLoading(false);
		}
	}, [apiClient, token]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const toggle = useCallback(
		async (agentId: string) => {
			if (!token) return false;
			const result = await apiClient.favorites.toggle(agentId, token);
			await refresh();
			return result.favorited;
		},
		[apiClient, token, refresh],
	);

	const isFavorited = useCallback(
		(agentId: string) => favorites.some((f) => f.agent_id === agentId),
		[favorites],
	);

	return { favorites, loading, toggle, isFavorited, refresh };
}
