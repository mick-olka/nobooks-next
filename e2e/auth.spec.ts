import { expect, test } from "@playwright/test";

// NOTE: a signed-in /profile render + admin-authorization e2e need a seeded
// Supabase session/token (test account). No such fixture exists in this
// environment, so this spec is scoped to the redirect assertion only. Add an
// authenticated project (with a cookie seeded from a real test Supabase user)
// as a follow-up once a test account/token is available in CI.
test("visiting /profile while signed out redirects to /login", async ({
	page,
}) => {
	await page.goto("/profile");
	await expect(page).toHaveURL(/\/login/);
});
