# No-Books-Next — Architectural Overhaul Design

**Date:** 2026-07-22
**Branch:** `refactor/architectural-overhaul`
**Status:** Approved design — ready for implementation planning

## Context

`no-books-next` is the community website for the **noboobs.world** Ukrainian Minecraft server (Next.js 16 App Router, React 19, Supabase, Tailwind v4 + daisyUI v5, Biome). Dependencies are already at their latest majors, so this effort is **not** a framework upgrade — it is an architecture, code-quality, and security overhaul on top of an already-modern stack.

The work happens on a dedicated branch (`refactor/architectural-overhaul`). If it goes wrong, we revert to `main` and instead do a careful incremental cleanup.

### Chosen approach

**Approach A — idiomatic Next App Router + a thin typed data-access layer**, with light feature-grouping. No heavy layered/hexagonal ceremony. URLs are preserved throughout; the app stays deployable at every step.

## Goals

1. Separate concerns: a **pure data-access layer** that never navigates or renders.
2. Flip the auth model to **public-by-default**, gating only members/admin actions. **Discord-only** sign-in.
3. Make security real: **RLS at the database**, server-side authorization, secret hygiene, XSS sanitization.
4. Introduce a **caching strategy** (cache + invalidate-on-edit) instead of blanket `no-store`.
5. Add **error/loading boundaries**, **env + input validation (Zod)**, and **typed Supabase**.
6. Remove dead code and the legacy content path; standardize tooling on Biome.
7. Add an **automated test suite** (Vitest + RTL + Playwright) and **CI that gates deploys**.

## Non-goals / out of scope

- No visual redesign; existing UI, daisyUI theme (`dark`), and framer-motion transitions are preserved.
- No internationalization work; content stays hardcoded Ukrainian.
- No migration off Supabase, Next.js, or daisyUI.
- No git-history rewrite to purge leaked secrets (remediation is key rotation).
- No full DB seeding harness for e2e (e2e focuses on routing/auth/authorization).

---

## Section 1 — Target structure & data-access layer

**Problem:** data-fetch functions currently query Supabase, decide navigation (`redirect("/404")`, `redirect("/error")`), and render UI (`import toast`) all at once — so they can't be reused or tested, and client-only `toast` leaks into server code.

**Target layout** (route groups `(...)` do not change URLs):

```
app/
  (public)/          # open — home, wiki, regions, rules, faq, features, history, stats, map, start
  (members)/
    profile/         # the current /private page, re-homed & hardened
  (auth)/            # login flow + callback/confirm route handlers
  api/               # online, telegram-news-sync
  lib/
    supabase/        # server.ts, client.ts, middleware.ts (typed with generated DB types)
    data/            # PURE data-access layer: wiki.ts, stats.ts, news.ts
    env.ts           # validated, typed env (fail fast at boot)
    errors.ts        # AppError, NotFoundError
    utils/           # cn.ts, constants.ts
    types/           # database.types.ts (generated) + domain types
  components/         # UI, feature-grouped
  layout.tsx  middleware.ts  globals.css
```

**DAL rule — one job each.** Data functions take a typed client, return typed data, and throw typed errors. They never call `redirect()` and never import client-only code.

```ts
// lib/data/wiki.ts
export async function getWikiPageByUrlName(sb: Client, urlName: string) {
  const { data, error } = await sb.from("wiki_pages")
    .select("*").eq("url_name", urlName).single();
  if (error) throw new AppError("Failed to load page", { cause: error });
  if (!data) throw new NotFoundError(`wiki page: ${urlName}`);
  return data; // typed from generated DB types
}
```

- **Pages** translate outcomes to navigation: `NotFoundError` → `notFound()`, unexpected → thrown to nearest `error.tsx`.
- **Server Actions** stay thin wrappers; user-facing `toast` lives only in client components.
- **Typed Supabase:** generate `lib/types/database.types.ts` from the schema; clients are typed with it.

---

## Section 2 — Auth model, routing & profile

**Discord-only.** Remove email/password `login`/`signup` actions and the email/password form; consolidate `/login` and `/login/discord` into a single Discord sign-in under `(auth)`.

**Middleware** (`lib/supabase/middleware.ts`): still calls `supabase.auth.getUser()` on every request (required by `@supabase/ssr` to refresh the session cookie), but redirects to `/login` **only** for `(members)` routes. Everything else is reachable logged-out. Default flips from deny to allow.

**Auth helpers** replace the single overloaded `getAuthorizedUser`:
- `getUser(): UserAccount | null` — never redirects; for pages that render differently when logged in.
- `requireUser(): UserAccount` — redirects to `/login` if absent; for `(members)` pages.
- `requireRole(...roles)` — asserts the user holds one of the given roles via the `get_user_role` RPC; called inside mutating server actions.

**Server-side authorization:** the wiki mutation actions (`create`/`update`/`delete`) must call `requireRole('admin', 'moderator')` — content editing is allowed for admins **and** moderators (the reason the moderator role exists). This must match the RLS policy in Section 3 exactly. UI hiding of admin buttons is not access control and is insufficient on its own.

**Profile page** (`/private` → `/profile`, under `(members)`):
- Re-home and harden the existing `PrivatePage`. Replace unguarded `user.user_metadata.custom_claims.global_name` access with the safe `name` the helper already computes.
- Discord ID stays `user_metadata.provider_id` → `getPlayerIndividualStats`; keep the graceful-empty fallback; add `loading.tsx`.
- Keep the Discord avatar (`cdn.discordapp.com` is already allowed); replace the `via.placeholder.com` fallback (not in `remotePatterns`) with a local default image.
- OAuth callback redirect target changes `/private` → `/profile`.

---

## Section 3 — Security hardening

**Key fact:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public by design (ships to browsers). App-side role checks are therefore **not** a security boundary on their own; the real boundary is the database.

1. **Row Level Security (RLS) policies** — committed as SQL migrations under `supabase/migrations/`. `wiki_pages`: public `SELECT`; `INSERT`/`UPDATE`/`DELETE` restricted to admins/moderators (checked against the same role source as `get_user_role`). *Author now; applying to the live project is confirmed at execution time (needs Supabase CLI linked or dashboard access).*
2. **Server-side authorization** on every mutation (`requireRole`) — defense-in-depth over RLS.
3. **Fix cron auth bypass:** `telegram-news-sync/route.ts` currently does `if (!secret) return true` (open when `CRON_SECRET` unset). Change to deny when the secret is missing or mismatched.
4. **Stored-XSS:** wiki content renders with `rehype-raw` and is now public. Add **`rehype-sanitize`** with an allowlist keeping images/links/formatting but stripping `<script>`/event handlers.
5. **Secret hygiene:** keep `SUPABASE_SERVICE_ROLE_KEY` strictly server-side (never `NEXT_PUBLIC`); stop tracking `.env`; rotate exposed keys (see Section 5).
6. **Baseline security headers** via `next.config.ts`: a minimal CSP plus `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
7. **Env validation** (Section 4): boot fails fast when a required secret is missing.

---

## Section 4 — Data fetching, caching, boundaries & external APIs

**Caching — replace blanket `no-store`:**
- **Wiki content:** cache with tags (`wiki`, `wiki:<slug>`); mutation actions call `revalidateTag` after a successful write. Wiki pages serve from cache and refresh the instant an admin saves.
- **Server stats:** cache ~60s. **Online players:** ~15–30s. Avoids hammering the slow `api.noboobs.world`.
- **Profile stats:** per-request with the existing graceful-empty fallback.

**Error & loading boundaries** (none exist today): `not-found.tsx` + `error.tsx` at root and per route group; `loading.tsx` for async pages (wiki, stats, profile).

**External integrations cleanup:**
- Split `stats-service.ts` (~400 lines) into a thin fetch in `lib/data/stats.ts` and **pure, unit-testable transforms**: `translateScores`, `filterEligiblePlayers`, `cmToMeters`, `deriveLeastDeaths`. Remove the dead `getDiscordIds` stub and commented blocks.
- Centralize repeated `API_BASE_URL` + user-agent + timeout into one `serverApiFetch()` helper.
- Telegram service: keep the service-role client server-side only; document that the in-memory `lastHourlySyncAt` throttle resets on redeploy (acceptable for a cron endpoint).

**Validation with Zod (new dependency):**
- `lib/env.ts` validates required env at boot and fails fast.
- Server Action inputs (wiki form) are parsed with Zod schemas, replacing `formData.get(...) as string`.

---

## Section 5 — Cleanup, consolidation & config

**Dead code removal:**
- Delete the orphaned Storage content path: `utils/markdown-files/` (`get-files-list.ts`, `get-file-content.ts`), `use-features-list.ts`, and `FeaturesPane` (confirm no live import). `features/page.tsx` already uses the DB.
- Remove fully-commented files/blocks: `use-role.ts` (100% commented), the commented `getFeaturesData`/old page in `features/page.tsx`, `checkUserAdminProtected` in `auth/helpers.ts`, the dead `getDiscordIds` stub, and commented URLs in `constants.ts`.
- Replace `// biome-ignore ... <explanation>` placeholders by fixing the underlying issue where easy (`noForEach` → `for...of`).

**Tooling — standardize on Biome, drop ESLint:**
- Remove `depr-eslint.config.mjs` and the `eslint` / `eslint-config-next` / `@eslint/eslintrc` devDeps.
- Add scripts: `typecheck` (`tsc --noEmit`), `format` (`biome format --write`), `check` (`biome check --write`), `test`, `test:e2e`. Run Biome repo-wide so space-indented files normalize to tabs/double-quotes.

**Config & Docker:**
- Delete the plain `Dockerfile` (runs `pnpm start`, ships full `node_modules`); rename `Dockerfile.optimized` → `Dockerfile` (correct standalone multi-stage, non-root, `node server.js`); point `docker-compose.yml` at it; drop the leftover `RUN ls -la ./` debug line.

**Secrets hygiene:**
- `git rm --cached .env` (already gitignored, just tracked). Add a committed `.env.example` with placeholder keys + comments. Document required vars in the README.
- **Manual step (required):** rotate the exposed anon + service-role keys in the Supabase dashboard — they are in git history and rotation is the only real remediation.

**Docs:** update the stale `README.md` (wrong versions) to match the real stack, structure, and commands.

---

## Section 6 — Testing & CI

**Unit / component — Vitest + React Testing Library:**
- Unit targets (highest value): stats transforms (`translateScores`, `filterEligiblePlayers`, `cmToMeters`, `deriveLeastDeaths`), telegram helpers (message normalize, slug/date formatting, dedup), Zod env + action schemas, and DAL functions against a **mocked Supabase client** (assert query shape + error → `NotFoundError`/`AppError` mapping).
- Component tests: `WikiGrid`, the wiki form (validation + submit), admin-button visibility by role.

**End-to-end — Playwright (deliberately tight):**
- Public flows (no login): home → wiki → rules → stats reachable.
- Auth gating: `/profile` logged-out redirects to `/login`; with a session it renders.
- Authorization: an admin session can edit a page; a non-admin cannot.
- Caveat: real Discord OAuth cannot run in CI, so e2e **seeds a Supabase session cookie** rather than clicking through Discord. Deep DB seeding is out of scope.

**CI — gate deploys on green:**
- New `.github/workflows/ci.yml` on PR + push to `main`: `pnpm install --frozen-lockfile` → `biome check` → `typecheck` → `build` → `test` (unit). Playwright e2e on PRs.
- The existing deploy job gets `needs: [ci]` so a failing check blocks production (today it deploys unconditionally on push to `main`).

---

## Risks & verification points

- **Discord ID location** (`user_metadata.provider_id`) is confirmed in the current `/private` page; verify it still resolves for the profile after the auth refactor.
- **RLS role source:** confirm how `get_user_role` derives the role (JWT claim vs. table lookup) so RLS policies match it exactly. RLS + app checks must agree.
- **Applying migrations** to the live Supabase project requires CLI/dashboard access — confirm at execution time before running them.
- **Route-group moves** are mechanical but touch ~12 folders; verify each route still resolves (URLs unchanged) after the move.
- **`rehype-sanitize` allowlist** must not strip legitimate existing wiki formatting; verify against real content.
- **Caching correctness:** confirm `revalidateTag` fires on every wiki mutation path so stale content can't persist after an edit.

## Required manual steps (outside the code)

1. Rotate the exposed Supabase anon + service-role keys.
2. Set `CRON_SECRET` in the production environment (the telegram-sync endpoint will deny without it).
3. Apply the RLS/role SQL migrations to the Supabase project.
