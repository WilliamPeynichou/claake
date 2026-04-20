import { randomUUID } from "node:crypto";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	ENCRYPTION_SERVICE,
	type EncryptionServicePort,
} from "../../../../common/ports/encryption.port.js";
import type { ManageApiKeysPort } from "../../../chat/application/services/manage-api-keys.port.js";
import {
	USER_REPOSITORY,
	type UserRepositoryPort,
} from "../../domain/ports/user.repository.port.js";

interface StoredApiKey {
	id: string;
	provider: string;
	label: string;
	encryptedKey: string;
	createdAt: string;
}

export interface ApiKeyListItem {
	id: string;
	provider: string;
	label: string;
	key_preview: string;
	created_at: string;
}

@Injectable()
export class ManageApiKeysUseCase implements ManageApiKeysPort {
	constructor(
		@Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
		@Inject(ENCRYPTION_SERVICE) private readonly encryption: EncryptionServicePort,
	) {}

	async listKeys(userId: string): Promise<ApiKeyListItem[]> {
		const keys = await this.loadKeys(userId);
		return keys.map((k) => {
			const decrypted = this.encryption.decrypt(k.encryptedKey);
			return {
				id: k.id,
				provider: k.provider,
				label: k.label,
				key_preview: `${decrypted.slice(0, 4)}...${decrypted.slice(-4)}`,
				created_at: k.createdAt,
			};
		});
	}

	async addKey(
		userId: string,
		provider: string,
		label: string,
		key: string,
	): Promise<ApiKeyListItem> {
		const keys = await this.loadKeys(userId);
		const entry: StoredApiKey = {
			id: randomUUID(),
			provider,
			label,
			encryptedKey: this.encryption.encrypt(key),
			createdAt: new Date().toISOString(),
		};
		keys.push(entry);
		await this.saveKeys(userId, keys);
		return {
			id: entry.id,
			provider: entry.provider,
			label: entry.label,
			key_preview: `${key.slice(0, 4)}...${key.slice(-4)}`,
			created_at: entry.createdAt,
		};
	}

	async removeKey(userId: string, keyId: string): Promise<void> {
		const keys = await this.loadKeys(userId);
		const filtered = keys.filter((k) => k.id !== keyId);
		if (filtered.length === keys.length) {
			throw new NotFoundException("API key not found");
		}
		await this.saveKeys(userId, filtered);
	}

	async getDecryptedKeyForProvider(userId: string, provider: string): Promise<string | null> {
		const keys = await this.loadKeys(userId);
		const match = keys.find((k) => k.provider.toLowerCase() === provider.toLowerCase());
		if (!match) return null;
		return this.encryption.decrypt(match.encryptedKey);
	}

	private async loadKeys(userId: string): Promise<StoredApiKey[]> {
		const raw = await this.userRepo.getApiKeysEncrypted(userId);
		if (!raw) return [];
		try {
			return JSON.parse(raw) as StoredApiKey[];
		} catch {
			return [];
		}
	}

	private async saveKeys(userId: string, keys: StoredApiKey[]): Promise<void> {
		await this.userRepo.setApiKeysEncrypted(userId, JSON.stringify(keys));
	}
}
