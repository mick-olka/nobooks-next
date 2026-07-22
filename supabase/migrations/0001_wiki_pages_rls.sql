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
