const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");

export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = key;
