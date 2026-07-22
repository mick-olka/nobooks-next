import { unstable_cache } from "next/cache";
import { getWikiPageByUrlName, getWikiPages } from "@/app/lib/data/wiki";
import { createPublicClient } from "@/app/lib/supabase/public";
import type { WikiPageType } from "@/app/types";

export const WIKI_TAG = "wiki";

export function getCachedWikiPages(type: WikiPageType) {
	return unstable_cache(
		async () => getWikiPages(createPublicClient(), type),
		["wiki-pages", type],
		{ tags: [WIKI_TAG] },
	)();
}

export function getCachedWikiPageByUrlName(urlName: string) {
	return unstable_cache(
		async () => getWikiPageByUrlName(createPublicClient(), urlName),
		["wiki-page", urlName],
		{ tags: [WIKI_TAG, `${WIKI_TAG}:${urlName}`] },
	)();
}
