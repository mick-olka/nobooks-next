# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Community website for the **noboobs.world** Ukrainian Minecraft server. All user-facing content is in Ukrainian. It serves a wiki/knowledge base (regions, rules, FAQ, features, history/news), live server statistics, and player accounts. Deployed via Docker to a self-hosted server.

## Commands

`pnpm` is the package manager (there is a `pnpm-lock.yaml`; the Dockerfile uses `corepack enable pnpm`).

- `pnpm run dev` — dev server (Next.js with **Turbopack**)
- `pnpm run build` — production build
- `pnpm start` — run the production build
- `pnpm run lint` — Biome lint with `--write` (auto-fixes)
- `pnpm run format` — Biome format with `--write`
- `pnpm run check` — Biome check (lint + format) with `--write`
- `pnpm run typecheck` — `tsc --noEmit`
- `pnpm test` — run the Vitest suite once
- `pnpm run test:watch` — Vitest in watch mode

**Biome is the only linter/formatter** — ESLint has been removed entirely (no config, no dependency). Biome enforces **tab indentation** and **double quotes**. Tests use **Vitest + React Testing Library**; specs live in `__tests__` folders next to the code they cover (e.g. `app/lib/data/__tests__`, `app/auth/__tests__`).

## Architecture

App Router project; **everything lives under `app/`** (no `src/`). The path alias `@/*` maps to the repo root, so imports are written `@/app/...`. Nearly every folder has a barrel `index.ts` — import from the folder (`@/app/components`, `@/app/utils/services`, `@/app/types`), not from individual files.

### Auth is public by default; only a few things require login

`middleware.ts` lives at the **project root** (not `app/`) and runs `updateSession()` (from `app/utils/supabase/middleware.ts`) on every non-asset request (see the `matcher` in `middleware.ts`). It refreshes the Supabase session and redirects to `/login` **only** if the request is unauthenticated *and* the path matches `isProtectedPath()` in `app/auth/protected-paths.ts` — currently just `/profile`. Every other route (wiki, regions, rules, faq, features, stats, etc.) is public.

Three Supabase client factories, do not mix them up:
- `app/utils/supabase/server.ts` — `createClient()` for Server Components / Server Actions (cookie-based, user-scoped)
- `app/utils/supabase/client.ts` — `createClient()` for Client Components (browser)
- `app/utils/supabase/middleware.ts` — `updateSession()` for the middleware only
- `app/lib/supabase/public.ts` — `createPublicClient()`, a cookieless anon client used for cached public reads (see below)

All three are typed with the generated `Database` type from `app/lib/types/database.types.ts`.

`app/auth/helpers.ts` exports the auth entry points (re-exported from `app/auth/index.ts`); there is no `getAuthorizedUser`:
- `getUser()` — returns the signed-in user or `null`, never redirects
- `requireUser()` — redirects to `/login` if signed out
- `requireRole(...roles)` — redirects to `/login` if signed out, to `/` if the role doesn't match

The role itself comes from the Supabase RPC `get_user_role`; `app/auth/roles.ts` has the pure helpers `parseRole()` (safely coerces to a `UserRole`, defaulting to `user`) and `canEditContent()` (true for `admin`/`moderator`). Roles are the `UserRole` enum (`admin` / `moderator` / `user`, in `app/types`).

Sign-in is **Discord OAuth only** (`signInWithDiscord` in `app/login/actions.ts`) — email/password auth has been removed. OAuth redirects to `${NEXT_PUBLIC_APP_URL}/auth/callback` (`app/auth/callback/route.ts`).

### Data access, mutations, and caching

- **Pure data-access layer** in `app/lib/data/`: `wiki.ts` (CRUD against `wiki_pages`, takes a Supabase client as an argument), `wiki-cache.ts` (cached public reads, see below), `stats.ts` (fetches/composes server stats), `stats-transforms.ts` (pure transforms), `server-api.ts` (the `serverApiFetch()` wrapper around the Minecraft server API).
- **Server Actions** in `app/actions/` wrap the DAL for mutations: `wiki.ts` (`createWikiPageAction`/`updateWikiPageAction`/`deleteWikiPageAction`, each calling `requireRole(UserRole.ADMIN, UserRole.MODERATOR)` before touching the DB) and `stats.ts` (`fetchStatsData`).
- **Typed errors** in `app/lib/errors.ts`: `AppError` (base, carries a `cause`) and `NotFoundError`, with an `isNotFoundError()` type guard.
- **Validated environment** in `app/lib/env.ts`: a Zod schema parses `process.env` at import time and throws on invalid config — this runs at module load, so a bad `.env` fails the build/boot instead of failing silently at request time. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`. Optional: `NEXT_PUBLIC_STATS_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.

The old `app/utils/services/markdown-service.ts` is deleted; wiki CRUD now lives entirely in `app/lib/data/wiki.ts`.

### The wiki is one table with a type discriminator

Knowledge-base content that's actually editable in-app is rows in the Supabase **`wiki_pages`** table, discriminated by `type` (`WikiPageType`: `region` / `wiki` / `feature` / `rule` / `history` / `faq` — see `app/types/wiki-pages.ts`). Only `/regions`, `/history`, and `/wiki/[id]` actually read `wiki_pages`; `/wiki/[id]` looks pages up by **`url_name`** (a slug), not the numeric id.

**`/faq` and `/rules` (and `/features`) do NOT read `wiki_pages`** — they read local Markdown/data files: `/faq` reads `app/faq/data/*.md` directly off disk (`readdirSync`/`readFileSync` in `app/faq/page.tsx`) and parses them client-side with `useFeaturesList` (`app/utils/hooks/use-features-list.ts`); `/features` does the same against `app/features/data/*.md`; `/rules` reads the static array in `app/rules/data.ts`. Don't assume these routes hit the database.

Public reads of `wiki_pages` are cached via `app/lib/data/wiki-cache.ts` using `unstable_cache` (tag `"wiki"`, `revalidate: 300`) against the **cookieless** `createPublicClient()` (not the per-request cookie-bound server client — using the user-scoped client here would leak cache across sessions). The cache is invalidated with `revalidateTag(WIKI_TAG, { expire: 0 })` whenever a wiki page is created/updated/deleted (`app/actions/wiki.ts`) and after a successful Telegram news sync (`app/api/telegram-news-sync/route.ts`).

Page content is Markdown, rendered via `<SafeMarkdown>` (`app/components/ui/safe-markdown.tsx`): `react-markdown` + `rehype-raw` (raw HTML allowed) + `rehype-sanitize` with the default schema, so any injected HTML is sanitized before render. Markdown styling relies on the `.markdown`/`.editor` classes in `app/globals.css`, which use `all: revert` to opt back out of Tailwind's reset.

### External data sources

- `https://api.noboobs.world` — Minecraft server API, accessed via `serverApiFetch()` in `app/lib/data/server-api.ts`. `app/lib/data/stats.ts` fetches the scoreboard (`/stats/all`, revalidate 60) + online list (`/online`, revalidate 30) and composes `buildStatsData()` from `app/lib/data/stats-transforms.ts`, which translates stat keys to Ukrainian (`SCORES_TRANSLATE` map), filters to players with >8 hours played, converts distances cm→m, and derives a "Least Deaths" stat. `app/api/online/route.ts` proxies the online-players endpoint.
- Telegram news sync: `app/utils/services/news-service.ts` (`syncTelegramNews`) pulls the latest Telegram message from the API and inserts it as a `history`-type `wiki_pages` row (deduped by content). Triggered via `GET /api/telegram-news-sync`, which requires `Authorization: Bearer <CRON_SECRET>` — **it fails closed**: if `CRON_SECRET` isn't set, every request is rejected (401), it does not fall back to "unprotected". This path uses a **service-role** Supabase client built from `SUPABASE_SERVICE_ROLE_KEY`, and skips (rather than throwing) if that key is absent.

### Security

- RLS is enabled on `wiki_pages` via `supabase/migrations/0001_wiki_pages_rls.sql`: public `select`, `insert`/`update`/`delete` restricted to `admin`/`moderator` (via `get_user_role()`).
- Mutations are also gated server-side: every Server Action in `app/actions/wiki.ts` calls `requireRole(UserRole.ADMIN, UserRole.MODERATOR)` before touching the database, so RLS is defense-in-depth, not the only gate.
- `next.config.ts` sets baseline security headers on every response (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`).
- Markdown is sanitized on render (see `<SafeMarkdown>` above) even though raw HTML is accepted as input.

### Styling

Tailwind **v4** with **CSS-based config** — there is no `tailwind.config.js`. Tailwind and the **daisyUI v5** plugin are wired up directly in `app/globals.css` (`@import "tailwindcss"; @plugin "daisyui";`). The theme is fixed to daisyUI `dark` (`data-theme="dark"` on `<html>` in `app/layout.tsx`). Use daisyUI component classes (`card`, `bg-base-100`, `bg-base-200`, etc.). `clsx` + `tailwind-merge` are combined in `app/utils/cn.ts` (`cn()`). `framer-motion` drives page transitions (`PageTransitionWrapper`, `AnimatePresence` in the layout). Seasonal decorative backgrounds live in `app/components/{christmas-ui,spring-ui,nether-ui}` and are swapped in/out as themes.

## Environment

Config comes from `.env` (git-ignored; see `.env.example` for the full list of vars with placeholder values). Key vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (telegram sync only), `NEXT_PUBLIC_APP_URL` (OAuth redirect base), `NEXT_PUBLIC_STATS_URL` (optional), `CRON_SECRET` (required in production to enable the sync endpoint — it fails closed without it). `app/lib/env.ts` validates these with Zod at startup.

**The Supabase URL/anon key and other values previously committed in `.env` were exposed in git history — rotate them** (regenerate the anon key and any secrets in the Supabase dashboard) before treating this repo as having a clean secret history.

## Deployment

`next.config.ts` sets `output: "standalone"`. There is a single `Dockerfile` (standalone, multi-stage) and `docker-compose.yml` builds from it, mapping host `8085` → container `3000`. `.github/workflows/deploy.yml` deploys on push to `main` by SSHing into the server and running `git pull && docker compose down && docker compose up --build -d`.
