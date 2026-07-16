import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const PRIVATE_UPLOADS_BUCKET = "agent-files-private";
export const SIGNED_UPLOAD_URL_TTL_SECONDS = 5 * 60;

@Injectable()
export class UploadStorageService {
	private readonly supabase: SupabaseClient;

	constructor(private readonly config: ConfigService) {
		this.supabase = createClient(
			this.config.getOrThrow<string>("SUPABASE_URL"),
			this.config.getOrThrow<string>("SUPABASE_SERVICE_ROLE_KEY"),
		);
	}

	async uploadPrivateObject(
		storagePath: string,
		buffer: Buffer,
		contentType: string,
	): Promise<void> {
		this.assertValidStoragePath(storagePath);
		const { error } = await this.supabase.storage
			.from(PRIVATE_UPLOADS_BUCKET)
			.upload(storagePath, buffer, {
				contentType,
				upsert: false,
			});

		if (error) {
			throw error;
		}
	}

	async removePrivateObjects(storagePaths: string[]): Promise<void> {
		if (storagePaths.length === 0) return;
		for (const storagePath of storagePaths) this.assertValidStoragePath(storagePath);
		const { error } = await this.supabase.storage.from(PRIVATE_UPLOADS_BUCKET).remove(storagePaths);
		if (error) throw error;
	}

	async createSignedUrl(
		storagePath: string,
		expiresInSeconds = SIGNED_UPLOAD_URL_TTL_SECONDS,
	): Promise<string> {
		this.assertValidStoragePath(storagePath);
		if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 1 || expiresInSeconds > 300) {
			throw new Error("Invalid signed URL expiry");
		}
		const { data, error } = await this.supabase.storage
			.from(PRIVATE_UPLOADS_BUCKET)
			.createSignedUrl(storagePath, expiresInSeconds);

		if (error || !data?.signedUrl) {
			throw error ?? new Error("Unable to create signed URL");
		}

		return data.signedUrl;
	}

	private assertValidStoragePath(storagePath: string): void {
		if (
			!/^uploads\/[0-9a-f-]+\/(?:[0-9a-f-]+|unattached)\/[0-9a-f-]+\.(?:jpg|jpeg|png|webp|gif|pdf)$/i.test(
				storagePath,
			)
		) {
			throw new Error("Invalid private upload storage path");
		}
	}
}
