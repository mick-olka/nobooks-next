import { expect, test } from "@playwright/test";

test("FAQ sections expand and only one stays open", async ({ page }) => {
	await page.goto("/faq");
	// Scoped to <main> because the site header also renders a <details> (the
	// mobile nav dropdown, app/components/layout-elements/menu.tsx) before the
	// page content — an unscoped "details > summary" selector would target
	// that unrelated element at index 0 instead of the first FAQ entry.
	const faqDetails = page.locator("main details");
	const summaries = faqDetails.locator("> summary");
	// FAQ content is parsed client-side after hydration (useFeaturesList), so
	// the initial DOM has zero FAQ <details>. Give a second entry a bounded
	// window to attach before snapshotting the count, otherwise a fast run
	// races the client-side parse and skips spuriously. If content is
	// genuinely thin, this just times out and the skip guard below applies.
	await summaries
		.nth(1)
		.waitFor({ state: "attached", timeout: 5_000 })
		.catch(() => {});
	const count = await summaries.count();
	test.skip(count < 2, "needs at least two FAQ entries");
	await summaries.nth(0).click();
	await expect(faqDetails.nth(0)).toHaveAttribute("open", "");
	await summaries.nth(1).click();
	await expect(faqDetails.nth(1)).toHaveAttribute("open", "");
	await expect(faqDetails.nth(0)).not.toHaveAttribute("open", "");
});
