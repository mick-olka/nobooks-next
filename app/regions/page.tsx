import { getUser } from "@/app/auth";
import { PageTransitionWrapper, WikiGrid } from "@/app/components";
import { getCachedWikiPages } from "@/app/lib/data/wiki-cache";
import { WikiPageType } from "@/app/types";

export default async function RegionListPage() {
	const data = await getCachedWikiPages(WikiPageType.REGION);
	const user = await getUser();

	return (
		<PageTransitionWrapper className="p-8">
			<h1 className="text-2xl font-bold m-6 text-center">
				Поселення на сервері
			</h1>
			<WikiGrid data={data} user={user} type={WikiPageType.REGION} />
		</PageTransitionWrapper>
	);
}
