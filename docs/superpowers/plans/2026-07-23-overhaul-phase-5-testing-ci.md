# Overhaul Phase 5 — Testing & CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Broaden the automated test suite (component tests + telegram-helper tests + action-input validation) and add a CI workflow that runs `biome check → typecheck → build → test` on every push/PR and **gates production deploys on green**, with Playwright e2e for the critical flows.

**Architecture:** Vitest + React Testing Library for unit/component (already wired). Server Action inputs get lightweight Zod validation (defense-in-depth) with a schema test. Playwright drives a few end-to-end flows in a real browser (public nav, `/profile` auth gate, admin authorization, FAQ accordion) — hermetic (no real Discord OAuth; auth flows seed a Supabase session cookie). A new `ci.yml` runs the gate on push+PR; the existing `deploy.yml` gains a `checks` job that `deploy` depends on.

**Tech Stack:** Vitest + RTL, `@playwright/test`, Zod, Biome, pnpm, GitHub Actions.

## Global Constraints

- Node 24 local / Node 20 in CI; **pnpm** (`pnpm install --frozen-lockfile` in CI).
- **Biome** (tabs, double quotes) on changed files; repo stays `biome check`-clean.
- TypeScript **strict**; `@/*` → repo root. `pnpm typecheck`, `pnpm test`, `pnpm build` green at every commit.
- **No behavior change** except the new Zod action validation, which must be LENIENT — it may only reject clearly-invalid input (empty required fields, unknown `type`); it must accept every currently-valid wiki edit.
- Tests must assert real behavior, not mock internals.
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Conventional prefixes: `test:`, `feat:`, `ci:`, `chore:`.

## Context — what's ALREADY tested (do not duplicate)

`app/lib/errors`, `app/lib/env`, `app/auth/roles`, `app/auth/protected-paths`, `app/lib/data/wiki` (DAL), `app/lib/data/stats-transforms`, `app/lib/supabase/public`, `app/components/ui/safe-markdown`. Phase 5 adds only what's missing.

---

### Task 1: Component tests — role-gated wiki UI

**Files:**
- Test: `app/components/wiki/__tests__/wiki-grid.test.tsx`
- Test: `app/components/forms/__tests__/wiki-form.test.tsx`

**Interfaces:** none produced (characterization tests for existing components).

Read `app/components/wiki/wiki-grid.tsx`, `app/components/wiki/create-page-btn.tsx`, and `app/components/forms/wiki-form.tsx` first.

**Known gotchas to handle in the tests:**
- `WikiGrid` renders `CreateWikiPageBtn`, which uses `useRouter` from `next/navigation` and imports `createWikiPageAction`. Mock `next/navigation` (`vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))`). Importing the action module is safe (no call on render), but if the import chain pulls a server-only module that errors under jsdom, mock `@/app/actions/wiki` too.
- Build a minimal `UserAccount` fixture (`{ user_role, id, ... }` — only the fields the component reads).

- [ ] **Step 1: WikiGrid role-gating test**

`wiki-grid.test.tsx` — assert the create affordance is shown for editors, hidden otherwise, and the grid renders:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WikiGrid } from "@/app/components/wiki/wiki-grid";
import { type UserAccount, UserRole, WikiPageType } from "@/app/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const pages = [
	{ id: "1", title: "Alpha", url_name: "alpha", content: "", type: "region", created_at: "", updated_at: "", created_by: "", last_modified_by: "" },
];
const user = (role: UserRole): UserAccount =>
	// biome-ignore lint/suspicious/noExplicitAny: minimal fixture
	({ id: "u1", user_role: role } as any);

describe("WikiGrid", () => {
	it("renders a card per page", () => {
		render(<WikiGrid data={pages as never} user={null} type={WikiPageType.REGION} />);
		expect(screen.getByText("Alpha")).toBeInTheDocument();
	});

	it("shows the create button for admin and moderator", () => {
		for (const role of [UserRole.ADMIN, UserRole.MODERATOR]) {
			const { unmount } = render(
				<WikiGrid data={[] as never} user={user(role)} type={WikiPageType.REGION} />,
			);
			expect(screen.getByRole("button")).toBeInTheDocument();
			unmount();
		}
	});

	it("hides the create button for a regular user and for anonymous", () => {
		for (const u of [user(UserRole.USER), null]) {
			const { unmount } = render(
				<WikiGrid data={[] as never} user={u} type={WikiPageType.REGION} />,
			);
			expect(screen.queryByRole("button")).not.toBeInTheDocument();
			unmount();
		}
	});
});
```

- [ ] **Step 2: WikiPageForm test**

`wiki-form.test.tsx` — assert it prefills from `pageData` and calls `handleSubmitAction` with the edited values on submit:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WikiPageForm } from "@/app/components/forms/wiki-form";
import { WikiPageType } from "@/app/types";

const pageData = {
	id: "1", title: "Title", content: "Body", url_name: "slug",
	type: WikiPageType.WIKI, created_at: "", updated_at: "", created_by: "", last_modified_by: "u1",
};

describe("WikiPageForm", () => {
	it("prefills fields and submits edited values", async () => {
		const onSubmit = vi.fn();
		render(<WikiPageForm pageData={pageData as never} handleSubmitAction={onSubmit} />);
		const title = screen.getByDisplayValue("Title");
		await userEvent.clear(title);
		await userEvent.type(title, "New Title");
		await userEvent.click(screen.getByRole("button", { name: /Зберегти/ }));
		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({ id: "1", title: "New Title", url_name: "slug", type: WikiPageType.WIKI }),
		);
	});
});
```

- [ ] **Step 3: Run + adjust selectors, commit**

Run: `pnpm exec vitest run app/components/wiki/__tests__/wiki-grid.test.tsx app/components/forms/__tests__/wiki-form.test.tsx`. If a selector doesn't match (e.g. the create button needs a more specific query, or `getByRole("button")` is ambiguous), adjust to the component's actual markup — the ASSERTIONS (editor sees create control; user/anon doesn't; form submits edited values) are what matter. Then `pnpm test` (full suite green), `pnpm typecheck`.
Run: `pnpm exec biome check --write` on the two test files.
```bash
git add app/components/wiki/__tests__/wiki-grid.test.tsx app/components/forms/__tests__/wiki-form.test.tsx
git commit -m "test: cover role-gated wiki UI (WikiGrid, WikiPageForm)"
```

---

### Task 2: Telegram news-service helper tests

**Files:**
- Modify: `app/utils/services/news-service.ts` (export the pure helpers)
- Test: `app/utils/services/__tests__/news-service.test.ts`

**Interfaces:** exports `normalizeTelegramMessage`, `normalizeTelegramDate`, `formatDateForSlug`, `formatDateForTitle`, `formatNewsContent` (pure functions already defined in the module — just add `export`).

- [ ] **Step 1: Export the pure helpers**

In `app/utils/services/news-service.ts`, add `export` to the existing pure functions `normalizeTelegramMessage`, `normalizeTelegramDate`, `formatDateForSlug`, `formatDateForTitle`, `formatNewsContent`. Do NOT change their logic. (Leave `syncTelegramNews`/`syncTelegramNewsHourly` and the service-role client as-is.)

- [ ] **Step 2: Test the helpers**

`news-service.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
	formatDateForSlug,
	formatNewsContent,
	normalizeTelegramDate,
	normalizeTelegramMessage,
} from "@/app/utils/services/news-service";

describe("normalizeTelegramMessage", () => {
	it("trims and coerces missing to empty string", () => {
		expect(normalizeTelegramMessage("  hi  ")).toBe("hi");
		expect(normalizeTelegramMessage(undefined)).toBe("");
	});
});

describe("formatNewsContent", () => {
	it("returns the message alone when there is no image", () => {
		expect(formatNewsContent({ message: "hello" })).toBe("hello");
	});
	it("appends a markdown image when an image is present", () => {
		expect(formatNewsContent({ message: "hi", image: "https://x/y.png" })).toBe(
			"hi\n\n![Telegram image](https://x/y.png)",
		);
	});
});

describe("normalizeTelegramDate / formatDateForSlug", () => {
	it("parses a normal date string and formats a zero-padded slug", () => {
		const d = normalizeTelegramDate("2026-01-05 09:07:03");
		expect(formatDateForSlug(d)).toBe("2026-01-05-09-07-03");
	});
	it("falls back to a valid Date for a bad input (no throw)", () => {
		expect(normalizeTelegramDate("not-a-date")).toBeInstanceOf(Date);
	});
});
```

> Note: `formatDateForSlug`/`formatDateForTitle` use local-time getters. The slug test uses explicit H:M:S in the input; if the runner's timezone shifts the parsed value, assert on the shape (`/^\d{4}(-\d{2}){5}$/`) instead of the exact string — pick whichever is stable in this environment and note it.

- [ ] **Step 3: Run + commit**

Run: `pnpm exec vitest run app/utils/services/__tests__/news-service.test.ts`; `pnpm test`; `pnpm typecheck`.
Run: `pnpm exec biome check --write app/utils/services/news-service.ts app/utils/services/__tests__/news-service.test.ts`
```bash
git add -A
git commit -m "test: cover telegram news-service pure helpers"
```

---

### Task 3: Zod validation for wiki action inputs

**Files:**
- Create: `app/actions/wiki-schema.ts`
- Modify: `app/actions/wiki.ts`
- Test: `app/actions/__tests__/wiki-schema.test.ts`

**Interfaces:** `wikiPageInputSchema` (Zod) + `parseWikiPageInput(input): WikiPageDTO`-shaped, throwing `AppError` on invalid input. Used by the create/update actions.

- [ ] **Step 1: Write the failing schema test**

`wiki-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseWikiPageInput } from "@/app/actions/wiki-schema";
import { AppError } from "@/app/lib/errors";
import { WikiPageType } from "@/app/types";

const valid = { title: "T", content: "C", url_name: "slug", type: WikiPageType.WIKI };

describe("parseWikiPageInput", () => {
	it("accepts valid input", () => {
		expect(parseWikiPageInput(valid).url_name).toBe("slug");
	});
	it("rejects empty title / url_name", () => {
		expect(() => parseWikiPageInput({ ...valid, title: "" })).toThrow(AppError);
		expect(() => parseWikiPageInput({ ...valid, url_name: "" })).toThrow(AppError);
	});
	it("rejects an unknown type", () => {
		expect(() => parseWikiPageInput({ ...valid, type: "bogus" })).toThrow(AppError);
	});
	it("passes through optional created_by/last_modified_by", () => {
		const r = parseWikiPageInput({ ...valid, created_by: "u1", last_modified_by: "u1" });
		expect(r.created_by).toBe("u1");
	});
});
```

- [ ] **Step 2: Run (RED), then implement `wiki-schema.ts`**

```ts
import { z } from "zod";
import { AppError } from "@/app/lib/errors";
import { WikiPageType } from "@/app/types";

const schema = z.object({
	title: z.string().trim().min(1),
	content: z.string(),
	url_name: z.string().trim().min(1),
	type: z.nativeEnum(WikiPageType),
	created_by: z.string().optional(),
	last_modified_by: z.string().optional(),
});

export function parseWikiPageInput(input: unknown) {
	const result = schema.safeParse(input);
	if (!result.success) {
		throw new AppError(`Invalid wiki page input: ${result.error.issues.map((i) => i.message).join("; ")}`);
	}
	return result.data;
}
```

> LENIENCY: `content` may be empty (new pages start with placeholder text but empty is allowed); only `title`/`url_name` must be non-empty and `type` must be a valid enum member. This accepts every currently-valid edit.

- [ ] **Step 3: Wire into the actions**

In `app/actions/wiki.ts`, in `createWikiPageAction` and `updateWikiPageAction`, after `requireRole(...)`, parse the incoming body through `parseWikiPageInput(...)` and pass the parsed value to the DAL. For `updateWikiPageAction` (which builds its body from `formData` fields), validate the assembled `{ title, content, url_name, type, last_modified_by }` object. Keep `deleteWikiPageAction` as-is (only a `url_name` string; a `z.string().min(1)` check is optional — add it if trivial). Import `parseWikiPageInput`.

- [ ] **Step 4: Run (GREEN) + verify + commit**

Run: `pnpm exec vitest run app/actions/__tests__/wiki-schema.test.ts`; `pnpm test`; `pnpm typecheck`; `pnpm build`.
Run: `pnpm exec biome check --write app/actions/wiki-schema.ts app/actions/wiki.ts app/actions/__tests__/wiki-schema.test.ts`
```bash
git add -A
git commit -m "feat: validate wiki action inputs with Zod"
```

---

### Task 4: Playwright end-to-end tests

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/public.spec.ts`, `e2e/auth.spec.ts`, `e2e/faq.spec.ts`
- Modify: `package.json` (add `test:e2e` script + `@playwright/test` devDep)
- Modify: `biome.json` and/or `vitest.config.ts` include globs so Vitest does NOT pick up `e2e/*` and Biome ignores Playwright output.

**Interfaces:** `pnpm test:e2e` runs Playwright.

> **Environment note:** Playwright browsers may not be installable/runnable in every sandbox. The deliverable is correct, committed e2e specs + config that run in CI (Task 5). Attempt a local `pnpm exec playwright install --with-deps chromium` + a single smoke run; if the environment cannot launch a browser, verify the specs typecheck / Playwright can list them (`pnpm exec playwright test --list`) and NOTE that full execution is deferred to CI. Do NOT mark done on a green local run you couldn't actually perform — report honestly what ran.

- [ ] **Step 1: Install Playwright**

```bash
pnpm add -D @playwright/test
pnpm exec playwright install --with-deps chromium
```
(If `install --with-deps` fails in the sandbox, try `playwright install chromium`; if that also fails, note it and proceed to write specs.)

- [ ] **Step 2: `playwright.config.ts`**

```ts
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
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
```

- [ ] **Step 3: Public-nav spec** (`e2e/public.spec.ts`) — no login needed:

```ts
import { expect, test } from "@playwright/test";

test("public pages are reachable without login", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveURL(/\/$/); // not redirected to /login
	for (const path of ["/rules", "/stats", "/faq"]) {
		await page.goto(path);
		await expect(page).not.toHaveURL(/\/login/);
	}
});
```

- [ ] **Step 4: Auth-gate spec** (`e2e/auth.spec.ts`):

```ts
import { expect, test } from "@playwright/test";

test("visiting /profile while signed out redirects to /login", async ({ page }) => {
	await page.goto("/profile");
	await expect(page).toHaveURL(/\/login/);
});
```

> A signed-in `/profile` render and admin-authorization test require a seeded Supabase session cookie. If a test Supabase session/token is available via env in CI, add an authenticated project that sets the cookie; otherwise scope this spec to the redirect assertion and NOTE the seeded-session variants as a follow-up (they need a test account/token the sandbox doesn't have).

- [ ] **Step 5: FAQ accordion spec** (`e2e/faq.spec.ts`) — covers the Phase 4 a11y rewrite that has no unit test:

```ts
import { expect, test } from "@playwright/test";

test("FAQ sections expand and only one stays open", async ({ page }) => {
	await page.goto("/faq");
	const summaries = page.locator("details > summary");
	const count = await summaries.count();
	test.skip(count < 2, "needs at least two FAQ entries");
	await summaries.nth(0).click();
	await expect(page.locator("details").nth(0)).toHaveAttribute("open", "");
	await summaries.nth(1).click();
	await expect(page.locator("details").nth(1)).toHaveAttribute("open", "");
	await expect(page.locator("details").nth(0)).not.toHaveAttribute("open", "");
});
```

- [ ] **Step 6: Wire scripts + keep Vitest/Playwright separate**

`package.json`: add `"test:e2e": "playwright test"`. Ensure `vitest.config.ts`'s `include` is limited to `app/**/*.{test,spec}.{ts,tsx}` (so it does NOT run `e2e/*`). Add `.gitignore` entries for `playwright-report/`, `test-results/`, `/blob-report/`, `/.playwright/`.

- [ ] **Step 7: Verify (honestly) + commit**

Run: `pnpm exec playwright test --list` (specs discovered) and, IF the browser launched, `pnpm test:e2e` (report the real result). `pnpm test` (Vitest still green and NOT running e2e). `pnpm typecheck`.
Run: `pnpm exec biome check --write playwright.config.ts e2e` (if Biome parses them) and package.json.
```bash
git add -A
git commit -m "test: add Playwright e2e for public nav, auth gate, FAQ accordion"
```

---

### Task 5: CI workflow gating deploys

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy.yml` (add a `checks` job; `deploy` `needs: [checks]`)

**Interfaces:** CI runs on push+PR; deploy runs only after checks pass.

- [ ] **Step 1: `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  checks:
    runs-on: ubuntu-latest
    env:
      NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ci-anon-key
      NEXT_PUBLIC_APP_URL: http://localhost:3000
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec biome check .
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build

  e2e:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    env:
      NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ci-anon-key
      NEXT_PUBLIC_APP_URL: http://localhost:3000
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
```

> The dummy `NEXT_PUBLIC_*` env values satisfy `app/lib/env.ts`'s fail-fast Zod parse at build time (the build never connects to Supabase). This mirrors what the local build needs.

- [ ] **Step 2: Gate `deploy.yml` on checks**

Read the current `.github/workflows/deploy.yml`. Add a `checks` job (same steps as `ci.yml`'s `checks`: install → biome → typecheck → test → build, with the dummy env) BEFORE the existing `deploy` job, and add `needs: [checks]` to the `deploy` job so a failing check blocks the SSH deploy. Keep the existing deploy steps/secrets unchanged.

- [ ] **Step 3: Validate the workflow YAML + commit**

Run: confirm both YAML files parse (e.g. `pnpm dlx yaml-lint` if available, or a Node `require('yaml')`/`js-yaml` parse, or careful manual check — GitHub Actions can't run locally). Confirm `deploy`'s `needs: [checks]` is present.
```bash
git add .github/workflows/ci.yml .github/workflows/deploy.yml
git commit -m "ci: add CI checks and gate production deploy on green"
```

---

## Self-Review

**Spec coverage (Phase 6/Section 6 of the design spec):**
- Vitest + RTL unit/component — already-present suites + Task 1 (components) + Task 2 (telegram helpers) + Task 3 (validation). Stats transforms & DAL already covered in earlier phases. ✅
- Zod action-input validation (Section 4 carry-over) → Task 3. ✅
- Playwright e2e (public nav, auth gate, authorization, FAQ) → Task 4 (authorization/seeded-session variant flagged as needing a test account). ✅
- CI gating deploys → Task 5. ✅

**Environment honesty:** Task 4 explicitly instructs the implementer to report what actually ran locally vs. what's deferred to CI (Playwright browsers may not launch in the sandbox). No "green" claim without a real run.

**Leniency guard:** Task 3's schema is deliberately lenient (empty `content` allowed; only `title`/`url_name` required; `type` must be a valid enum) so it can't reject a currently-valid edit — called out so the reviewer verifies no false-rejection regression.

**Placeholder scan:** All test code is concrete; CI YAML is complete with dummy build env. No TBDs.

**Deferred (noted, not dropped):** authenticated `/profile` + admin-edit e2e need a seeded Supabase test session (no test account available in-sandbox); the `middleware.ts`→`proxy.ts` rename (Next 16) still pending; the two Phase 4 cosmetic Minors (playercount eslint-comment, Dockerfile newline). These are follow-ups, not blockers for the overhaul being code-complete.
