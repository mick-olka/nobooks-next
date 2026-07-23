"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parseWikiPageInput } from "@/app/actions/wiki-schema";
import { requireRole } from "@/app/auth";
import {
	createWikiPage,
	deleteWikiPageByUrlName,
	updateWikiPage,
} from "@/app/lib/data/wiki";
import { WIKI_TAG } from "@/app/lib/data/wiki-cache";
import { UserRole, type WikiPageDTO, type WikiPageFormData } from "@/app/types";
import { createClient } from "@/app/utils/supabase/server";

export async function updateWikiPageAction(formData: WikiPageFormData) {
	await requireRole(UserRole.ADMIN, UserRole.MODERATOR);
	const body = parseWikiPageInput({
		title: formData.title,
		content: formData.content,
		last_modified_by: formData.userId,
		url_name: formData.url_name,
		type: formData.type,
	});
	const supabase = await createClient();
	const updated = await updateWikiPage(supabase, formData.id, body);
	revalidateTag(WIKI_TAG, { expire: 0 });
	redirect(`/wiki/${updated.url_name}`);
}

export async function createWikiPageAction(formData: WikiPageDTO) {
	await requireRole(UserRole.ADMIN, UserRole.MODERATOR);
	const body = parseWikiPageInput(formData);
	const supabase = await createClient();
	const created = await createWikiPage(supabase, body);
	revalidateTag(WIKI_TAG, { expire: 0 });
	return created;
}

export async function deleteWikiPageAction(url_name: string) {
	await requireRole(UserRole.ADMIN, UserRole.MODERATOR);
	const supabase = await createClient();
	try {
		const parsedUrlName = z.string().min(1).parse(url_name);
		await deleteWikiPageByUrlName(supabase, parsedUrlName);
		revalidateTag(WIKI_TAG, { expire: 0 });
		return null;
	} catch (error) {
		return error;
	}
}
