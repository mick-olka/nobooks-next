import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		command: "pnpm build && pnpm start",
		// Readiness probe: use a page with no external data deps. The homepage
		// hits Supabase (NewsPane) and 500s when pointed at a dummy CI Supabase
		// URL, which Playwright treats as "not ready" → webServer timeout.
		// `/rules` renders from a static local array, so it returns 200 in CI.
		url: "http://localhost:3000/rules",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
