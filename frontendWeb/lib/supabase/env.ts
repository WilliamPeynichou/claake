function getEnvVar(name: string, fallback?: string): string {
	const value = process.env[name];
	if (!value) {
		if (fallback !== undefined) return fallback;
		throw new Error(`Missing environment variable: ${name}`);
	}
	return value;
}

export const SUPABASE_URL = getEnvVar(
	"NEXT_PUBLIC_SUPABASE_URL",
	"https://placeholder.supabase.co",
);
export const SUPABASE_ANON_KEY = getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", "placeholder-anon-key");
