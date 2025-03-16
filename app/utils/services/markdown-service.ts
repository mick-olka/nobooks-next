import type {
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";
import type { WikiPageType, WikiPage, WikiPageDTO } from "@/app/types";
import { redirect } from "next/navigation";

export const getWikiPages = async (sb: SupabaseClient, type: WikiPageType) => {
  const { data, error }: PostgrestSingleResponse<WikiPage[]> = await sb
    .from("wiki_pages")
    .select("*")
    .eq("type", type);
  if (!data) redirect("/404");
  if (error) redirect("/error");
  return { data, error };
};

export const getWikiPageById = async (sb: SupabaseClient, id: string) => {
  const { data, error }: PostgrestSingleResponse<WikiPage> = await sb
    .from("wiki_pages")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) redirect("/404");
  if (error) redirect("/error");
  return { data, error };
};

export const getWikiPageByUrlName = async (
  sb: SupabaseClient,
  urlName: string
) => {
  const { data, error }: PostgrestSingleResponse<WikiPage> = await sb
    .from("wiki_pages")
    .select("*")
    .eq("url_name", urlName)
    .single();
  if (!data) redirect("/404");
  if (error) redirect("/error");
  return { data, error };
};

export const createWikiPage = async (sb: SupabaseClient, body: WikiPageDTO) => {
  const { data, error }: PostgrestSingleResponse<WikiPage[]> = await sb
    .from("wiki_pages")
    .insert(body)
    .select();
  if (!data) redirect("/404");
  if (error) redirect("/error");
  return { data, error };
};

export const updateWikiPage = async (
  sb: SupabaseClient,
  id: string,
  body: WikiPageDTO
) => {
  const { data, error }: PostgrestSingleResponse<WikiPage> = await sb
    .from("wiki_pages")
    .update(body)
    .eq("id", id)
    .select()
    .single();
  if (!data) redirect("/404");
  if (error) redirect("/error");
  return { data, error };
};

export const deleteWikiPage = async (sb: SupabaseClient, id: string) => {
  const { data, error }: PostgrestSingleResponse<WikiPage[]> = await sb
    .from("wiki_pages")
    .delete()
    .eq("id", id)
    .select();
  if (error) redirect("/error");
  return { data, error };
};
