"use server";

import { redirect } from "next/navigation";
import {
	createWikiPage,
	deleteWikiPageByUrlName,
	updateWikiPage,
} from "@/app/lib/data/wiki";
import type { WikiPageDTO, WikiPageFormData } from "@/app/types";
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
