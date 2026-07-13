import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EncryptionServicePort } from "../ports/encryption.port.js";

interface VersionedPayload {
	keyId: string;
	alg: "aes-256-gcm";
	iv: string;
	tag: string;
	ciphertext: string;
}

@Injectable()
export class AesEncryptionService implements EncryptionServicePort {
	private readonly currentKeyId: string;
	private readonly keys = new Map<string, Buffer>();

	constructor(config: ConfigService) {
		const currentKey = config.get<string>("ENCRYPTION_KEY");
		if (!currentKey || currentKey.length !== 64) {
			throw new Error("ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
		}
		this.currentKeyId = config.get<string>("ENCRYPTION_KEY_ID") ?? "v1";
		this.keys.set(this.currentKeyId, Buffer.from(currentKey, "hex"));

		const keyring = config.get<string>("ENCRYPTION_KEYS");
		if (keyring) {
			const parsed = JSON.parse(keyring) as Record<string, string>;
			for (const [keyId, hex] of Object.entries(parsed)) {
				if (hex.length !== 64) {
					throw new Error(`ENCRYPTION_KEYS.${keyId} must be a 64-char hex string (32 bytes)`);
				}
				this.keys.set(keyId, Buffer.from(hex, "hex"));
			}
		}
	}

	encrypt(plaintext: string): string {
		const key = this.getCurrentKey();
		const iv = randomBytes(12);
		const cipher = createCipheriv("aes-256-gcm", key, iv);
		const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
		const payload: VersionedPayload = {
			keyId: this.currentKeyId,
			alg: "aes-256-gcm",
			iv: iv.toString("base64"),
			tag: cipher.getAuthTag().toString("base64"),
			ciphertext: encrypted.toString("base64"),
		};
		return `enc:v1:${Buffer.from(JSON.stringify(payload), "utf8").toString("base64")}`;
	}

	decrypt(encrypted: string): string {
		if (!encrypted.startsWith("enc:v1:")) {
			return this.decryptLegacy(encrypted);
		}
		const payload = JSON.parse(
			Buffer.from(encrypted.slice("enc:v1:".length), "base64").toString("utf8"),
		) as VersionedPayload;
		const key = this.keys.get(payload.keyId);
		if (!key) {
			throw new Error(`Encryption key ${payload.keyId} is not available`);
		}
		return this.decryptWithKey(key, payload.iv, payload.tag, payload.ciphertext);
	}

	private decryptLegacy(encrypted: string): string {
		const [ivB64, tagB64, dataB64] = encrypted.split(":");
		const key = this.getCurrentKey();
		return this.decryptWithKey(key, ivB64, tagB64, dataB64);
	}

	private getCurrentKey(): Buffer {
		const key = this.keys.get(this.currentKeyId);
		if (!key) {
			throw new Error(`Encryption key ${this.currentKeyId} is not available`);
		}
		return key;
	}

	private decryptWithKey(key: Buffer, ivB64: string, tagB64: string, dataB64: string): string {
		const iv = Buffer.from(ivB64, "base64");
		const authTag = Buffer.from(tagB64, "base64");
		const data = Buffer.from(dataB64, "base64");
		const decipher = createDecipheriv("aes-256-gcm", key, iv);
		decipher.setAuthTag(authTag);
		return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
	}
}
