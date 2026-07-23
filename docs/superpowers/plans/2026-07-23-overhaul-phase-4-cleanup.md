# Overhaul Phase 4 — Cleanup & Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Remove dead code and the legacy storage path, standardize tooling on Biome (drop ESLint) and normalize formatting repo-wide, consolidate the Dockerfile, add secrets-hygiene scaffolding, refresh the docs to the new architecture, and clear the ~10 Minors carried from Phases 1–3 — leaving the repo lint-clean and ready for the Phase 5 CI gate.

**Architecture:** Mechanical cleanup. Ordering matters: dead-code removal and lint/type fixes land BEFORE the repo-wide Biome format pass (so formatting runs over the final code), which is committed on its own as formatting-only churn. Docs are refreshed last to reflect the end state.

**Tech Stack:** Next.js 16, TypeScript strict, Biome, pnpm, Docker.

## Global Constraints

- Node 24 / **pnpm**; **Biome** (tabs, double quotes). Per-file `pnpm exec biome check --write <files>` before each commit, EXCEPT the dedicated repo-wide format task.
- TypeScript **strict**; `@/*` → repo root. `pnpm typecheck`, `pnpm test`, and `pnpm build` must stay green at every commit.
- **No behavior/URL changes.** This phase removes only unreferenced code and reformats; it must not alter runtime behavior. Verify each deletion is truly unused (no live import) before removing.
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Conventional prefixes: `chore:`, `refactor:`, `docs:`, `fix:`, `style:`.

---

### Task 1: Remove dead code & the legacy storage path

**Files (delete — after confirming each is unimported):**
- `app/utils/markdown-files/get-files-list.ts`, `app/utils/markdown-files/get-file-content.ts` (+ the `markdown-files/` dir)
- `app/utils/hooks/use-features-list.ts`
- `app/features/features-pane.tsx`
- `app/utils/hooks/use-role.ts` (100% commented)
- `app/auth/confirm/route.ts` (email-OTP confirm route — orphaned under Discord-only)

**Files (edit — remove dead blocks/imports):**
- `app/features/page.tsx` — delete the large commented-out `getFeaturesData`/old-page block and the commented `getAuthorizedUser` import lines
- `app/components/wiki/wiki-grid.tsx` — remove the dead commented `<Markdown rehypePlugins={[rehypeRaw]}>` block and the now-unused `Markdown`/`rehypeRaw`/`React` imports
- `app/components/layout-elements/header.tsx` — remove the unused `NetherBackground` import
- `app/utils/constants.ts` — remove the commented-out alternate URLs
- `app/stats/page.tsx` — remove the dead `try/catch` (getPlayerStats already returns empty StatsData on error; the fallback is unreachable) — simplify to `const initialData = await getPlayerStats();`

**Interfaces:** none produced; purely subtractive.

- [ ] **Step 1: Confirm each target is unused**

Run `git grep -n` for each symbol/path to confirm no LIVE import references it (comments/self-matches don't count):
`git grep -n "markdown-files\|useFeaturesList\|FeaturesPane\|use-role\|useRole\|auth/confirm"` — verify the only hits are the files themselves or commented lines. In particular confirm `app/faq/faq-pane.tsx` does NOT import `features-pane` (a prior grep matched it — check it's incidental). If any target has a live import, STOP and report it.

- [ ] **Step 2: Delete the dead files**

```bash
git rm app/utils/markdown-files/get-files-list.ts app/utils/markdown-files/get-file-content.ts app/utils/hooks/use-features-list.ts app/features/features-pane.tsx app/utils/hooks/use-role.ts app/auth/confirm/route.ts
```

- [ ] **Step 3: Remove the dead blocks/imports**

Edit the five files listed above, removing only the dead commented blocks and now-unused imports (and the `stats/page.tsx` try/catch). Do not change any live logic.

- [ ] **Step 4: Verify + commit**

Run: `pnpm typecheck` (clean), `pnpm test` (green), `pnpm build` (succeeds). Grep again to confirm nothing references the deleted files.
Run: `pnpm exec biome check --write` on the edited (not deleted) files.
```bash
git add -A
git commit -m "chore: remove dead code and legacy storage content path"
```

---

### Task 2: Drop ESLint; standardize on Biome scripts

**Files:**
- Delete: `depr-eslint.config.mjs`
- Modify: `package.json` (remove eslint devDeps + add scripts)

**Interfaces:** produces `pnpm format` and `pnpm check` scripts.

- [ ] **Step 1: Remove ESLint config + dependencies**

```bash
git rm depr-eslint.config.mjs
pnpm remove eslint eslint-config-next @eslint/eslintrc
```

- [ ] **Step 2: Add Biome scripts**

In `package.json` `"scripts"`, ensure these exist (keep `dev`/`build`/`start`/`lint`/`typecheck`/`test`/`test:watch`):
```json
"format": "biome format --write .",
"check": "biome check --write ."
```

- [ ] **Step 3: Verify + commit**

Run: `pnpm typecheck` (clean), `pnpm build` (succeeds — confirm nothing referenced eslint-config-next in the build). `pnpm test` green.
```bash
git add -A
git commit -m "chore: drop ESLint, standardize tooling on Biome"
```

---

### Task 3: Make the repo lint- & type-clean (fix carried Minors)

**Files (fix):**
- `app/faq/faq-pane.tsx` — the `<summary>` uses `onClick`/`onKeyDown`/`tabIndex` on a non-interactive element (`noStaticElementInteractions`). Fix accessibly (e.g. keep the native `<details>/<summary>` toggle without the JS handlers, or move handlers to a `<button>`), preserving the current expand/collapse behavior and Ukrainian copy.
- `app/auth/callback/route.ts` — remove the ineffective `biome-ignore lint/style/noUselessElse` comments by removing the useless `else`/`else if` (return-in-`if` makes them unnecessary), preserving the exact redirect logic.
- `app/lib/data/stats.ts` and `app/lib/data/wiki-cache.ts` — add `import "server-only";` at the top (fail fast if ever imported client-side).
- `app/components/ui/safe-markdown.tsx` — remove the redundant `img` schema extension + the misleading `data:`-URI comment (defaultSchema already allows `img` `src`/`alt`/`title`); keep `[rehypeRaw, [rehypeSanitize, defaultSchema]]` or a minimal correct schema so behavior is unchanged.

**Interfaces:** none; the goal is `pnpm exec biome check` reporting no errors and `pnpm typecheck` clean across these files.

- [ ] **Step 1: Apply the fixes**

Edit each file per above. For `faq-pane.tsx`, verify the accordion still expands/collapses (the `useSectionsWithHash` hook behavior must be preserved). Add `server-only` to the two data modules (the package is bundled with Next; no install needed).

- [ ] **Step 2: Verify + commit**

Run: `pnpm exec biome check app/faq/faq-pane.tsx app/auth/callback/route.ts app/lib/data/stats.ts app/lib/data/wiki-cache.ts app/components/ui/safe-markdown.tsx` — expect zero errors. `pnpm typecheck` clean; `pnpm test` green; `pnpm build` succeeds.
Run: `pnpm exec biome check --write` on the changed files.
```bash
git add -A
git commit -m "fix: resolve outstanding a11y/lint issues and harden data modules"
```

---

### Task 4: Repo-wide Biome format pass (formatting-only)

**Files:** whatever `biome format`/`biome check` normalizes across the repo (the space-indented files deferred since Phase 1).

**Interfaces:** none; formatting only.

- [ ] **Step 1: Run the repo-wide format + safe fixes**

```bash
pnpm exec biome check --write .
```
This normalizes indentation (spaces→tabs), quotes, and import order, and applies Biome's safe lint fixes across the repo.

- [ ] **Step 2: Sanity-check it's formatting-only**

Run: `pnpm typecheck` (clean), `pnpm test` (green — same count as before), `pnpm build` (succeeds). Spot-check `git diff --stat` — the changes should be whitespace/quote/import-order only. If Biome applied any change that alters behavior (not just formatting), STOP and report it for review rather than committing blindly.

- [ ] **Step 3: Commit (isolated formatting commit)**

```bash
git add -A
git commit -m "style: normalize formatting repo-wide with Biome"
```

---

### Task 5: Consolidate Dockerfile; add secrets scaffolding

**Files:**
- Delete: `Dockerfile` (the simple one that runs `pnpm start`)
- Rename: `Dockerfile.optimized` → `Dockerfile` (the correct standalone multi-stage build)
- Modify: `docker-compose.yml` (point at `Dockerfile`), and remove the leftover `RUN ls -la ./` debug line from the renamed Dockerfile
- Create: `.env.example`

**Interfaces:** none.

- [ ] **Step 1: Consolidate the Dockerfile**

```bash
git rm Dockerfile
git mv Dockerfile.optimized Dockerfile
```
In the renamed `Dockerfile`, remove the `RUN ls -la ./` line. In `docker-compose.yml`, change `dockerfile: Dockerfile.optimized` → `dockerfile: Dockerfile` (or drop the `dockerfile:` key so it defaults to `Dockerfile`).

- [ ] **Step 2: Add `.env.example`**

Create `.env.example` (placeholders only — NO real values):
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Server-only (Telegram news sync); never expose to the client
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# OAuth redirect base (e.g. http://localhost:3000 in dev)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Optional external stats server
NEXT_PUBLIC_STATS_URL=
# Required in production to enable the telegram-news-sync cron endpoint (fails closed if unset)
CRON_SECRET=your-cron-secret
```

- [ ] **Step 3: Verify + commit**

Run: `docker compose config` if Docker is available to confirm the compose file parses (optional — if Docker isn't available, just confirm the compose YAML references `Dockerfile`). Confirm the repo still builds: `pnpm build`.
```bash
git add -A
git commit -m "chore: consolidate Dockerfile and add .env.example"
```

---

### Task 6: Refresh the docs (CLAUDE.md + README)

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

**Interfaces:** none.

Update both docs to describe the CURRENT architecture (post Phases 1–3). Key corrections:
- **Auth model:** public by default; only `/profile` (and admin/editor actions) require login. **Discord-only** sign-in (no email/password). `middleware.ts` lives at the project ROOT and runs `updateSession`; it redirects only protected paths. Auth helpers are `getUser`/`requireUser`/`requireRole` (not `getAuthorizedUser`).
- **Data-access layer:** pure DAL in `app/lib/data/` (`wiki.ts`, `wiki-cache.ts`, `stats.ts`, `stats-transforms.ts`, `server-api.ts`), typed Supabase clients (`app/utils/supabase/`), typed errors (`app/lib/errors.ts`), validated env (`app/lib/env.ts`, load-bearing). Mutations wrapped as Server Actions in `app/actions/`.
- **Wiki content:** still one `wiki_pages` table by `type`. Public reads cached via `unstable_cache` (tag `wiki`, 300s), invalidated on edit/news-sync. Markdown rendered via the sanitized `<SafeMarkdown>` (rehype-sanitize).
- **Correct the stale claims:** `/faq` and `/rules` read LOCAL files (`app/faq/data/*.md`, `app/rules/data`), NOT `wiki_pages`. CRUD is in `app/lib/data/wiki.ts` (not `markdown-service.ts`, which is deleted).
- **Security:** RLS migration in `supabase/migrations/`, server-side `requireRole('admin','moderator')` on mutations, baseline security headers, `CRON_SECRET` fail-closed.
- **Commands:** add `typecheck`, `test`, `format`, `check`. Note tests exist now (Vitest + RTL). Update the stale README versions block.
- **Env:** point to `.env.example`; document that the exposed keys must be rotated.

- [ ] **Step 1: Rewrite the stale sections**

Update `CLAUDE.md` (the "Auth", "wiki", "External data sources", "Commands", "Environment", and "Note" sections) and `README.md` (versions/notes) to match the above. Keep it concise and accurate; do not invent features.

- [ ] **Step 2: Verify + commit**

Docs-only; no build impact, but run `pnpm build` to be safe.
```bash
git add CLAUDE.md README.md
git commit -m "docs: update CLAUDE.md and README to the current architecture"
```

---

## Self-Review

**Spec coverage (Phase 4 slice of the design spec, Section 5):**
- Delete legacy Storage path + dead/commented files → Task 1. ✅
- Drop ESLint, Biome-only, add scripts → Task 2. ✅
- Repo-wide Biome format (deferred from Phase 1) → Task 4. ✅
- Single standalone Dockerfile + drop debug line → Task 5. ✅
- Secrets hygiene (.env.example; `.env` already untracked so no `git rm --cached`) → Task 5. ✅
- Docs refresh (CLAUDE.md + README) → Task 6. ✅
- Carried Minors (a11y, useless-else, server-only guards, safe-markdown schema, dead try/catch, unused imports) → Tasks 1, 3. ✅
- `middleware`→`proxy` rename (Next 16 deprecation): see note below.

**Ordering:** dead code (1) → tooling (2) → lint/type fixes (3) → repo-wide format (4) → docker/secrets (5) → docs (6). Format runs last over cleaned code; docs reflect the end state.

**Deferred within Phase 4 — `middleware.ts` → `proxy.ts` rename:** Next 16.1 emits a deprecation notice but still registers `middleware.ts` correctly. The rename is cosmetic and the `proxy` convention is still settling; doing it now risks churn for no functional gain. Recommend deferring to a follow-up once the convention stabilizes, OR handle as a tiny standalone task if the user wants zero deprecation warnings. Flagged, not silently dropped.

**Placeholder scan:** `.env.example` uses explicit placeholder strings (no real secrets). Task 6 lists concrete corrections rather than "update docs". No TBDs.

**Risk:** Task 4's repo-wide format is a large diff — it is committed in isolation (formatting-only) and gated on unchanged test count + green build so behavior can't silently change.
