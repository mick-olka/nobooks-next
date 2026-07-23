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
	// `url_name` has no UNIQUE constraint, so a slug can match multiple rows.
	// `.maybeSingle()` turns that into a PGRST116 error (surfacing as a 500),
	// so we fetch as an array — same shape as `getWikiPages` — and take the
	// most-recently-updated row. Zero rows is a genuine not-found (404).
	const { data, error } = await sb
		.from("wiki_pages")
		.select("*")
		.eq("url_name", urlName)
		.order("updated_at", { ascending: false })
		.limit(1);
	if (error) throw new AppError("Failed to load wiki page", { cause: error });
	const page = data?.[0];
	if (!page) throw new NotFoundError(`wiki page: ${urlName}`);
	return page as WikiPage;
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

export async function deleteWikiPage(
	sb: WikiClient,
	id: string,
): Promise<void> {
	const { error } = await sb.from("wiki_pages").delete().eq("id", id);
	if (error) throw new AppError("Failed to delete wiki page", { cause: error });
}

export async function deleteWikiPageByUrlName(
	sb: WikiClient,
	urlName: string,
): Promise<void> {
	const { error } = await sb
		.from("wiki_pages")
		.delete()
		.eq("url_name", urlName);
	if (error) throw new AppError("Failed to delete wiki page", { cause: error });
}
