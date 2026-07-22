# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Community website for the **noboobs.world** Ukrainian Minecraft server. All user-facing content is in Ukrainian. It serves a wiki/knowledge base (regions, rules, FAQ, features, history/news), live server statistics, and player accounts. Deployed via Docker to a self-hosted server.

## Commands

`pnpm` is the package manager (there is a `pnpm-lock.yaml`; the Dockerfile uses `corepack enable pnpm`).

- `pnpm run dev` — dev server (Next.js with **Turbopack**)
- `pnpm run build` — production build
- `pnpm start` — run the production build
- `pnpm run lint` — **Biome** lint with `--write` (auto-fixes and formats)

There is **no test suite** and **no typecheck script**; `pnpm run build` is the closest thing to a full check. Biome (not ESLint) is the active linter/formatter — the ESLint config is retained only as `depr-eslint.config.mjs` (deprecated). Biome enforces **tab indentation** and **double quotes**; some older files use spaces and will be reformatted on `lint --write`.

## Architecture

App Router project; **everything lives under `app/`** (no `src/`). The path alias `@/*` maps to the repo root, so imports are written `@/app/...`. Nearly every folder has a barrel `index.ts` — import from the folder (`@/app/components`, `@/app/utils/services`, `@/app/types`), not from individual files.

### Auth is site-wide by default

`app/middleware.ts` runs `updateSession` (from `app/utils/supabase/middleware.ts`) on every non-asset request. It refreshes the Supabase session and **redirects any unauthenticated user to `/login`** unless the path starts with `/login` or `/auth`. Consequence: the entire site is gated behind login unless you add an exception in the middleware matcher/redirect logic.

Three Supabase client factories, do not mix them up:
- `app/utils/supabase/server.ts` — `createClient()` for Server Components / Server Actions (cookie-based)
- `app/utils/supabase/client.ts` — `createClient()` for Client Components (browser)
- `app/utils/supabase/middleware.ts` — `updateSession()` for the middleware only

`app/auth/helpers.ts` → `getAuthorizedUser({ protectedPage?, adminProtectedPage? })` is the central auth entry point for pages. It loads the user, resolves the role via the Supabase RPC **`get_user_role`**, and can redirect for protected/admin-only pages. Roles are the `UserRole` enum (`admin` / `moderator` / `user`). Primary sign-in is **Discord OAuth** (`signInWithDiscord` in `app/login/actions.ts`); email/password also exists. OAuth redirects to `${NEXT_PUBLIC_APP_URL}/auth/callback`.

### The wiki is one table with a type discriminator

All knowledge-base content is rows in the Supabase **`wiki_pages`** table, discriminated by `type` (`WikiPageType`: `region` / `wiki` / `feature` / `rule` / `history` / `faq` — see `app/types/wiki-pages.ts`). The routes `/regions`, `/rules`, `/faq`, `/features`, `/history`, and `/wiki/[id]` all read from this single table filtered by `type`. `/wiki/[id]` looks pages up by **`url_name`** (a slug), not the numeric id. CRUD lives in `app/utils/services/markdown-service.ts`; Server Actions wrapping it are in `app/actions/wiki.ts`.

Page content is Markdown, rendered with `react-markdown` + `rehype-raw` (**raw HTML is allowed** in content). Markdown styling relies on the `.markdown`/`.editor` classes in `app/globals.css`, which use `all: revert` to opt back out of Tailwind's reset.

### External data sources

- `https://api.noboobs.world` — Minecraft server API, accessed via `serverApiFetch()` in `app/lib/data/server-api.ts`. `app/lib/data/stats.ts` fetches the scoreboard (`/stats/all`, revalidate 60) + online list (`/online`, revalidate 30) and composes `buildStatsData()` from `app/lib/data/stats-transforms.ts`, which **translates stat keys to Ukrainian** (`SCORES_TRANSLATE` map), filters to players with >8 hours played, converts distances cm→m, and derives a "Least Deaths" stat. `app/api/online/route.ts` proxies the online-players endpoint.
- Telegram news sync: `app/utils/services/news-service.ts` pulls the latest Telegram message from the API and inserts it as a `history`-type `wiki_pages` row (deduped by content). Triggered via `GET /api/telegram-news-sync` (optionally guarded by `CRON_SECRET`). This path uses a **service-role** Supabase client, so it needs `SUPABASE_SERVICE_ROLE_KEY`.

### Styling

Tailwind **v4** with **CSS-based config** — there is no `tailwind.config.js`. Tailwind and the **daisyUI v5** plugin are wired up directly in `app/globals.css` (`@import "tailwindcss"; @plugin "daisyui";`). The theme is fixed to daisyUI `dark` (`data-theme="dark"` on `<html>` in `app/layout.tsx`). Use daisyUI component classes (`card`, `bg-base-100`, `bg-base-200`, etc.). `clsx` + `tailwind-merge` are combined in `app/utils/cn.ts` (`cn()`). `framer-motion` drives page transitions (`PageTransitionWrapper`, `AnimatePresence` in the layout). Seasonal decorative backgrounds live in `app/components/{christmas-ui,spring-ui,nether-ui}` and are swapped in/out as themes.

## Environment

Config comes from `.env` (currently committed to the repo). Key vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (telegram sync only), `NEXT_PUBLIC_APP_URL` (OAuth redirect base), `NEXT_PUBLIC_STATS_URL`, and optional `CRON_SECRET`.

## Deployment

`next.config.ts` sets `output: "standalone"`. `docker-compose.yml` builds from **`Dockerfile.optimized`** (the plain `Dockerfile` is a simpler alternative) and maps host `8085` → container `3000`. `.github/workflows/deploy.yml` deploys on push to `main` by SSHing into the server and running `git pull && docker compose down && docker compose up --build -d`.

## Note

`README.md` is out of date on versions (it lists Next 15 / Tailwind 3 / daisyUI 4 / Biome 1.9). The actual stack is **Next.js 16 / React 19 / Tailwind v4 / daisyUI v5 / Biome 2** per `package.json` — trust `package.json`.
