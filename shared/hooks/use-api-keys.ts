import { useCallback, useEffect, useState } from "react";
import { maskApiKey } from "../lib/agents";
import type { StorageAdapter } from "../lib/storage";
import { prefixedKey } from "../lib/storage";

export interface StoredApiKey {
	id: string;
	provider: string;
	label: string;
	key: string;
}

const STORAGE_KEY = prefixedKey("api_keys");

export interface UseApiKeysOptions {
	storage: StorageAdapter;
}

export interface UseApiKeysReturn {
	keys: StoredApiKey[];
	loading: boolean;
	addKey: (provider: string, label: string, key: string) => Promise<void>;
	removeKey: (id: string) => Promise<void>;
	getKeyForProvider: (provider: string) => string | undefined;
	maskKey: (key: string) => string;
}

export function useApiKeys({ storage }: UseApiKeysOptions): UseApiKeysReturn {
	const [keys, setKeys] = useState<StoredApiKey[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		storage.getItem(STORAGE_KEY).then((raw) => {
			if (raw) {
				try {
					setKeys(JSON.parse(raw));
				} catch {
					// corrupted data, reset
				}
			}
			setLoading(false);
		});
	}, [storage]);

	const persist = useCallback(
		async (updated: StoredApiKey[]) => {
			setKeys(updated);
			await storage.setItem(STORAGE_KEY, JSON.stringify(updated));
		},
		[storage],
	);

	const addKey = useCallback(
		async (provider: string, label: string, key: string) => {
			const newKey: StoredApiKey = {
				id: crypto.randomUUID(),
				provider,
				label: label || provider,
				key,
			};
			await persist([...keys, newKey]);
		},
		[keys, persist],
	);

	const removeKey = useCallback(
		async (id: string) => {
			await persist(keys.filter((k) => k.id !== id));
		},
		[keys, persist],
	);

	const getKeyForProvider = useCallback(
		(provider: string) => {
			return keys.find((k) => k.provider === provider)?.key;
		},
		[keys],
	);

	return {
		keys,
		loading,
		addKey,
		removeKey,
		getKeyForProvider,
		maskKey: maskApiKey,
	};
}
