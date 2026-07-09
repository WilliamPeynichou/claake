import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? "github" : "list",
	use: {
		baseURL: `http://127.0.0.1:${port}`,
		trace: "on-first-retry",
	},
	webServer: {
		command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
		url: `http://127.0.0.1:${port}`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		env: {
			NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3999",
			NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
			NEXT_PUBLIC_SUPABASE_ANON_KEY:
				process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "playwright-placeholder-anon-key",
		},
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
