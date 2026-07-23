# Overhaul Phase 3 — Caching & External APIs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace blanket `cache: "no-store"` with a real caching strategy (tagged wiki caching invalidated on edit; short-TTL stats/online), and split the 400-line `stats-service.ts` into a thin fetch layer plus pure, unit-tested transforms — without changing rendered output.

**Architecture:** External stats API calls move to a shared `serverApiFetch()` and use `fetch(..., { next: { revalidate } })`. The stats scoreboard transformation becomes pure functions in `lib/data/stats-transforms.ts` (composed by `buildStatsData`), with the thin fetch in `lib/data/stats.ts`. Public wiki reads are wrapped in `unstable_cache` (tagged `wiki`) backed by a **cookieless** Supabase client (safe because wiki content is identical for all users); wiki mutations call `revalidateTag("wiki")`. Per-request/auth reads (edit page) stay uncached.

**Tech Stack:** Next.js 16 App Router (`unstable_cache` + `revalidateTag` from `next/cache`; `fetch` `next.revalidate`), React 19, TypeScript strict, Supabase, Vitest, Biome, pnpm.

> **Caching-API decision (verified against Next 16 docs):** use the stable `unstable_cache` + `revalidateTag` for DB reads and `fetch` `next.revalidate` for the external API. The newer `'use cache'` + `cacheTag`/`cacheLife` require enabling the app-wide `cacheComponents` flag — a larger semantic shift deliberately NOT adopted here.

## Global Constraints

- Node 24 / **pnpm**; **Biome** (tabs, double quotes) scoped to changed files only. No repo-wide formatting (that's Phase 4).
- TypeScript **strict**; `@/*` → repo root.
- **No rendered-output change**: the stats page and wiki pages must display the same content as before (caching changes *when* data is fetched, not *what* is shown). The stats transform refactor must preserve the existing behavior exactly (including its current quirks — see Task 1).
- Data-access layer under `app/lib/**` stays pure of navigation/client-only imports. Caching wrappers (`unstable_cache`) live in `lib/data`, which is server-only.
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Conventional prefixes: `feat:`, `refactor:`, `test:`, `fix:`, `chore:`.

---

### Task 1: Pure stats transforms (`lib/data/stats-transforms.ts`)

**Files:**
- Create: `app/lib/data/stats-transforms.ts`
- Test: `app/lib/data/__tests__/stats-transforms.test.ts`

**Interfaces:**
- Consumes: `StatsData` from `@/app/types`.
- Produces (all PURE — no fetch, no I/O):
  - `SCORES_TRANSLATE: Record<string,string>` (the English→Ukrainian stat-name map, moved verbatim from stats-service).
  - `filterEligiblePlayers(scores, minHours = 8): Set<string>` — player names with `Hours Played` > minHours.
  - `pruneToEligible(scores, eligible): Record<string,Record<string,string>>` — drops time-only keys (`Minutes Played`, `Days Played`, `Seconds Played`, `Ticks Played`, `Times Left`, `Days Since Last Death`, `Seconds Since Last Death`, `Minutes Since Last Death`) and filters remaining stats to eligible players.
  - `convertDistances(source, target): void` — for each stat key containing `"Distance"`, writes `floor(value/100)` (cm→m) into `target[key][player]` for every player in `source[key]` (preserves the existing behavior where distance stats are taken from the full source, not just eligible players).
  - `deriveLeastDeaths(scores): void` — if `scores.Deaths` exists, adds `scores["Least Deaths"]` = same players sorted ascending by deaths.
  - `translateScoreKeys(scores): Record<string, Record<string,string>>` — `{ [SCORES_TRANSLATE[k]]: scores[k] }` for each English key in the map (matching current output shape, including `undefined` values for absent keys).
  - `computeOnline(playerUuids, onlineUuids): Record<string, boolean>` — player name → whether their UUID is in the online set.
  - `buildStatsData(scores, onlineUuids): StatsData` — composes the above in the SAME order as the current `getPlayerStats` body and returns `{ online, scoreboard: { scores }, playernames }`.

- [ ] **Step 1: Write the failing tests**

Create `app/lib/data/__tests__/stats-transforms.test.ts` with focused cases:

```ts
import { describe, expect, it } from "vitest";
import {
	buildStatsData,
	computeOnline,
	convertDistances,
	deriveLeastDeaths,
	filterEligiblePlayers,
} from "@/app/lib/data/stats-transforms";

describe("filterEligiblePlayers", () => {
	it("keeps only players with more than 8 hours played", () => {
		const scores = { "Hours Played": { a: "9", b: "8", c: "12", d: "x" } };
		const eligible = filterEligiblePlayers(scores);
		expect([...eligible].sort()).toEqual(["a", "c"]);
	});
});

describe("convertDistances", () => {
	it("converts centimetres to metres (floored) for Distance keys", () => {
		const source = { "Distance Walked": { a: "250", b: "99" } };
		const target: Record<string, Record<string, string>> = {
			"Distance Walked": {},
		};
		convertDistances(source, target);
		expect(target["Distance Walked"]).toEqual({ a: "2", b: "0" });
	});
});

describe("deriveLeastDeaths", () => {
	it("adds Least Deaths sorted ascending", () => {
		const scores: Record<string, Record<string, string>> = {
			Deaths: { a: "5", b: "2", c: "9" },
		};
		deriveLeastDeaths(scores);
		expect(Object.keys(scores["Least Deaths"])).toEqual(["b", "a", "c"]);
	});
});

describe("computeOnline", () => {
	it("maps player names to online booleans by uuid", () => {
		const playerUuids = { a: "uuid-1", b: "uuid-2" };
		expect(computeOnline(playerUuids, ["uuid-2"])).toEqual({
			a: false,
			b: true,
		});
	});
});

describe("buildStatsData", () => {
	it("produces online map, translated scoreboard, and playernames", () => {
		const scores = {
			"Hours Played": { Alice: "10" },
			"Player UUID": { Alice: "uuid-1" },
			"Player Name": { Alice: "Alice" },
			Deaths: { Alice: "3" },
		};
		const result = buildStatsData(scores, ["uuid-1"]);
		expect(result.online).toEqual({ Alice: true });
		expect(result.playernames).toEqual(["Alice"]);
		// "Deaths" translates to its Ukrainian label and Alice survives the >8h filter
		expect(result.scoreboard.scores["Найбільше смертей"]).toEqual({
			Alice: "3",
		});
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run app/lib/data/__tests__/stats-transforms.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/data/stats-transforms.ts`**

Move the `scoresTranslate` map verbatim from `app/utils/services/stats-service.ts` (rename export `SCORES_TRANSLATE`). Implement the functions above by extracting the exact logic from the current `getPlayerStats` body (the eligibility filter, extra-key removal, distance conversion, least-deaths derivation, translation, and online mapping), composing them in `buildStatsData` in the identical order. Keep behavior identical — including that `convertDistances` reads from the full `source` scores.

```ts
import type { StatsData } from "@/app/types";

type Scores = Record<string, Record<string, string>>;

export const SCORES_TRANSLATE: Record<string, string> = {
	/* … copy the full map verbatim from stats-service.ts … */
};

const EXTRA_TIME_KEYS = [
	"Minutes Played",
	"Days Played",
	"Seconds Played",
	"Ticks Played",
	"Times Left",
	"Days Since Last Death",
	"Seconds Since Last Death",
	"Minutes Since Last Death",
];

export function filterEligiblePlayers(scores: Scores, minHours = 8): Set<string> {
	const eligible = new Set<string>();
	const hours = scores["Hours Played"];
	if (hours) {
		for (const [player, raw] of Object.entries(hours)) {
			const h = Number.parseFloat(raw);
			if (!Number.isNaN(h) && h > minHours) eligible.add(player);
		}
	}
	return eligible;
}

export function pruneToEligible(scores: Scores, eligible: Set<string>): Scores {
	const filtered: Scores = {};
	for (const [stat, players] of Object.entries(scores)) {
		filtered[stat] = { ...(players ?? {}) };
	}
	for (const key of EXTRA_TIME_KEYS) delete filtered[key];
	for (const [stat, players] of Object.entries(filtered)) {
		const kept: Record<string, string> = {};
		for (const [player, value] of Object.entries(players)) {
			if (eligible.has(player)) kept[player] = value;
		}
		filtered[stat] = kept;
	}
	return filtered;
}

export function convertDistances(source: Scores, target: Scores): void {
	for (const [key, players] of Object.entries(source)) {
		if (!key.includes("Distance")) continue;
		for (const [player, value] of Object.entries(players)) {
			const d = Number.parseInt(value);
			if (!Number.isNaN(d)) {
				if (!target[key]) target[key] = {};
				target[key][player] = String(Math.floor(d / 100));
			}
		}
	}
}

export function deriveLeastDeaths(scores: Scores): void {
	const deaths = scores.Deaths;
	if (!deaths) return;
	const rows = Object.entries(deaths)
		.map(([player, raw]) => ({ player, deaths: Number.parseInt(raw) }))
		.filter((r) => !Number.isNaN(r.deaths))
		.sort((a, b) => a.deaths - b.deaths);
	if (rows.length === 0) return;
	const out: Record<string, string> = {};
	for (const { player, deaths: d } of rows) out[player] = String(d);
	scores["Least Deaths"] = out;
}

export function translateScoreKeys(scores: Scores): Scores {
	return Object.fromEntries(
		Object.entries(SCORES_TRANSLATE).map(([en, uk]) => [uk, scores[en]]),
	);
}

export function computeOnline(
	playerUuids: Record<string, string>,
	onlineUuids: string[],
): Record<string, boolean> {
	const online = new Set(Array.isArray(onlineUuids) ? onlineUuids : []);
	return Object.fromEntries(
		Object.entries(playerUuids).map(([name, uuid]) => [name, online.has(uuid)]),
	);
}

export function buildStatsData(scores: Scores, onlineUuids: string[]): StatsData {
	const eligible = filterEligiblePlayers(scores);
	const filtered = pruneToEligible(scores, eligible);
	convertDistances(scores, filtered);
	deriveLeastDeaths(filtered);
	const translated = translateScoreKeys(filtered);
	const online = computeOnline(scores["Player UUID"] ?? {}, onlineUuids);
	const playernames = Object.keys(scores["Player Name"] ?? {});
	return { online, scoreboard: { scores: translated }, playernames };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run app/lib/data/__tests__/stats-transforms.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
pnpm exec biome check --write app/lib/data/stats-transforms.ts app/lib/data/__tests__/stats-transforms.test.ts
git add app/lib/data/stats-transforms.ts app/lib/data/__tests__/stats-transforms.test.ts
git commit -m "feat: extract pure stats transforms with unit tests"
```

---

### Task 2: Thin stats fetch layer (`lib/data/stats.ts`) + `serverApiFetch`; retire `stats-service.ts`

**Files:**
- Create: `app/lib/data/server-api.ts` (the `serverApiFetch` helper)
- Create: `app/lib/data/stats.ts`
- Modify: `app/stats/page.tsx`, `app/stats/stats-client.tsx`, `app/profile/page.tsx`, `app/utils/services/index.ts`
- Delete: `app/utils/services/stats-service.ts`

**Interfaces:**
- `serverApiFetch(path: string, opts?: { revalidate?: number }): Promise<Response>` — prefixes `https://api.noboobs.world`, sets the `User-Agent` header + a 10s `AbortSignal.timeout`, and passes `next: { revalidate }` (defaulting to no-store only when `revalidate` is omitted).
- `stats.ts` re-exports the SAME public API the consumers use: `getPlayerStats(): Promise<StatsData>` (fetches `/stats/all` revalidate 60 + `/online` revalidate 30, composes `buildStatsData`, returns empty `StatsData` on error), `getPlayerIndividualStats(discordId): Promise<Record<string,string>>` (keep `findUuid`/`toStatsMap`/`isRecord` as local helpers), and the `fetchStatsData()` server action (calls `getPlayerStats` + `revalidatePath("/stats")`).
- Remove the dead `getDiscordIds` and (confirm unused via grep, then remove) `getPlayersUUIDS`.

- [ ] **Step 1: Implement `server-api.ts`**

```ts
const API_BASE_URL = "https://api.noboobs.world";

export function serverApiFetch(
	path: string,
	opts: { revalidate?: number } = {},
): Promise<Response> {
	return fetch(`${API_BASE_URL}${path}`, {
		headers: { "User-Agent": "Mozilla/5.0 (compatible; Next.js Server)" },
		signal: AbortSignal.timeout(10000),
		...(opts.revalidate === undefined
			? { cache: "no-store" }
			: { next: { revalidate: opts.revalidate } }),
	});
}
```

- [ ] **Step 2: Implement `lib/data/stats.ts`**

Port `getPlayerStats`, `getPlayerIndividualStats`, and `fetchStatsData` from `stats-service.ts`, but: use `serverApiFetch("/stats/all", { revalidate: 60 })` and `serverApiFetch("/online", { revalidate: 30 })` instead of the inline `cache: "no-store"` fetches; delegate all scoreboard shaping to `buildStatsData` from `@/app/lib/data/stats-transforms`. Keep the graceful empty-`StatsData` fallback on error. Keep `findUuid`/`toStatsMap`/`isRecord` as module-local helpers for `getPlayerIndividualStats`. Do NOT port `getDiscordIds`/`getPlayersUUIDS`. `fetchStatsData` keeps `"use server"` + `revalidatePath("/stats")`.

- [ ] **Step 3: Rewire consumers**

- `app/stats/page.tsx`: import `{ getPlayerStats }` from `@/app/lib/data/stats`.
- `app/stats/stats-client.tsx`: import `{ fetchStatsData }` from `@/app/lib/data/stats`.
- `app/profile/page.tsx`: import `{ getPlayerIndividualStats }` from `@/app/lib/data/stats` (was `../utils/services`).
- `app/utils/services/index.ts`: remove the `export * from "./stats-service";` line (leaving `./news-service`).

- [ ] **Step 4: Delete the old service; verify no dangling refs**

```bash
git rm app/utils/services/stats-service.ts
```
Grep for `stats-service`, `getPlayersUUIDS`, `getDiscordIds` — expect no live references. Report the search.

- [ ] **Step 5: Verify + commit**

Run: `pnpm typecheck` (clean), `pnpm test` (green), `pnpm build` (succeeds).
Run: `pnpm exec biome check --write` on the created/modified files.
```bash
git add -A
git commit -m "refactor: thin stats fetch layer with cached API calls; retire stats-service"
```

---

### Task 3: Cached public wiki reads + revalidate-on-edit

**Files:**
- Create: `app/lib/supabase/public.ts` (cookieless anon client)
- Create: `app/lib/data/wiki-cache.ts` (cached read wrappers)
- Modify: `app/actions/wiki.ts` (revalidateTag after mutations)
- Modify (read call sites): `app/wiki/[id]/page.tsx`, `app/history/page.tsx`, `app/regions/page.tsx`, `app/features/page.tsx`, `app/components/news-pane/news-pane.tsx`
- Test: `app/lib/supabase/__tests__/public.test.ts` (smoke: factory returns a client)

**Interfaces:**
- `createPublicClient(): SupabaseClient<Database>` — `@supabase/supabase-js` `createClient` with the anon key, NO cookies (safe for public, user-independent reads; usable inside `unstable_cache`).
- `wiki-cache.ts`: `getCachedWikiPages(type): Promise<WikiPage[]>` and `getCachedWikiPageByUrlName(urlName): Promise<WikiPage>` — wrap the pure DAL (`getWikiPages`/`getWikiPageByUrlName` from `lib/data/wiki`) called with `createPublicClient()`, inside `unstable_cache` tagged `["wiki"]` (and per-slug where relevant). They throw the same `NotFoundError`/`AppError` as the DAL.
- `WIKI_TAG = "wiki"` constant shared between the cache wrappers and the mutation revalidation.

> **Why cookieless:** `unstable_cache` runs outside request scope and cannot read cookies. Wiki content is identical for every viewer, so a cookieless anon client is correct here. Auth-dependent reads (the edit page) keep using the per-request `createClient()` and stay uncached so editors always see the latest.

- [ ] **Step 1: Implement `createPublicClient`**

```ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/app/lib/env";
import type { Database } from "@/app/lib/types/database.types";

export function createPublicClient() {
	return createSupabaseClient<Database>(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		{ auth: { persistSession: false } },
	);
}
```

- [ ] **Step 2: Smoke test the factory**

Create `app/lib/supabase/__tests__/public.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/lib/env", () => ({
	env: {
		NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
		NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
	},
}));

describe("createPublicClient", () => {
	it("returns a client exposing from()", async () => {
		const { createPublicClient } = await import("@/app/lib/supabase/public");
		const client = createPublicClient();
		expect(typeof client.from).toBe("function");
	});
});
```

Run RED → implement → GREEN: `pnpm exec vitest run app/lib/supabase/__tests__/public.test.ts`.

- [ ] **Step 3: Implement `wiki-cache.ts`**

```ts
import { unstable_cache } from "next/cache";
import { getWikiPageByUrlName, getWikiPages } from "@/app/lib/data/wiki";
import { createPublicClient } from "@/app/lib/supabase/public";
import type { WikiPageType } from "@/app/types";

export const WIKI_TAG = "wiki";

export function getCachedWikiPages(type: WikiPageType) {
	return unstable_cache(
		async () => getWikiPages(createPublicClient(), type),
		["wiki-pages", type],
		{ tags: [WIKI_TAG] },
	)();
}

export function getCachedWikiPageByUrlName(urlName: string) {
	return unstable_cache(
		async () => getWikiPageByUrlName(createPublicClient(), urlName),
		["wiki-page", urlName],
		{ tags: [WIKI_TAG, `${WIKI_TAG}:${urlName}`] },
	)();
}
```

> `NotFoundError` thrown inside `unstable_cache` propagates out on miss; the page's existing `try/catch → notFound()` still works. (Errors are not cached.)

- [ ] **Step 4: Point public read pages at the cached wrappers**

In `app/history/page.tsx`, `app/regions/page.tsx`, `app/features/page.tsx`, `app/components/news-pane/news-pane.tsx`: replace `const data = await getWikiPages(supabase, TYPE)` with `const data = await getCachedWikiPages(TYPE)` (import from `@/app/lib/data/wiki-cache`); drop the now-unused `createClient()`/`supabase` there if nothing else uses it.
In `app/wiki/[id]/page.tsx`: replace the `getWikiPageByUrlName(supabase, pageId)` read with `getCachedWikiPageByUrlName(pageId)`, keeping the `try/catch → notFound()`. (The edit page keeps the uncached per-request read.)

- [ ] **Step 5: Invalidate on mutation**

In `app/actions/wiki.ts`, after each successful create/update/delete (import `revalidateTag` from `next/cache` and `WIKI_TAG` from `@/app/lib/data/wiki-cache`), call `revalidateTag(WIKI_TAG)` before the `redirect(...)`/return so edits appear immediately.

- [ ] **Step 6: Verify + commit**

Run: `pnpm typecheck`, `pnpm test`, `pnpm build`. Reason in the report: public list/detail reads now hit `unstable_cache` (tag `wiki`); a create/update/delete calls `revalidateTag("wiki")` so the next read is fresh; the edit page still reads uncached.
Run: `pnpm exec biome check --write` on the changed files.
```bash
git add -A
git commit -m "feat: cache public wiki reads, revalidate on mutation"
```

---

### Task 4: Loading states for async pages

**Files:**
- Create: `app/stats/loading.tsx`, `app/regions/loading.tsx`, `app/history/loading.tsx`, `app/features/loading.tsx`, `app/faq/loading.tsx`

**Interfaces:** each default-exports a simple daisyUI spinner (same pattern as `app/profile/loading.tsx` from Phase 2).

- [ ] **Step 1: Create the loading files**

Each file (identical spinner):

```tsx
export default function Loading() {
	return (
		<div className="min-h-[60vh] flex items-center justify-center">
			<span className="loading loading-spinner loading-lg" />
		</div>
	);
}
```

- [ ] **Step 2: Verify + commit**

Run: `pnpm build` (succeeds; loading UIs registered).
Run: `pnpm exec biome check --write app/stats/loading.tsx app/regions/loading.tsx app/history/loading.tsx app/features/loading.tsx app/faq/loading.tsx`
```bash
git add -A
git commit -m "feat: add loading states for async content pages"
```

---

## Self-Review

**Spec coverage (Phase 3 slice):**
- Wiki tagged caching + revalidate-on-edit → Task 3. ✅
- Stats/online short-TTL caching (not no-store) → Task 2 (revalidate 60/30). ✅
- Split stats-service into thin fetch + pure transforms → Tasks 1, 2. ✅
- Centralized `serverApiFetch` → Task 2. ✅
- Remove dead `getDiscordIds` (+ unused `getPlayersUUIDS`) → Task 2. ✅
- `loading.tsx` for async pages → Task 4 (profile's was Phase 2). ✅
- Deferred: `/api/online` route already proxies with its own fetch — left as-is (it's a client-facing endpoint; could adopt `serverApiFetch` in cleanup, noted).

**Placeholder scan:** Task 1 Step 3 references "copy the full map verbatim from stats-service.ts" for `SCORES_TRANSLATE` — that is a concrete instruction to move an existing literal, not a TBD. All logic functions have complete code.

**Behavior-preservation risks:** `convertDistances` intentionally reads from the full `source` (not just eligible players) to match current behavior — called out so the reviewer doesn't "fix" it into a divergence. `translateScoreKeys` intentionally yields `undefined` for stat keys absent from the data, matching the current output.

**Type consistency:** `buildStatsData(scores, onlineUuids): StatsData` (Task 1) is consumed by `getPlayerStats` (Task 2). `getCachedWikiPages`/`getCachedWikiPageByUrlName` (Task 3) return the same `WikiPage[]`/`WikiPage` as the DAL and throw the same errors, so the existing `try/catch → notFound()` at call sites is unaffected. `WIKI_TAG` is shared between `wiki-cache.ts` and `actions/wiki.ts`.
