import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import type { WikiPage, WikiPageDTO, WikiPageType } from "@/app/types";
import type { createClient } from "@/app/utils/supabase/server";

// Use the actual return type from createClient
type ClientType = Awaited<ReturnType<typeof createClient>>;

// transitional: retired in Task 8 — casts bridge the typed Database rows to the
// app's WikiPage shape until this file is replaced by the DAL.

export const getWikiPages = async (sb: ClientType, type: WikiPageType) => {
	const { data, error } = await sb
		.from("wiki_pages")
		.select("*")
		.order("updated_at", { ascending: false })
		.eq("type", type);
	if (!data) redirect("/404");
	if (error) redirect("/error");
	return { data: data as WikiPage[], error };
};

export const getWikiPageById = async (sb: ClientType, id: string) => {
	const { data, error } = await sb
		.from("wiki_pages")
		.select("*")
		.eq("id", id)
		.single();
	if (!data) redirect("/404");
	if (error) redirect("/error");
	return { data: data as WikiPage, error };
};

export const getWikiPageByUrlName = async (sb: ClientType, urlName: string) => {
	const { data, error } = await sb
		.from("wiki_pages")
		.select("*")
		.eq("url_name", urlName)
		.single();
	if (!data) redirect("/404");
	if (error) redirect("/error");
	return { data: data as WikiPage, error };
};

export const createWikiPage = async (sb: ClientType, body: WikiPageDTO) => {
	const { data, error } = await sb.from("wiki_pages").insert(body).select();
	if (!data) redirect("/404");
	if (error) redirect("/error");
	return { data: data as WikiPage[], error };
};

export const updateWikiPage = async (
	sb: ClientType,
	id: string,
	body: WikiPageDTO,
) => {
	const { data, error } = await sb
		.from("wiki_pages")
		.update(body)
		.eq("id", id)
		.select()
		.single();
	if (!data) redirect("/404");
	if (error) toast.error(JSON.stringify(error));
	return { data: data as WikiPage, error };
};

export const deleteWikiPage = async (sb: ClientType, id: string) => {
	const { data, error } = await sb
		.from("wiki_pages")
		.delete()
		.eq("id", id)
		.select();
	if (error) redirect("/error");
	return { data: data as WikiPage[], error };
};
