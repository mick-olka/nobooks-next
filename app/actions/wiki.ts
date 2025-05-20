"use server";

import type { WikiPageDTO, WikiPageFormData } from "@/app/types";
import { createWikiPage, updateWikiPage } from "@/app/utils/services";
import { createClient } from "@/app/utils/supabase/server";
import { redirect } from "next/navigation";

export async function updateWikiPageAction(formData: WikiPageFormData) {
	const supabase = await createClient();
	const { data: updatedWiki } = await updateWikiPage(supabase, formData.id, {
		title: formData.title,
		content: formData.content,
		last_modified_by: formData.userId,
		url_name: formData.url_name,
		type: formData.type,
	});

	if (updatedWiki) {
		redirect(`/wiki/${updatedWiki.url_name}`);
	}
}

export async function createWikiPageAction(formData: WikiPageDTO) {
	const supabase = await createClient();
	const { data: newWiki } = await createWikiPage(supabase, formData);
	return newWiki;
}

export async function deleteWikiPageAction(url_name: string) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("wiki_pages")
		.delete()
		.eq("url_name", url_name);
	return error;
}
