# No Books Next JS project

Community website for the **noboobs.world** Minecraft server: wiki/knowledge base, live server stats, and Discord-based player accounts. See `CLAUDE.md` for the full architecture notes.

## Notes

- Tailwind v4 uses daisyUI v5 as a plugin (CSS-based config, no `tailwind.config.js`)
- framer-motion is used for page-transition animations
- react-markdown (+ rehype-raw + rehype-sanitize) renders Markdown content; raw HTML is allowed but sanitized on render
- Sign-in is Discord OAuth only; the site is public by default, only `/profile` (and admin/editor mutations) require login
- Biome is the only linter/formatter (ESLint has been removed); Vitest + React Testing Library cover tests

## Usage:

Install the dependencies:

```bash
pnpm install
```

To start the development server and run the project, use the following command:

```bash
pnpm run dev
```

This will start the development server and open your project in the browser. Any changes you make to the source code will be automatically reflected in the browser.

## Environment

Copy `.env.example` to `.env` and fill in the values (Supabase project URL/anon key, `NEXT_PUBLIC_APP_URL`, etc). `app/lib/env.ts` validates these with Zod at startup and will fail fast if anything required is missing. `.env` is git-ignored — only `.env.example` (placeholder values) is committed.

> Note: Supabase credentials previously committed to this repo's history were exposed; they must be rotated (regenerate the anon key and any secrets in the Supabase dashboard) rather than reused.

## Scripts

- `pnpm run dev` — dev server (Turbopack)
- `pnpm run build` / `pnpm start` — production build / run
- `pnpm run lint` — Biome lint (`--write`)
- `pnpm run format` — Biome format (`--write`)
- `pnpm run check` — Biome lint + format (`--write`)
- `pnpm run typecheck` — `tsc --noEmit`
- `pnpm test` / `pnpm run test:watch` — Vitest

## Building for Production

To build the project for production, use the following command:

```bash
pnpm run build
```

To build and run the project using Docker, use the following command:

```bash
sudo docker compose up --build -d
```

This builds the single standalone `Dockerfile` and maps host port `8085` to the container's `3000` (see `docker-compose.yml`).

## Tech stack

Key versions (see `package.json` for the authoritative, exact list):

- Next.js 16, React 19
- Tailwind CSS v4 (CSS-based config) + daisyUI v5
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Zod (env validation)
- Biome 2 (lint + format)
- Vitest + React Testing Library (tests)
