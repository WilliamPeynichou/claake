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

	async uploadPrivateObject(storagePath: string, buffer: Buffer, contentType: string): Promise<void> {
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
		await this.supabase.storage.from(PRIVATE_UPLOADS_BUCKET).remove(storagePaths);
	}

	async createSignedUrl(
		storagePath: string,
		expiresInSeconds = SIGNED_UPLOAD_URL_TTL_SECONDS,
	): Promise<string> {
		const { data, error } = await this.supabase.storage
			.from(PRIVATE_UPLOADS_BUCKET)
			.createSignedUrl(storagePath, expiresInSeconds);

		if (error || !data?.signedUrl) {
			throw error ?? new Error("Unable to create signed URL");
		}

		return data.signedUrl;
	}
}
