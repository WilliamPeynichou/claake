import { useCallback, useEffect, useState } from "react";
import type { ApiClient } from "../api/client";
import type { ApiKeyConfig } from "../types";

export interface UseApiKeysReturn {
	keys: ApiKeyConfig[];
	loading: boolean;
	addKey: (provider: string, label: string, key: string) => Promise<ApiKeyConfig | undefined>;
	removeKey: (id: string) => Promise<void>;
	hasKeyForProvider: (provider: string) => boolean;
	refresh: () => Promise<void>;
}

export function useApiKeys(apiClient: ApiClient, token: string | null): UseApiKeysReturn {
	const [keys, setKeys] = useState<ApiKeyConfig[]>([]);
	const [loading, setLoading] = useState(false);

	const refresh = useCallback(async () => {
		if (!token) return;
		setLoading(true);
		try {
			const data = await apiClient.auth.apiKeys.list(token);
			setKeys(data);
		} catch {
			// ignore
		} finally {
			setLoading(false);
		}
	}, [apiClient, token]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const addKey = useCallback(
		async (provider: string, label: string, key: string) => {
			if (!token) return;
			const created = await apiClient.auth.apiKeys.add(provider, label, key, token);
			setKeys((prev) => [...prev, created]);
			return created;
		},
		[apiClient, token],
	);

	const removeKey = useCallback(
		async (keyId: string) => {
			if (!token) return;
			await apiClient.auth.apiKeys.remove(keyId, token);
			setKeys((prev) => prev.filter((k) => k.id !== keyId));
		},
		[apiClient, token],
	);

	const hasKeyForProvider = useCallback(
		(provider: string) => {
			return keys.some((k) => k.provider.toLowerCase() === provider.toLowerCase());
		},
		[keys],
	);

	return { keys, loading, addKey, removeKey, hasKeyForProvider, refresh };
}
