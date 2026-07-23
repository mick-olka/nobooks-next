import { expect, test } from "@playwright/test";

test("public pages are reachable without login", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveURL(/\/$/); // not redirected to /login
	for (const path of ["/rules", "/stats", "/faq"]) {
		await page.goto(path);
		await expect(page).not.toHaveURL(/\/login/);
	}
});
