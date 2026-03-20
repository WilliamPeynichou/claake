export const MANAGE_API_KEYS_USE_CASE = Symbol("MANAGE_API_KEYS_USE_CASE");

export interface ManageApiKeysPort {
	getDecryptedKeyForProvider(userId: string, provider: string): Promise<string | null>;
}
