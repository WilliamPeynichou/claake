import { createClient } from "./client";

const AGENT_IMAGES_BUCKET = "agent-images";

/**
 * Upload an agent icon/image to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadAgentImage(
	file: File,
	agentSlug: string,
	userId: string,
): Promise<string> {
	const supabase = createClient();
	const ext = file.name.split(".").pop() ?? "png";
	const path = `${userId}/${agentSlug}/icon-${Date.now()}.${ext}`;

	const { error } = await supabase.storage.from(AGENT_IMAGES_BUCKET).upload(path, file, {
		cacheControl: "3600",
		upsert: true,
	});

	if (error) {
		throw new Error(`Erreur upload image: ${error.message}`);
	}

	const {
		data: { publicUrl },
	} = supabase.storage.from(AGENT_IMAGES_BUCKET).getPublicUrl(path);

	return publicUrl;
}
