/**
 * Platform-agnostic storage abstraction.
 * Web: localStorage, Mobile: AsyncStorage, Desktop: Tauri store.
 * Each frontend provides its own StorageAdapter implementation.
 */
export interface StorageAdapter {
	getItem(key: string): Promise<string | null>;
	setItem(key: string, value: string): Promise<void>;
	removeItem(key: string): Promise<void>;
}

/** In-memory fallback storage (works everywhere, no persistence). */
export class MemoryStorage implements StorageAdapter {
	private store = new Map<string, string>();

	async getItem(key: string) {
		return this.store.get(key) ?? null;
	}

	async setItem(key: string, value: string) {
		this.store.set(key, value);
	}

	async removeItem(key: string) {
		this.store.delete(key);
	}
}

/** Web localStorage adapter — use in frontendWeb. */
export class WebStorage implements StorageAdapter {
	async getItem(key: string) {
		if (typeof window === "undefined") return null;
		return localStorage.getItem(key);
	}

	async setItem(key: string, value: string) {
		if (typeof window === "undefined") return;
		localStorage.setItem(key, value);
	}

	async removeItem(key: string) {
		if (typeof window === "undefined") return;
		localStorage.removeItem(key);
	}
}

const STORAGE_PREFIX = "claake_";

export function prefixedKey(key: string): string {
	return `${STORAGE_PREFIX}${key}`;
}
