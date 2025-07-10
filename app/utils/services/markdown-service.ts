import type { WikiPage, WikiPageDTO, WikiPageType } from "@/app/types";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import type { createClient } from "@/app/utils/supabase/server";

// Use the actual return type from createClient
type ClientType = Awaited<ReturnType<typeof createClient>>;

export const getWikiPages = async (sb: ClientType, type: WikiPageType) => {
  const { data, error }: PostgrestSingleResponse<WikiPage[]> = await sb
    .from("wiki_pages")
    .select("*")
    .eq("type", type);
  if (!data) redirect("/404");
  if (error) redirect("/error");
  return { data, error };
};

export const getWikiPageById = async (sb: ClientType, id: string) => {
  const { data, error }: PostgrestSingleResponse<WikiPage> = await sb
    .from("wiki_pages")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) redirect("/404");
  if (error) redirect("/error");
  return { data, error };
};

export const getWikiPageByUrlName = async (sb: ClientType, urlName: string) => {
  const { data, error }: PostgrestSingleResponse<WikiPage> = await sb
    .from("wiki_pages")
    .select("*")
    .eq("url_name", urlName)
    .single();
  if (!data) redirect("/404");
  if (error) redirect("/error");
  return { data, error };
};

export const createWikiPage = async (sb: ClientType, body: WikiPageDTO) => {
  const { data, error }: PostgrestSingleResponse<WikiPage[]> = await sb
    .from("wiki_pages")
    .insert(body)
    .select();
  if (!data) redirect("/404");
  if (error) redirect("/error");
  return { data, error };
};

export const updateWikiPage = async (
  sb: ClientType,
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
  if (error) toast.error(JSON.stringify(error));
  return { data, error };
};

export const deleteWikiPage = async (sb: ClientType, id: string) => {
  const { data, error }: PostgrestSingleResponse<WikiPage[]> = await sb
    .from("wiki_pages")
    .delete()
    .eq("id", id)
    .select();
  if (error) redirect("/error");
  return { data, error };
};
