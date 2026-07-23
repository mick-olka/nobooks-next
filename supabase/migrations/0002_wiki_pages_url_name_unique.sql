-- Deduplicate wiki_pages by url_name and enforce global uniqueness.
--
-- `/wiki/[slug]` resolves pages by url_name regardless of type, so url_name
-- must be globally unique. Duplicate slugs made `.maybeSingle()` raise
-- PGRST116 ("multiple rows returned"), which surfaced as a 500 on every
-- affected page. Remove the older duplicates (keep the most-recently-updated
-- row per slug — matching the app's `.order("updated_at", desc).limit(1)`),
-- then add a UNIQUE constraint so duplicates cannot reappear.

-- 1. Delete older duplicates, keeping one row per url_name: the most-recently
--    updated, tie-broken by the larger id for determinism. Single-row slugs
--    are never matched (no strictly-newer counterpart exists), so this is a
--    no-op on an already-clean table.
delete from public.wiki_pages a
using public.wiki_pages b
where a.url_name = b.url_name
  and (
    a.updated_at < b.updated_at
    or (a.updated_at = b.updated_at and a.id < b.id)
  );

-- 2. Enforce uniqueness so a slug can only ever map to one row. Guarded so the
--    migration is safe to re-run.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'wiki_pages_url_name_key'
  ) then
    alter table public.wiki_pages
      add constraint wiki_pages_url_name_key unique (url_name);
  end if;
end $$;
