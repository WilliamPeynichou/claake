import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import { requirePublicServiceUrl } from "./src/lib/environment";

export default defineConfig(({ command, mode }) => {
	const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
	if (command === "build") {
		requirePublicServiceUrl(env.VITE_API_URL, "VITE_API_URL", true);
		requirePublicServiceUrl(env.VITE_SUPABASE_URL, "VITE_SUPABASE_URL", true);
		if (!env.VITE_SUPABASE_ANON_KEY) {
			throw new Error("VITE_SUPABASE_ANON_KEY is not set");
		}
	}

	return {
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	clearScreen: false,
	build: {
		// Split heavy vendors so the main chunk stays under the 500 kB warning (M4 debt).
		rollupOptions: {
			output: {
				manualChunks: {
					react: ["react", "react-dom", "react-router-dom"],
					markdown: ["react-markdown", "remark-gfm"],
					supabase: ["@supabase/supabase-js"],
					icons: ["lucide-react"],
				},
			},
		},
	},
	server: {
		host: "127.0.0.1",
		port: 5173,
		strictPort: true,
	},
	};
});
