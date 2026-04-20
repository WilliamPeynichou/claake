import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EncryptionServicePort } from "../ports/encryption.port.js";

@Injectable()
export class AesEncryptionService implements EncryptionServicePort {
	private readonly key: Buffer;

	constructor(config: ConfigService) {
		const hex = config.get<string>("ENCRYPTION_KEY");
		if (!hex || hex.length !== 64) {
			throw new Error("ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
		}
		this.key = Buffer.from(hex, "hex");
	}

	encrypt(plaintext: string): string {
		const iv = randomBytes(12);
		const cipher = createCipheriv("aes-256-gcm", this.key, iv);
		const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
		const authTag = cipher.getAuthTag();
		return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
	}

	decrypt(encrypted: string): string {
		const [ivB64, tagB64, dataB64] = encrypted.split(":");
		const iv = Buffer.from(ivB64, "base64");
		const authTag = Buffer.from(tagB64, "base64");
		const data = Buffer.from(dataB64, "base64");
		const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
		decipher.setAuthTag(authTag);
		return decipher.update(data) + decipher.final("utf8");
	}
}
