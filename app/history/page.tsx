import { getAuthorizedUser } from "@/app/auth";
import { PageTransitionWrapper, WikiGrid } from "@/app/components";
import { WikiPageType } from "@/app/types";
import { createClient } from "@/app/utils/supabase/server";

import { getWikiPages } from "@/app/utils/services";

export default async function HistoryListPage() {
	const supabase = await createClient();
	const { data } = await getWikiPages(supabase, WikiPageType.HISTORY);
	const user = await getAuthorizedUser();

	return (
		<PageTransitionWrapper className="p-8">
			<h1 className="text-2xl font-bold m-6 text-center">Історія сервера</h1>
			<WikiGrid data={data} user={user} type={WikiPageType.HISTORY} />
		</PageTransitionWrapper>
	);
}
