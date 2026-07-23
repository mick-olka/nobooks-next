# Overhaul Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the testing harness, a typed error/env/DB foundation under `lib/`, and a pure wiki data-access layer with error boundaries — without moving route folders or changing any URL or user-visible behavior.

**Architecture:** Purely additive. New foundation modules live in `app/lib/` (`errors.ts`, `env.ts`, `types/database.types.ts`, `data/wiki.ts`). The existing Supabase clients are typed in place (moved to `lib/` in Phase 2). The wiki data functions become pure (return typed data or throw `NotFoundError`/`AppError`, never navigate, never import client-only code); pages translate those errors via root `not-found.tsx` / `error.tsx`. This is the base every later phase builds on.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript (strict), Supabase (`@supabase/ssr`, `@supabase/supabase-js`), Zod, Vitest + React Testing Library, Biome, pnpm.

## Global Constraints

- Node 20; package manager is **pnpm** — always `pnpm install --frozen-lockfile` in CI-like contexts, `pnpm add` locally.
- Formatting is **Biome**: **tab** indentation, **double** quotes. Run `pnpm exec biome check --write <files>` before each commit.
- TypeScript **strict** mode; path alias `@/*` → repo root (imports written `@/app/...`).
- **Do not change any URL** and **do not move route folders** in this phase.
- Data-access functions must **never** call `redirect()`/`notFound()` and must **never** import client-only modules (e.g. `react-hot-toast`). Navigation happens in pages/actions.
- Every commit message ends with the trailer:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Conventional commit prefixes matching the repo: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`.

---

### Task 1: Test tooling (Vitest + React Testing Library)

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `app/lib/__tests__/smoke.test.ts`
- Modify: `package.json` (scripts + devDependencies)
- Modify: `biome.json` (ignore coverage output)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a working `pnpm test` command and the `@/` alias resolving in tests, relied on by every later task.

- [ ] **Step 1: Install dev dependencies**

```bash
pnpm add -D vitest@^3 @vitejs/plugin-react@^4 jsdom@^25 @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14
```

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		include: ["app/**/*.{test,spec}.{ts,tsx}"],
	},
	resolve: {
		alias: { "@": resolve(__dirname, ".") },
	},
});
```

- [ ] **Step 3: Create the setup file**

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add scripts and ignore coverage**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "tsc --noEmit"
```

In `biome.json`, add `"coverage"` to `files.ignore` (alongside the existing entries).

- [ ] **Step 5: Write a smoke test**

Create `app/lib/__tests__/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("test harness", () => {
	it("runs and resolves the @ alias environment", () => {
		expect(1 + 1).toBe(2);
	});
});
```

- [ ] **Step 6: Run the smoke test and typecheck**

Run: `pnpm test`
Expected: PASS (1 test passed).
Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
pnpm exec biome check --write vitest.config.ts vitest.setup.ts app/lib/__tests__/smoke.test.ts
git add vitest.config.ts vitest.setup.ts app/lib/__tests__/smoke.test.ts package.json pnpm-lock.yaml biome.json
git commit -m "test: add Vitest + React Testing Library harness"
```

---

### Task 2: Typed error classes (`lib/errors.ts`)

**Files:**
- Create: `app/lib/errors.ts`
- Test: `app/lib/__tests__/errors.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `class AppError extends Error` — constructor `(message: string, options?: { cause?: unknown })`; property `name === "AppError"`.
  - `class NotFoundError extends AppError` — constructor `(resource: string)`; `name === "NotFoundError"`; `message === \`Not found: ${resource}\``.
  - `function isNotFoundError(e: unknown): e is NotFoundError`.

- [ ] **Step 1: Write the failing test**

Create `app/lib/__tests__/errors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { AppError, NotFoundError, isNotFoundError } from "@/app/lib/errors";

describe("errors", () => {
	it("AppError carries a message and name", () => {
		const err = new AppError("boom");
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe("AppError");
		expect(err.message).toBe("boom");
	});

	it("AppError preserves the cause", () => {
		const cause = new Error("root");
		const err = new AppError("wrapped", { cause });
		expect(err.cause).toBe(cause);
	});

	it("NotFoundError formats the resource and is an AppError", () => {
		const err = new NotFoundError("wiki page: intro");
		expect(err).toBeInstanceOf(AppError);
		expect(err.name).toBe("NotFoundError");
		expect(err.message).toBe("Not found: wiki page: intro");
	});

	it("isNotFoundError narrows correctly", () => {
		expect(isNotFoundError(new NotFoundError("x"))).toBe(true);
		expect(isNotFoundError(new AppError("x"))).toBe(false);
		expect(isNotFoundError(new Error("x"))).toBe(false);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run app/lib/__tests__/errors.test.ts`
Expected: FAIL — cannot resolve `@/app/lib/errors`.

- [ ] **Step 3: Implement `lib/errors.ts`**

Create `app/lib/errors.ts`:

```ts
export class AppError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message);
		this.name = "AppError";
		if (options?.cause !== undefined) {
			this.cause = options.cause;
		}
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string) {
		super(`Not found: ${resource}`);
		this.name = "NotFoundError";
	}
}

export function isNotFoundError(error: unknown): error is NotFoundError {
	return error instanceof NotFoundError;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run app/lib/__tests__/errors.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
pnpm exec biome check --write app/lib/errors.ts app/lib/__tests__/errors.test.ts
git add app/lib/errors.ts app/lib/__tests__/errors.test.ts
git commit -m "feat: add typed AppError/NotFoundError classes"
```

---

### Task 3: Validated environment (`lib/env.ts`)

**Files:**
- Create: `app/lib/env.ts`
- Test: `app/lib/__tests__/env.test.ts`
- Modify: `package.json` (add `zod`)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `function parseEnv(source: Record<string, string | undefined>): Env` — throws `AppError` listing missing/invalid keys.
  - `type Env` — `{ NEXT_PUBLIC_SUPABASE_URL: string; NEXT_PUBLIC_SUPABASE_ANON_KEY: string; NEXT_PUBLIC_APP_URL: string; NEXT_PUBLIC_STATS_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string; CRON_SECRET?: string }`.
  - `const env: Env` — the validated `process.env`, evaluated once on import.

- [ ] **Step 1: Install Zod**

```bash
pnpm add zod
```

- [ ] **Step 2: Write the failing test**

Create `app/lib/__tests__/env.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { AppError } from "@/app/lib/errors";
import { parseEnv } from "@/app/lib/env";

const valid = {
	NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
	NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
	NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
	it("accepts a valid minimal environment", () => {
		const env = parseEnv(valid);
		expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
		expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
	});

	it("keeps optional values when present", () => {
		const env = parseEnv({ ...valid, CRON_SECRET: "s3cret" });
		expect(env.CRON_SECRET).toBe("s3cret");
	});

	it("throws AppError when a required var is missing", () => {
		const { NEXT_PUBLIC_SUPABASE_URL, ...rest } = valid;
		expect(() => parseEnv(rest)).toThrow(AppError);
		expect(() => parseEnv(rest)).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
	});

	it("throws when a URL var is not a URL", () => {
		expect(() => parseEnv({ ...valid, NEXT_PUBLIC_APP_URL: "not-a-url" })).toThrow(
			AppError,
		);
	});
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run app/lib/__tests__/env.test.ts`
Expected: FAIL — cannot resolve `@/app/lib/env`.

- [ ] **Step 4: Implement `lib/env.ts`**

Create `app/lib/env.ts`:

```ts
import { z } from "zod";
import { AppError } from "./errors";

const schema = z.object({
	NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
	NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
	NEXT_PUBLIC_APP_URL: z.string().url(),
	NEXT_PUBLIC_STATS_URL: z.string().url().optional(),
	SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
	CRON_SECRET: z.string().min(1).optional(),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
	const result = schema.safeParse(source);
	if (!result.success) {
		const issues = result.error.issues
			.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
			.join("; ");
		throw new AppError(`Invalid environment: ${issues}`);
	}
	return result.data;
}

export const env: Env = parseEnv(process.env);
```

- [ ] **Step 5: Run test + typecheck**

Run: `pnpm exec vitest run app/lib/__tests__/env.test.ts`
Expected: PASS (4 tests).
Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
pnpm exec biome check --write app/lib/env.ts app/lib/__tests__/env.test.ts
git add app/lib/env.ts app/lib/__tests__/env.test.ts package.json pnpm-lock.yaml
git commit -m "feat: add Zod-validated environment loader"
```

---

### Task 4: Supabase database types (`lib/types/database.types.ts`)

**Files:**
- Create: `app/lib/types/database.types.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type Database` with `public.Tables.wiki_pages` (`Row`/`Insert`/`Update`) and `public.Functions.get_user_role` (`Returns: string`). Used to parametrize the Supabase clients (Task 5) and the DAL (Task 6).

> **Verification point (from spec):** this file is hand-authored from the known `wiki_pages` shape. If the Supabase CLI is available at execution time, prefer regenerating it with `pnpm dlx supabase gen types typescript --project-id <id> --schema public` and reconciling. The `type` column is modeled as `string` here; Phase 2 tightens it against the `WikiPageType` enum.

- [ ] **Step 1: Create the database types**

Create `app/lib/types/database.types.ts`:

```ts
export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	public: {
		Tables: {
			wiki_pages: {
				Row: {
					id: string;
					title: string;
					content: string;
					url_name: string;
					created_at: string;
					updated_at: string;
					created_by: string;
					last_modified_by: string;
					type: string;
				};
				Insert: {
					id?: string;
					title: string;
					content: string;
					url_name: string;
					type: string;
					created_by?: string;
					last_modified_by?: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					title?: string;
					content?: string;
					url_name?: string;
					type?: string;
					last_modified_by?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
		};
		Views: Record<string, never>;
		Functions: {
			get_user_role: {
				Args: Record<string, never>;
				Returns: string;
			};
		};
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
};
```

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
pnpm exec biome check --write app/lib/types/database.types.ts
git add app/lib/types/database.types.ts
git commit -m "feat: add hand-authored Supabase Database types"
```

---

### Task 5: Type the existing Supabase clients

**Files:**
- Modify: `app/utils/supabase/server.ts`
- Modify: `app/utils/supabase/client.ts`
- Modify: `app/utils/supabase/middleware.ts`

**Interfaces:**
- Consumes: `Database` (Task 4).
- Produces: `createClient()` in server/client now returns `SupabaseClient<Database>`, so `.from("wiki_pages")` is fully typed. Signatures and behavior are unchanged (this is types-only). Relied on by Task 6 and all existing consumers.

> No file moves in this phase — only add the `<Database>` generic. Files move to `app/lib/supabase/` in Phase 2.

- [ ] **Step 1: Type the server client**

In `app/utils/supabase/server.ts`, change the import and the `createServerClient` call to be generic:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/app/lib/types/database.types";

export async function createClient() {
	const cookieStore = await cookies();

	return createServerClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL || "",
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					try {
						for (const { name, value, options } of cookiesToSet) {
							cookieStore.set(name, value, options);
						}
					} catch {
						// Called from a Server Component; safe to ignore when
						// middleware refreshes sessions.
					}
				},
			},
		},
	);
}
```

- [ ] **Step 2: Type the browser client**

In `app/utils/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/app/lib/types/database.types";

export const createClient = () =>
	createBrowserClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL || "",
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
	);
```

- [ ] **Step 3: Type the middleware client**

In `app/utils/supabase/middleware.ts`, add the import and make the call generic (leave the rest of the function unchanged, but convert the two `forEach` calls to `for...of` to satisfy Biome):

```ts
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/app/lib/types/database.types";
```

Change `createServerClient(` to `createServerClient<Database>(`, and replace each `cookiesToSet.forEach((...) => ...)` with:

```ts
for (const { name, value } of cookiesToSet) {
	request.cookies.set(name, value);
}
```

and

```ts
for (const { name, value, options } of cookiesToSet) {
	supabaseResponse.cookies.set(name, value, options);
}
```

- [ ] **Step 4: Verify typecheck and build**

Run: `pnpm typecheck`
Expected: no errors.
Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
pnpm exec biome check --write app/utils/supabase/server.ts app/utils/supabase/client.ts app/utils/supabase/middleware.ts
git add app/utils/supabase/server.ts app/utils/supabase/client.ts app/utils/supabase/middleware.ts
git commit -m "refactor: type Supabase clients with generated Database types"
```

---

### Task 6: Pure wiki data-access layer (`lib/data/wiki.ts`)

**Files:**
- Create: `app/lib/data/wiki.ts`
- Test: `app/lib/data/__tests__/wiki.test.ts`

**Interfaces:**
- Consumes: `AppError`, `NotFoundError` (Task 2); `Database` (Task 4); the server client type from `@/app/utils/supabase/server`.
- Produces (all take the Supabase client as first arg, return typed data, and throw on failure — **no redirect, no toast**):
  - `type WikiClient = SupabaseClient<Database>`
  - `getWikiPages(sb, type: WikiPageType): Promise<WikiPage[]>`
  - `getWikiPageByUrlName(sb, urlName: string): Promise<WikiPage>` — throws `NotFoundError` if absent.
  - `getWikiPageById(sb, id: string): Promise<WikiPage>` — throws `NotFoundError` if absent.
  - `createWikiPage(sb, body: WikiPageDTO): Promise<WikiPage>`
  - `updateWikiPage(sb, id: string, body: WikiPageDTO): Promise<WikiPage>`
  - `deleteWikiPage(sb, id: string): Promise<void>`
  - `deleteWikiPageByUrlName(sb, urlName: string): Promise<void>`

- [ ] **Step 1: Write the failing test**

Create `app/lib/data/__tests__/wiki.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { AppError, NotFoundError } from "@/app/lib/errors";
import { WikiPageType } from "@/app/types";
import {
	getWikiPageByUrlName,
	getWikiPages,
} from "@/app/lib/data/wiki";

type Result = { data: unknown; error: unknown };

// Minimal fluent Supabase query-builder mock. Every chainable method
// returns the same builder; terminals (`single`, `then`) resolve `result`.
function mockClient(result: Result) {
	const builder: Record<string, unknown> = {};
	for (const method of ["select", "eq", "order", "insert", "update", "delete"]) {
		builder[method] = vi.fn(() => builder);
	}
	builder.single = vi.fn(() => Promise.resolve(result));
	builder.maybeSingle = vi.fn(() => Promise.resolve(result));
	builder.then = (resolve: (r: Result) => unknown) => resolve(result);
	const from = vi.fn(() => builder);
	// biome-ignore lint/suspicious/noExplicitAny: test double for SupabaseClient
	return { client: { from } as any, from, builder };
}

const page = {
	id: "1",
	title: "Intro",
	content: "hi",
	url_name: "intro",
	created_at: "",
	updated_at: "",
	created_by: "",
	last_modified_by: "",
	type: "wiki",
};

describe("getWikiPages", () => {
	it("returns rows filtered by type", async () => {
		const { client, from } = mockClient({ data: [page], error: null });
		const rows = await getWikiPages(client, WikiPageType.WIKI);
		expect(from).toHaveBeenCalledWith("wiki_pages");
		expect(rows).toEqual([page]);
	});

	it("throws AppError on a query error", async () => {
		const { client } = mockClient({ data: null, error: { message: "db down" } });
		await expect(getWikiPages(client, WikiPageType.WIKI)).rejects.toBeInstanceOf(
			AppError,
		);
	});
});

describe("getWikiPageByUrlName", () => {
	it("returns a single page", async () => {
		const { client } = mockClient({ data: page, error: null });
		await expect(getWikiPageByUrlName(client, "intro")).resolves.toEqual(page);
	});

	it("throws NotFoundError when the row is missing", async () => {
		const { client } = mockClient({ data: null, error: null });
		await expect(getWikiPageByUrlName(client, "nope")).rejects.toBeInstanceOf(
			NotFoundError,
		);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run app/lib/data/__tests__/wiki.test.ts`
Expected: FAIL — cannot resolve `@/app/lib/data/wiki`.

- [ ] **Step 3: Implement `lib/data/wiki.ts`**

Create `app/lib/data/wiki.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError, NotFoundError } from "@/app/lib/errors";
import type { Database } from "@/app/lib/types/database.types";
import type { WikiPage, WikiPageDTO, WikiPageType } from "@/app/types";

export type WikiClient = SupabaseClient<Database>;

export async function getWikiPages(
	sb: WikiClient,
	type: WikiPageType,
): Promise<WikiPage[]> {
	const { data, error } = await sb
		.from("wiki_pages")
		.select("*")
		.eq("type", type)
		.order("updated_at", { ascending: false });
	if (error) throw new AppError("Failed to load wiki pages", { cause: error });
	return (data ?? []) as WikiPage[];
}

export async function getWikiPageByUrlName(
	sb: WikiClient,
	urlName: string,
): Promise<WikiPage> {
	const { data, error } = await sb
		.from("wiki_pages")
		.select("*")
		.eq("url_name", urlName)
		.maybeSingle();
	if (error) throw new AppError("Failed to load wiki page", { cause: error });
	if (!data) throw new NotFoundError(`wiki page: ${urlName}`);
	return data as WikiPage;
}

export async function getWikiPageById(
	sb: WikiClient,
	id: string,
): Promise<WikiPage> {
	const { data, error } = await sb
		.from("wiki_pages")
		.select("*")
		.eq("id", id)
		.maybeSingle();
	if (error) throw new AppError("Failed to load wiki page", { cause: error });
	if (!data) throw new NotFoundError(`wiki page id: ${id}`);
	return data as WikiPage;
}

export async function createWikiPage(
	sb: WikiClient,
	body: WikiPageDTO,
): Promise<WikiPage> {
	const { data, error } = await sb
		.from("wiki_pages")
		.insert(body)
		.select()
		.single();
	if (error) throw new AppError("Failed to create wiki page", { cause: error });
	return data as WikiPage;
}

export async function updateWikiPage(
	sb: WikiClient,
	id: string,
	body: WikiPageDTO,
): Promise<WikiPage> {
	const { data, error } = await sb
		.from("wiki_pages")
		.update(body)
		.eq("id", id)
		.select()
		.single();
	if (error) throw new AppError("Failed to update wiki page", { cause: error });
	return data as WikiPage;
}

export async function deleteWikiPage(sb: WikiClient, id: string): Promise<void> {
	const { error } = await sb.from("wiki_pages").delete().eq("id", id);
	if (error) throw new AppError("Failed to delete wiki page", { cause: error });
}

export async function deleteWikiPageByUrlName(
	sb: WikiClient,
	urlName: string,
): Promise<void> {
	const { error } = await sb.from("wiki_pages").delete().eq("url_name", urlName);
	if (error) throw new AppError("Failed to delete wiki page", { cause: error });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run app/lib/data/__tests__/wiki.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
pnpm exec biome check --write app/lib/data/wiki.ts app/lib/data/__tests__/wiki.test.ts
git add app/lib/data/wiki.ts app/lib/data/__tests__/wiki.test.ts
git commit -m "feat: add pure wiki data-access layer"
```

---

### Task 7: Root error & not-found boundaries

**Files:**
- Create: `app/not-found.tsx`
- Create: `app/error.tsx`

**Interfaces:**
- Consumes: nothing (Next.js special files).
- Produces: a rendered 404 page for `notFound()` calls and an error fallback for thrown errors. Task 8 relies on these existing so `NotFoundError` → `notFound()` renders correctly.

- [ ] **Step 1: Create the not-found page**

Create `app/not-found.tsx`:

```tsx
import Link from "next/link";

export default function NotFound() {
	return (
		<div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
			<h1 className="text-4xl font-bold">404</h1>
			<p className="text-gray-500">Сторінку не знайдено.</p>
			<Link href="/" className="btn btn-primary">
				На головну
			</Link>
		</div>
	);
}
```

- [ ] **Step 2: Create the error boundary**

Create `app/error.tsx`:

```tsx
"use client";

import { useEffect } from "react";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
			<h1 className="text-3xl font-bold">Щось пішло не так</h1>
			<p className="text-gray-500">Спробуйте ще раз.</p>
			<button type="button" className="btn btn-primary" onClick={reset}>
				Повторити
			</button>
		</div>
	);
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: build succeeds; `/_not-found` appears in the route list.

- [ ] **Step 4: Commit**

```bash
pnpm exec biome check --write app/not-found.tsx app/error.tsx
git add app/not-found.tsx app/error.tsx
git commit -m "feat: add root not-found and error boundaries"
```

---

### Task 8: Rewire wiki consumers to the DAL; retire `markdown-service`

**Files:**
- Modify: `app/wiki/[id]/page.tsx`
- Modify: `app/wiki/[id]/edit/page.tsx`
- Modify: `app/history/page.tsx`
- Modify: `app/regions/page.tsx`
- Modify: `app/features/page.tsx`
- Modify: `app/components/news-pane/news-pane.tsx`
- Modify: `app/actions/wiki.ts`
- Modify: `app/utils/services/index.ts`
- Delete: `app/utils/services/markdown-service.ts`

**Interfaces:**
- Consumes: the DAL from Task 6.
- Produces: all wiki reads/writes go through `lib/data/wiki`; the data layer no longer calls `redirect()` or imports `react-hot-toast`. `NotFoundError` from a page read triggers `notFound()`.

> **Behavior note:** the old `getWikiPages`/`getWikiPageBy*` returned `{ data, error }` and did `redirect("/404")`/`redirect("/error")` internally. The new DAL returns the value directly and throws. Update each call site from `const { data } = await getWikiPages(sb, T)` to `const data = await getWikiPages(sb, T)`. Reads that must 404 wrap the call and translate `NotFoundError` → `notFound()`.

- [ ] **Step 1: Update the `services` barrel**

`app/utils/services/index.ts` currently re-exports `markdown-service`. Remove that line so it reads:

```ts
export * from "./news-service";
export * from "./stats-service";
```

(Consumers import wiki functions from `@/app/lib/data/wiki` instead — updated below.)

- [ ] **Step 2: Update `app/wiki/[id]/page.tsx`**

Replace the service import and read. New relevant lines:

```tsx
import { notFound } from "next/navigation";
import { getWikiPageByUrlName } from "@/app/lib/data/wiki";
import { isNotFoundError } from "@/app/lib/errors";
// ...
const supabase = await createClient();
const user = await getAuthorizedUser();
const isAdmin = user ? user.user_role === UserRole.ADMIN : false;

let data: Awaited<ReturnType<typeof getWikiPageByUrlName>>;
try {
	data = await getWikiPageByUrlName(supabase, pageId);
} catch (err) {
	if (isNotFoundError(err)) notFound();
	throw err;
}
```

The JSX that renders `data.title` / `data.content` / `data.url_name` is unchanged.

- [ ] **Step 3: Update `app/wiki/[id]/edit/page.tsx`**

Read the file. Replace its `getWikiPageByUrlName`/`getWikiPageById` import with `import { getWikiPageByUrlName } from "@/app/lib/data/wiki";` (and `getWikiPageById` if used), change `const { data } = await get...` to `const data = await get...`, and wrap in the same `try/catch` → `notFound()` pattern as Step 2. Import `notFound` from `next/navigation` and `isNotFoundError` from `@/app/lib/errors`.

- [ ] **Step 4: Update list pages `history`, `regions`, `features`**

In each of `app/history/page.tsx`, `app/regions/page.tsx`, `app/features/page.tsx`:
- Change the import from `@/app/utils/services` to `import { getWikiPages } from "@/app/lib/data/wiki";`.
- Change `const { data } = await getWikiPages(supabase, WikiPageType.X)` to `const data = await getWikiPages(supabase, WikiPageType.X)`.

(List reads do not 404 — an empty list renders an empty grid.)

- [ ] **Step 5: Update `app/components/news-pane/news-pane.tsx`**

Read the file. Change its wiki import to `import { getWikiPages } from "@/app/lib/data/wiki";` and adjust `const { data } = await getWikiPages(...)` → `const data = await getWikiPages(...)`.

- [ ] **Step 6: Update `app/actions/wiki.ts`**

Rewrite to use the DAL and keep navigation in the action (not the data layer):

```ts
"use server";

import { redirect } from "next/navigation";
import type { WikiPageDTO, WikiPageFormData } from "@/app/types";
import { createWikiPage, deleteWikiPageByUrlName, updateWikiPage } from "@/app/lib/data/wiki";
import { createClient } from "@/app/utils/supabase/server";

export async function updateWikiPageAction(formData: WikiPageFormData) {
	const supabase = await createClient();
	const updated = await updateWikiPage(supabase, formData.id, {
		title: formData.title,
		content: formData.content,
		last_modified_by: formData.userId,
		url_name: formData.url_name,
		type: formData.type,
	});
	redirect(`/wiki/${updated.url_name}`);
}

export async function createWikiPageAction(formData: WikiPageDTO) {
	const supabase = await createClient();
	return createWikiPage(supabase, formData);
}

export async function deleteWikiPageAction(url_name: string) {
	const supabase = await createClient();
	try {
		await deleteWikiPageByUrlName(supabase, url_name);
		return null;
	} catch (error) {
		return error;
	}
}
```

> Role enforcement (`requireRole`) is deliberately deferred to Phase 2; this task preserves current behavior while moving to the DAL.

- [ ] **Step 7: Delete the old service**

```bash
git rm app/utils/services/markdown-service.ts
```

- [ ] **Step 8: Verify no dangling references**

Run: `pnpm exec grep -rn "markdown-service\|utils/services\";" app` (or use editor search) to confirm nothing imports the deleted module or expects wiki functions from the services barrel.
Then verify the toast import is gone from the data layer:
Run: search `react-hot-toast` under `app/lib` and `app/utils/services` — expect no matches.

- [ ] **Step 9: Typecheck, test, build**

Run: `pnpm typecheck`
Expected: no errors.
Run: `pnpm test`
Expected: all tests PASS.
Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 10: Commit**

```bash
pnpm exec biome check --write app
git add -A
git commit -m "refactor: route wiki reads/writes through pure data-access layer"
```

---

## Self-Review

**Spec coverage (Phase 1 slice):**
- Pure DAL, no redirect/toast in data layer → Tasks 6, 8. ✅
- Typed Supabase / generated DB types → Tasks 4, 5. ✅
- Typed error classes → Task 2. ✅
- Zod env validation, fail-fast → Task 3. ✅
- Error/not-found boundaries → Task 7. ✅
- Test harness (needed for TDD across all phases) → Task 1. ✅
- Deferred to later phases (correctly out of this plan): route groups & `utils→lib` moves (Phase 2), auth model/Discord-only/`requireRole`/profile (Phase 2), RLS/cron/sanitize/headers (Phase 2), caching/`revalidateTag`/stats split (Phase 3), dead-code/Docker/secrets (Phase 4), Playwright/CI (Phase 5).

**Placeholder scan:** Steps 3–5 of Task 8 say "Read the file" then give the exact transformation rule (import swap + `{ data }` → value + `notFound()` wrap) rather than full source, because those files' surrounding JSX is large and unchanged; the change rule is fully specified and identical to the worked example in Task 8 Step 2. No `TBD`/`TODO`/"handle edge cases" placeholders remain.

**Type consistency:** `AppError(message, { cause })`, `NotFoundError(resource)`, `isNotFoundError` used identically in Tasks 2/3/6/8. DAL names in Task 6's Produces block match Task 8's imports (`getWikiPages`, `getWikiPageByUrlName`, `getWikiPageById`, `createWikiPage`, `updateWikiPage`, `deleteWikiPageByUrlName`). `Database` shape from Task 4 matches the `.from("wiki_pages")` usage in Tasks 5/6.

**Note carried to Phase 2:** the old `getWikiPageById` was unused by the delete action (which now uses `deleteWikiPageByUrlName`); confirm no other consumer needs the old `{ data, error }` delete return shape.
