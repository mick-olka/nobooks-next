"use server";

import { createClient } from "@/app/utils/supabase/server";
import { redirect } from "next/navigation";
import { updateWikiPage } from "@/app/utils/services";
import type { WikiPageFormData } from "@/app/types";

export async function updateWikiPageAction(formData: WikiPageFormData) {
  const supabase = await createClient();
  const { data: updatedWiki } = await updateWikiPage(supabase, formData.id, {
    title: formData.title,
    content: formData.content,
    last_modified_by: formData.userId,
    type: formData.type,
  });

  if (updatedWiki) {
    redirect(`/wiki/${formData.id}`);
  }
}
