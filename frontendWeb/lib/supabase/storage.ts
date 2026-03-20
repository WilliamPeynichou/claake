import { createClient } from "./client";

const AGENT_IMAGES_BUCKET = "agent-images";
const AGENT_FILES_BUCKET = "agent-files";

/**
 * Upload an agent icon/image to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadAgentImage(file: File, agentSlug: string): Promise<string> {
	const supabase = createClient();
	const ext = file.name.split(".").pop() ?? "png";
	const path = `${agentSlug}/icon-${Date.now()}.${ext}`;

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

/**
 * Upload a .agentjson config file to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadAgentConfigFile(
	file: File,
	agentSlug: string,
	version = "1.0.0",
): Promise<string> {
	const supabase = createClient();
	const path = `${agentSlug}/${version}.agentjson`;

	const { error } = await supabase.storage.from(AGENT_FILES_BUCKET).upload(path, file, {
		cacheControl: "3600",
		upsert: true,
		contentType: "application/json",
	});

	if (error) {
		throw new Error(`Erreur upload fichier: ${error.message}`);
	}

	const {
		data: { publicUrl },
	} = supabase.storage.from(AGENT_FILES_BUCKET).getPublicUrl(path);

	return publicUrl;
}
