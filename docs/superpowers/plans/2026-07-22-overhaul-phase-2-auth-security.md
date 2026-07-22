# Overhaul Phase 2 — Auth & Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flip the site to public-by-default with Discord-only login, gate members/admin actions with real server-side authorization and database RLS, add stored-XSS sanitization and security headers, and make the validated env load-bearing — without moving route folders (deferred to the cleanup phase).

**Architecture:** Middleware becomes allow-by-default and redirects only an explicit protected-path list to `/login`. `getAuthorizedUser` is replaced by three intent-revealing helpers (`getUser` / `requireUser` / `requireRole`) built on a pure, testable `parseRole`. Content mutations enforce `requireRole('admin','moderator')` in the server action (defense-in-depth over RLS committed as SQL migrations). All Markdown renders go through one sanitized `<SafeMarkdown>`. `/private` becomes `/profile`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Supabase (`@supabase/ssr`), Zod, `rehype-sanitize`, Vitest, Biome, pnpm.

## Global Constraints

- Node 24 / **pnpm**; `pnpm add` for deps, `pnpm install --frozen-lockfile` in CI.
- **Biome** formatting, scoped to changed files only: `pnpm exec biome check --write <changed files>` before each commit. Do NOT run `biome check --write` over whole directories (repo-wide formatting is a separate Phase 4 task).
- TypeScript **strict**; path alias `@/*` → repo root.
- **Auth model:** public by default; only paths in the protected list require login. **Discord-only** sign-in.
- **Content-edit authorization:** `admin` OR `moderator` (never admin-only). Server action check and RLS policy MUST agree.
- Data-access layer under `app/lib/**` stays pure (no `redirect`/`notFound`/client-only imports).
- **No route-folder moves / no `utils`→`lib` moves this phase** (deferred to cleanup). Only `/private`→`/profile` is renamed (it's a behavior change we own).
- Preserve Ukrainian UI copy.
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Conventional prefixes: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`.

## Manual steps (controller pauses for the user)

- **Rotate** the exposed Supabase anon + service-role keys (dashboard) — cannot be automated.
- **Apply** the RLS SQL migration (Task 10) to the live Supabase project (`supabase db push` or dashboard SQL editor) — controller confirms with the user before/at this step.

---

### Task 1: Pure role helpers + split `getAuthorizedUser`

**Files:**
- Modify: `app/auth/helpers.ts`
- Create: `app/auth/roles.ts`
- Test: `app/auth/__tests__/roles.test.ts`
- Modify (callers): `app/layout.tsx`, `app/features/page.tsx`, `app/history/page.tsx`, `app/regions/page.tsx`, `app/wiki/[id]/page.tsx`, `app/wiki/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `UserRole`, `UserAccount` from `@/app/types`; `createClient` from `@/app/utils/supabase/server`.
- Produces:
  - `roles.ts`: `parseRole(value: unknown): UserRole` (returns the matching `UserRole` or `UserRole.USER` if not a valid member); `canEditContent(role: UserRole): boolean` (`true` for `admin`/`moderator`).
  - `helpers.ts`: `getUser(): Promise<UserAccount | null>` (never redirects); `requireUser(): Promise<UserAccount>` (redirects `/login` if none); `requireRole(...roles: UserRole[]): Promise<UserAccount>` (redirects `/` if the user lacks all given roles; redirects `/login` if unauthenticated). The old `getAuthorizedUser` is removed.

- [ ] **Step 1: Write the failing test for the pure helpers**

Create `app/auth/__tests__/roles.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { canEditContent, parseRole } from "@/app/auth/roles";
import { UserRole } from "@/app/types";

describe("parseRole", () => {
	it("returns the matching role for a valid string", () => {
		expect(parseRole("admin")).toBe(UserRole.ADMIN);
		expect(parseRole("moderator")).toBe(UserRole.MODERATOR);
		expect(parseRole("user")).toBe(UserRole.USER);
	});

	it("defaults to USER for unknown, null, or non-string input", () => {
		expect(parseRole("superadmin")).toBe(UserRole.USER);
		expect(parseRole(null)).toBe(UserRole.USER);
		expect(parseRole(undefined)).toBe(UserRole.USER);
		expect(parseRole(42)).toBe(UserRole.USER);
	});
});

describe("canEditContent", () => {
	it("allows admin and moderator, denies user", () => {
		expect(canEditContent(UserRole.ADMIN)).toBe(true);
		expect(canEditContent(UserRole.MODERATOR)).toBe(true);
		expect(canEditContent(UserRole.USER)).toBe(false);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run app/auth/__tests__/roles.test.ts`
Expected: FAIL — cannot resolve `@/app/auth/roles`.

- [ ] **Step 3: Implement `app/auth/roles.ts`**

```ts
import { UserRole } from "@/app/types";

export function parseRole(value: unknown): UserRole {
	if (typeof value === "string") {
		const match = Object.values(UserRole).find((role) => role === value);
		if (match) return match;
	}
	return UserRole.USER;
}

export function canEditContent(role: UserRole): boolean {
	return role === UserRole.ADMIN || role === UserRole.MODERATOR;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run app/auth/__tests__/roles.test.ts`
Expected: PASS (2 describes).

- [ ] **Step 5: Rewrite `app/auth/helpers.ts`**

Replace the whole file with:

```ts
import { redirect } from "next/navigation";
import { parseRole } from "@/app/auth/roles";
import { type UserAccount, UserRole } from "@/app/types";
import { createClient } from "@/app/utils/supabase/server";

async function loadUser(): Promise<UserAccount | null> {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getUser();
	if (error || !data.user) return null;

	const { data: role } = await supabase.rpc("get_user_role");
	return {
		...data.user,
		user_role: parseRole(role),
		name:
			data.user.user_metadata?.custom_claims?.global_name ||
			data.user.email ||
			data.user.id,
	};
}

/** Returns the signed-in user or null. Never redirects. */
export async function getUser(): Promise<UserAccount | null> {
	return loadUser();
}

/** Requires a signed-in user; redirects to /login otherwise. */
export async function requireUser(): Promise<UserAccount> {
	const user = await loadUser();
	if (!user) redirect("/login");
	return user;
}

/** Requires one of the given roles; redirects home if lacking, /login if signed out. */
export async function requireRole(...roles: UserRole[]): Promise<UserAccount> {
	const user = await loadUser();
	if (!user) redirect("/login");
	if (!roles.includes(user.user_role)) redirect("/");
	return user;
}
```

- [ ] **Step 6: Update the `@/app/auth` barrel if needed**

Confirm `app/auth/index.ts` re-exports `./helpers` (it does: `export * from "./helpers";`). No change needed unless it named specific symbols.

- [ ] **Step 7: Update callers**

Apply these exact replacements:
- `app/layout.tsx:37` — `const user = await getAuthorizedUser();` → `const user = await getUser();` and update the import `{ getAuthorizedUser }` → `{ getUser }`.
- `app/features/page.tsx`, `app/history/page.tsx`, `app/regions/page.tsx`, `app/wiki/[id]/page.tsx` — same swap: import `getUser`, call `const user = await getUser();`.
- `app/wiki/[id]/edit/page.tsx:16` — `const user = await getAuthorizedUser({ adminProtectedPage: true });` → `const user = await requireRole(UserRole.ADMIN, UserRole.MODERATOR);` (import `requireRole` from `@/app/auth` and `UserRole` from `@/app/types`). Since `requireRole` guarantees a user or redirects, the later `if (!user) redirect("/login")` line becomes dead — remove it.

(The `/private`→`/profile` caller is handled in Task 3.)

- [ ] **Step 8: Verify + commit**

Run: `pnpm typecheck` (clean), `pnpm test` (all green), `pnpm build` (succeeds).
Run: `pnpm exec biome check --write app/auth/roles.ts app/auth/__tests__/roles.test.ts app/auth/helpers.ts app/layout.tsx app/features/page.tsx app/history/page.tsx app/regions/page.tsx app/wiki/[id]/page.tsx app/wiki/[id]/edit/page.tsx`
```bash
git add -A
git commit -m "refactor: split auth helpers into getUser/requireUser/requireRole"
```

---

### Task 2: Middleware — public by default, gate protected paths

**Files:**
- Create: `app/auth/protected-paths.ts`
- Test: `app/auth/__tests__/protected-paths.test.ts`
- Modify: `app/utils/supabase/middleware.ts`

**Interfaces:**
- Produces: `PROTECTED_PREFIXES: readonly string[]` (`["/profile"]`); `isProtectedPath(pathname: string): boolean` (true if the path equals or is nested under a protected prefix).
- Consumes: nothing new in the middleware beyond the existing session refresh.

- [ ] **Step 1: Write the failing test**

Create `app/auth/__tests__/protected-paths.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isProtectedPath } from "@/app/auth/protected-paths";

describe("isProtectedPath", () => {
	it("protects /profile and nested paths", () => {
		expect(isProtectedPath("/profile")).toBe(true);
		expect(isProtectedPath("/profile/settings")).toBe(true);
	});

	it("leaves public content open", () => {
		expect(isProtectedPath("/")).toBe(false);
		expect(isProtectedPath("/wiki/intro")).toBe(false);
		expect(isProtectedPath("/rules")).toBe(false);
		expect(isProtectedPath("/stats")).toBe(false);
		expect(isProtectedPath("/login")).toBe(false);
	});

	it("does not treat a prefix substring as protected", () => {
		expect(isProtectedPath("/profiles-public")).toBe(false);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run app/auth/__tests__/protected-paths.test.ts`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement `app/auth/protected-paths.ts`**

```ts
export const PROTECTED_PREFIXES = ["/profile"] as const;

export function isProtectedPath(pathname: string): boolean {
	return PROTECTED_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run app/auth/__tests__/protected-paths.test.ts`
Expected: PASS.

- [ ] **Step 5: Update the middleware redirect condition**

In `app/utils/supabase/middleware.ts`, add the import:
```ts
import { isProtectedPath } from "@/app/auth/protected-paths";
```
Replace the redirect block (the `if (!user && !pathname.startsWith("/login") && !pathname.startsWith("/auth"))` condition) with:
```ts
	if (!user && isProtectedPath(request.nextUrl.pathname)) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}
```
Leave the session-refresh logic (everything from `createServerClient` through `auth.getUser()`), the auth comments, and the final `return supabaseResponse` unchanged.

- [ ] **Step 6: Verify + commit**

Run: `pnpm typecheck`, `pnpm test`, `pnpm build` — all pass.
Run: `pnpm exec biome check --write app/auth/protected-paths.ts app/auth/__tests__/protected-paths.test.ts app/utils/supabase/middleware.ts`
```bash
git add -A
git commit -m "feat: make site public by default, gate only protected paths"
```

---

### Task 3: Rename `/private` → `/profile`, harden, add loading

**Files:**
- Rename: `app/private/page.tsx` → `app/profile/page.tsx` (use `git mv`)
- Create: `app/profile/loading.tsx`
- Modify: `app/profile/page.tsx` (harden)
- Modify: `app/auth/callback/route.ts` (redirect target)
- Create: `public/default-avatar.png` is NOT required — use an inline fallback (see below)

**Interfaces:**
- Consumes: `requireUser` (Task 1); `getPlayerIndividualStats` from `@/app/utils/services`.
- Produces: the `/profile` route (was `/private`).

- [ ] **Step 1: Move the folder**

```bash
git mv app/private app/profile
```

- [ ] **Step 2: Harden `app/profile/page.tsx`**

Apply these changes to the moved file:
- Replace `const user = await getAuthorizedUser({ protectedPage: true });` with `const user = await requireUser();` (import `requireUser` from `@/app/auth`). Remove the now-dead `if (!user) return null;`.
- The Discord id stays `const discordId = user.user_metadata.provider_id;`.
- Replace the unguarded greeting `user.user_metadata.custom_claims.global_name || user.email` with the already-safe `user.name`.
- Replace the avatar `src` fallback `"https://via.placeholder.com/100"` (host not allowed by `next.config.ts`) with a guarded conditional: if `user.user_metadata?.picture` is present use `next/image`, else render a `<div>` initials/emoji placeholder (no external host).

- [ ] **Step 3: Add `app/profile/loading.tsx`**

```tsx
export default function Loading() {
	return (
		<div className="min-h-[60vh] flex items-center justify-center">
			<span className="loading loading-spinner loading-lg" />
		</div>
	);
}
```

- [ ] **Step 4: Update the OAuth callback redirect**

In `app/auth/callback/route.ts`, change the default `next` target from `/private` to `/profile` (the `const next = searchParams.get("next") ?? "/private";` line → `?? "/profile"`).

- [ ] **Step 5: Verify + commit**

Run: `pnpm typecheck`, `pnpm test`, `pnpm build` (confirm `/profile` in the route list, `/private` gone).
Run: `pnpm exec biome check --write app/profile/page.tsx app/profile/loading.tsx app/auth/callback/route.ts`
```bash
git add -A
git commit -m "feat: rename /private to /profile, harden profile page"
```

---

### Task 4: Discord-only login cleanup

**Files:**
- Modify: `app/login/actions.ts`
- Modify: `app/login/page.tsx`
- Delete: `app/login/discord/page.tsx` (and the `app/login/discord/` folder)

**Interfaces:**
- Produces: `signInWithDiscord` and `logout` only (email/password `login`/`signup` removed).

- [ ] **Step 1: Trim `app/login/actions.ts`**

Remove the `login` and `signup` exports entirely. Keep `logout` and `signInWithDiscord`. Remove the now-unused `revalidatePath` import if nothing else uses it. Result:

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/app/utils/supabase/server";

export const logout = async () => {
	const supabase = await createClient();
	await supabase.auth.signOut();
	redirect("/login");
};

export const signInWithDiscord = async () => {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "discord",
		options: {
			redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
		},
	});
	if (error) {
		console.error("Error signing in with Discord", error);
		return;
	}
	if (data?.url) redirect(data.url);
};
```

- [ ] **Step 2: Clean `app/login/page.tsx`**

Remove the large commented-out email/password block, leaving the heading and the single Discord button (`formAction={signInWithDiscord}`). Keep the Ukrainian copy.

- [ ] **Step 3: Delete the duplicate Discord page**

```bash
git rm app/login/discord/page.tsx
```
Confirm nothing links to `/login/discord` (search the repo; if a link exists, point it at `/login`).

- [ ] **Step 4: Verify + commit**

Run: search for `signInWithPassword`, `signup`, `login(` references — none should remain outside actions history. Run `pnpm typecheck`, `pnpm test`, `pnpm build`.
Run: `pnpm exec biome check --write app/login/actions.ts app/login/page.tsx`
```bash
git add -A
git commit -m "refactor: Discord-only login, remove email/password paths"
```

---

### Task 5: Server-side role enforcement on wiki mutations

**Files:**
- Modify: `app/actions/wiki.ts`
- Modify: `app/components/wiki/wiki-grid.tsx`
- Modify: `app/wiki/[id]/page.tsx` (admin-button gating)
- Modify: `app/features/features-pane.tsx` (if it gates on admin) and `app/features/page.tsx`

**Interfaces:**
- Consumes: `requireRole` (Task 1), `canEditContent` (Task 1), `UserRole`.
- Produces: mutations rejected for non-editors server-side; UI edit affordances shown for `admin`||`moderator`.

- [ ] **Step 1: Enforce role in the actions**

In `app/actions/wiki.ts`, at the top of each of `createWikiPageAction`, `updateWikiPageAction`, `deleteWikiPageAction`, call:
```ts
await requireRole(UserRole.ADMIN, UserRole.MODERATOR);
```
(import `requireRole` from `@/app/auth`, `UserRole` from `@/app/types`). This runs before any DB call, so a non-editor is redirected/blocked server-side regardless of UI.

- [ ] **Step 2: Update UI gating from admin-only to editor**

Replace `user.user_role === UserRole.ADMIN` gating with `canEditContent(user.user_role)`:
- `app/components/wiki/wiki-grid.tsx:20` — `const isAdmin = user ? user.user_role === UserRole.ADMIN : false;` → `const canEdit = user ? canEditContent(user.user_role) : false;` and use `canEdit` for the create button. Import `canEditContent` from `@/app/auth/roles`.
- `app/wiki/[id]/page.tsx` — same swap for the `isAdmin` used to render `<AdminButtons>`.
- Any other place gating on `=== UserRole.ADMIN` for content editing.

- [ ] **Step 3: Verify + commit**

Run: `pnpm typecheck`, `pnpm test`, `pnpm build`. Manually reason: a `user`-role account calling `deleteWikiPageAction` is now redirected by `requireRole` before deletion.
Run: `pnpm exec biome check --write app/actions/wiki.ts app/components/wiki/wiki-grid.tsx app/wiki/[id]/page.tsx`
```bash
git add -A
git commit -m "feat: enforce admin/moderator on wiki mutations server-side"
```

---

### Task 6: Make env load-bearing; restore mutation-failure feedback

**Files:**
- Modify: `app/utils/supabase/server.ts`, `app/utils/supabase/client.ts`, `app/utils/supabase/middleware.ts`
- Modify: `app/components/wiki/create-page-btn.tsx`, `app/components/wiki/admin-buttons.tsx`

**Interfaces:**
- Consumes: `env` from `@/app/lib/env`.
- Produces: Supabase clients read validated `env.NEXT_PUBLIC_SUPABASE_URL` / `env.NEXT_PUBLIC_SUPABASE_ANON_KEY` (fail-fast if missing); create/delete buttons surface errors.

- [ ] **Step 1: Wire `env` into the three clients**

In each client, replace `process.env.NEXT_PUBLIC_SUPABASE_URL || ""` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""` with `env.NEXT_PUBLIC_SUPABASE_URL` / `env.NEXT_PUBLIC_SUPABASE_ANON_KEY` (import `{ env } from "@/app/lib/env"`). Now a missing var throws at import (fail-fast) instead of silently passing `""`.

> Note: `env.ts` validates `process.env` on import. `NEXT_PUBLIC_*` vars are inlined at build time, so they're present in the client bundle; server vars resolve at runtime. If `pnpm build` fails because a var is absent, that is the intended fail-fast — ensure the committed `.env` (or CI env) provides the three required vars.

- [ ] **Step 2: Surface create-failure in `create-page-btn.tsx`**

`createWikiPageAction` can now reject (role check / DB). Wrap the call in `try/catch`; on error show a `toast.error(...)` (import `toast` from `react-hot-toast`, already a dependency and used elsewhere) and do not navigate.

- [ ] **Step 3: Surface delete-failure in `admin-buttons.tsx`**

`deleteWikiPageAction` returns the error (or null). It already checks `if (!error) redirect("/")`; add an `else` that shows `toast.error(...)`. Also replace the client-side `redirect` import from `next/navigation` with `useRouter().push` (calling `redirect()` in a client event handler is not the intended API). Keep the confirm dialog.

- [ ] **Step 4: Verify + commit**

Run: `pnpm typecheck`, `pnpm test`, `pnpm build`.
Run: `pnpm exec biome check --write app/utils/supabase/server.ts app/utils/supabase/client.ts app/utils/supabase/middleware.ts app/components/wiki/create-page-btn.tsx app/components/wiki/admin-buttons.tsx`
```bash
git add -A
git commit -m "feat: load-bearing env validation; surface wiki mutation errors"
```

---

### Task 7: Fix the cron auth bypass

**Files:**
- Modify: `app/api/telegram-news-sync/route.ts`

**Interfaces:** unchanged signature; `isAuthorized` now denies when the secret is unset.

- [ ] **Step 1: Deny when the secret is missing or mismatched**

Replace `isAuthorized` so a missing `CRON_SECRET` denies (fails closed) instead of allowing:

```ts
function isAuthorized(request: NextRequest): boolean {
	const secret = process.env.CRON_SECRET;
	if (!secret) return false; // fail closed: no secret configured = deny
	return request.headers.get("authorization") === `Bearer ${secret}`;
}
```

- [ ] **Step 2: Verify + commit**

Run: `pnpm typecheck`, `pnpm build`. Reason: without `CRON_SECRET` set, `GET /api/telegram-news-sync` now returns 401.
Run: `pnpm exec biome check --write app/api/telegram-news-sync/route.ts`
```bash
git add -A
git commit -m "fix: deny telegram-sync cron when CRON_SECRET is unset"
```
> Manual step reminder (surface to user): set `CRON_SECRET` in production or the endpoint is disabled.

---

### Task 8: Sanitized `<SafeMarkdown>` component; replace all raw renders

**Files:**
- Create: `app/components/ui/safe-markdown.tsx`
- Modify (barrel): `app/components/ui/index.ts`
- Modify: `app/wiki/[id]/page.tsx`, `app/history/page.tsx`, `app/features/features-pane.tsx`, `app/faq/faq-pane.tsx`, `app/components/news-pane/news-pane.tsx`, `app/components/forms/wiki-form.tsx`
- Test: `app/components/ui/__tests__/safe-markdown.test.tsx`
- Add dep: `rehype-sanitize`

**Interfaces:**
- Produces: `<SafeMarkdown>{markdown}</SafeMarkdown>` — renders Markdown with raw HTML allowed but sanitized (scripts/event handlers stripped, images/links/formatting kept).

- [ ] **Step 1: Install rehype-sanitize**

```bash
pnpm add rehype-sanitize
```

- [ ] **Step 2: Write the failing test**

Create `app/components/ui/__tests__/safe-markdown.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SafeMarkdown } from "@/app/components/ui/safe-markdown";

describe("SafeMarkdown", () => {
	it("renders markdown formatting and keeps images", () => {
		const { container } = render(
			<SafeMarkdown>{"# Title\n\n![alt](https://x/y.png)"}</SafeMarkdown>,
		);
		expect(container.querySelector("h1")?.textContent).toBe("Title");
		expect(container.querySelector("img")).not.toBeNull();
	});

	it("strips script tags from raw HTML", () => {
		const { container } = render(
			<SafeMarkdown>{'<p>ok</p><script>window.x=1</script>'}</SafeMarkdown>,
		);
		expect(container.querySelector("script")).toBeNull();
		expect(container.textContent).toContain("ok");
	});
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run app/components/ui/__tests__/safe-markdown.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `app/components/ui/safe-markdown.tsx`**

```tsx
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// Allow images (incl. data/remote src) on top of the safe default schema.
const schema = {
	...defaultSchema,
	attributes: {
		...defaultSchema.attributes,
		img: [...(defaultSchema.attributes?.img ?? []), "src", "alt", "title"],
	},
};

export function SafeMarkdown({ children }: { children: string }) {
	return (
		<Markdown rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}>
			{children}
		</Markdown>
	);
}
```

> Order matters: `rehypeRaw` parses raw HTML into the tree, then `rehypeSanitize` strips anything not in the schema. `<script>` and event-handler attributes are absent from `defaultSchema`, so they are removed.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run app/components/ui/__tests__/safe-markdown.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Export from the ui barrel**

Add to `app/components/ui/index.ts`: `export * from "./safe-markdown";`

- [ ] **Step 7: Replace all six raw-render sites**

In each file, remove the `import Markdown from "react-markdown"` and `import rehypeRaw from "rehype-raw"` lines and the `<Markdown rehypePlugins={[rehypeRaw]}>…</Markdown>` usage, replacing with `<SafeMarkdown>…</SafeMarkdown>` (import `SafeMarkdown` from `@/app/components/ui` or `@/app/components`). Sites: `app/wiki/[id]/page.tsx:37`, `app/history/page.tsx:57`, `app/features/features-pane.tsx:67`, `app/faq/faq-pane.tsx:57`, `app/components/news-pane/news-pane.tsx:40`, `app/components/forms/wiki-form.tsx:66`. (The title-only `<Markdown>` in features-pane, if present without rehypeRaw, may also switch to SafeMarkdown for consistency.)

- [ ] **Step 8: Verify + commit**

Run: search for remaining `rehype-raw` imports outside `safe-markdown.tsx` — expect none. Run `pnpm typecheck`, `pnpm test`, `pnpm build`.
Run: `pnpm exec biome check --write` on `app/components/ui/safe-markdown.tsx`, its test, `app/components/ui/index.ts`, and the six edited files.
```bash
git add -A
git commit -m "feat: sanitize all markdown rendering via SafeMarkdown"
```

---

### Task 9: Baseline security headers

**Files:**
- Modify: `next.config.ts`

**Interfaces:** adds a `headers()` async function returning a baseline set for all routes.

- [ ] **Step 1: Add headers to `next.config.ts`**

Add to the `nextConfig` object:

```ts
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-Frame-Options", value: "SAMEORIGIN" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
					{
						key: "Strict-Transport-Security",
						value: "max-age=63072000; includeSubDomains; preload",
					},
				],
			},
		];
	},
```

> A full `Content-Security-Policy` is deferred: the app loads Discord CDN images and the Buy-Me-a-Coffee widget, so a CSP needs their origins enumerated. Add the four low-risk headers now; a tuned CSP can follow once external origins are inventoried (note it for a later task rather than shipping a CSP that breaks the widget).

- [ ] **Step 2: Verify + commit**

Run: `pnpm build` (succeeds). Reason: headers apply to all routes.
Run: `pnpm exec biome check --write next.config.ts`
```bash
git add -A
git commit -m "feat: add baseline security response headers"
```

---

### Task 10: Row Level Security migration (SQL) — author + apply

**Files:**
- Create: `supabase/migrations/0001_wiki_pages_rls.sql`

**Interfaces:** DB-level policies enforcing public read, editor-only write on `wiki_pages`.

> **Verification points before writing the SQL:** confirm how `get_user_role()` derives the role (JWT claim vs. a `user_roles`/profiles table). The RLS policy must use the SAME source so app checks and DB agree. If `get_user_role()` reads a table, the policy should call it (`public.get_user_role() IN ('admin','moderator')`); if it reads a JWT claim, mirror that. The implementer should inspect the function definition (ask the controller to run `select prosrc from pg_proc where proname='get_user_role'` against the project, or check existing migration/dashboard) BEFORE finalizing.

- [ ] **Step 1: Author the migration**

Create `supabase/migrations/0001_wiki_pages_rls.sql`:

```sql
-- Enable RLS on wiki_pages and enforce public read / editor-only write.
alter table public.wiki_pages enable row level security;

-- Anyone (including anon) may read wiki content.
drop policy if exists "wiki_pages public read" on public.wiki_pages;
create policy "wiki_pages public read"
  on public.wiki_pages for select
  using (true);

-- Only admins/moderators may insert/update/delete.
-- NOTE: assumes get_user_role() returns the caller's role. Adjust to the
-- confirmed role source before applying.
drop policy if exists "wiki_pages editor write" on public.wiki_pages;
create policy "wiki_pages editor write"
  on public.wiki_pages for all
  using (public.get_user_role() in ('admin', 'moderator'))
  with check (public.get_user_role() in ('admin', 'moderator'));
```

- [ ] **Step 2: Commit the SQL (do NOT apply yet)**

Run: `pnpm exec biome check --write` is not applicable to `.sql`; skip formatter for SQL.
```bash
git add supabase/migrations/0001_wiki_pages_rls.sql
git commit -m "feat: add RLS policies for wiki_pages (public read, editor write)"
```

- [ ] **Step 3: MANUAL — apply to the live project (controller pauses for the user)**

The controller confirms with the user, then applies via `supabase db push` (if the CLI is linked) or by pasting the SQL into the Supabase dashboard SQL editor. After applying, verify: an anon client can `select` from `wiki_pages`; a non-editor `insert` is rejected by RLS. Record the outcome; do not mark the task complete until applied and verified (or the user explicitly defers application).

---

## Self-Review

**Spec coverage (Phase 2 slice of the design spec):**
- Discord-only, remove email/password → Task 4. ✅
- Public-by-default middleware, gate members → Task 2. ✅
- Split auth helpers (getUser/requireUser/requireRole) → Task 1. ✅
- Server-side role enforcement (admin OR moderator) → Task 5. ✅
- `/private`→`/profile`, harden, loading → Task 3. ✅
- RLS migrations (author + apply) → Task 10. ✅
- Cron auth bypass fix → Task 7. ✅
- `rehype-sanitize` → Task 8. ✅
- Security headers → Task 9. ✅
- Env validation load-bearing (Phase 1 carryover) + mutation-failure UX (Phase 1 carryover) → Task 6. ✅
- Deferred by design (not in this plan): route-group + `utils`→`lib` folder moves (cleanup phase); caching/`revalidateTag` and stats-service split (Phase 3); dead-code/Docker/README (Phase 4); Playwright/CI (Phase 5); tuned CSP (later).

**Placeholder scan:** No `TBD`/`TODO`. Task 10 Step 3 is an explicit MANUAL/pause step, not a placeholder. Consumer edits that say "apply this swap" name the exact file:line and the exact replacement.

**Type/name consistency:** `getUser`/`requireUser`/`requireRole` defined in Task 1 are used with those exact names in Tasks 3 and 5. `parseRole`/`canEditContent` (Task 1) used in Tasks 1 and 5. `isProtectedPath` (Task 2) used in the middleware. `SafeMarkdown` (Task 8) replaces every `rehypeRaw` site. `requireRole(UserRole.ADMIN, UserRole.MODERATOR)` is consistent between the edit page (Task 1 Step 7), the actions (Task 5), and the RLS policy roles (Task 10).

**Risks carried:** Task 10's policy correctness depends on the `get_user_role()` source — flagged as a pre-write verification. Task 6's env fail-fast will surface any missing build-time var — intended, but the controller should ensure CI/`.env` provides them.
