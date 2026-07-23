# Production checklist — manual go-live steps

Three things the code can't do for itself. Do them **around the same time** you push `refactor/architectural-overhaul` to `main` (that push triggers `deploy.yml`). Recommended order: 1 → 2 → 3, then deploy.

---

## 1. Apply Row-Level Security (RLS)

`supabase/migrations/0001_wiki_pages_rls.sql` makes `wiki_pages` publicly **readable** but writable only by **admin/moderator**. Its write policy assumes `get_user_role()` returns the *current caller's* role.

**a. Verify the function first** — Supabase Dashboard → SQL Editor:
```sql
select prosecdef as security_definer, prosrc
from pg_proc where proname = 'get_user_role';
```
- `security_definer = true` **and** the body derives the role from `auth.uid()` (takes no argument) → the migration is correct, apply it.
- If it takes an argument, isn't `security definer`, or reads the role some other way → **paste me the output and I'll adjust the policy** before you apply.

**b. Apply** — either:
- CLI: `supabase link --project-ref <your-ref>` then `supabase db push`, or
- Dashboard → SQL Editor → paste the file's contents → **Run**.

**c. Verify** (test through the app — the SQL editor runs as superuser and *bypasses* RLS):
- Logged out: a wiki page still loads (public read works).
- Non-admin Discord account: you **cannot** create/edit a page.
- Admin/moderator account: create/edit **works**.

---

## 2. Rotate the exposed Supabase keys

The anon + service-role keys were committed to git history — treat them as compromised.

Supabase Dashboard → **Project Settings → API**:
- Rotate the **anon** (public) and **service_role** (secret) keys. On legacy projects this means rolling the **JWT secret**, which regenerates both keys and **logs out all users** — do it at low traffic. Newer projects rotate publishable/secret keys individually.
- Update the new values **everywhere they're used**:
  - local `.env` — replace `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (`NEXT_PUBLIC_SUPABASE_URL` is unchanged)
  - **production** environment (your server's `.env` / compose env)
  - any CI or deploy secrets holding them
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is inlined at **build time**, so production must be **rebuilt** after rotating — your deploy runs `docker compose up --build`, so a fresh deploy picks it up.

---

## 3. Set `CRON_SECRET`

`GET /api/telegram-news-sync` now **fails closed**: 401 unless `CRON_SECRET` is set and the caller sends a matching bearer token.

- Generate one: `openssl rand -hex 32`
- Add `CRON_SECRET=<value>` to the **production** environment.
- Point your scheduler at the endpoint with the header:
  ```
  Authorization: Bearer <value>
  ```
- Scope: this only gates the dedicated endpoint. News also syncs opportunistically on homepage renders (hourly-throttled), so an unset secret just disables the cron endpoint — it doesn't stop news.

---

## Env note (all three touch this)

`app/lib/env.ts` validates env at boot and **fails fast** if a required var is missing (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`). Make sure production actually supplies these at **build and runtime** (a server-side `.env` your `docker-compose` reads, or build args) — otherwise the build/boot will stop rather than run half-configured. See `.env.example` for the full list.

## Then deploy

With 1–3 in place, push to `main` (or merge the PR). CI (`biome → typecheck → test → build`) must pass first; then `deploy.yml` rebuilds and restarts the container on your server.
