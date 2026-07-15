import { createClient } from "@supabase/supabase-js";
import { requirePublicServiceUrl } from "./environment";

const SUPABASE_URL = requirePublicServiceUrl(
	import.meta.env.VITE_SUPABASE_URL,
	"VITE_SUPABASE_URL",
	import.meta.env.PROD,
);
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
	throw new Error("VITE_SUPABASE_ANON_KEY is not set");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
