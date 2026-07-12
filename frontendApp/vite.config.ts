import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
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
		port: 5173,
		strictPort: true,
	},
});
