import Link from "next/link";
import { getUser } from "@/app/auth";
import { canEditContent } from "@/app/auth/roles";
import {
	AdminButtons,
	CreateWikiPageBtn,
	PageTransitionWrapper,
	SafeMarkdown,
} from "@/app/components";
import { getWikiPages } from "@/app/lib/data/wiki";
import { WikiPageType } from "@/app/types";
import { createClient } from "@/app/utils/supabase/server";

export default async function HistoryListPage() {
	const supabase = await createClient();
	const data = await getWikiPages(supabase, WikiPageType.HISTORY);
	const user = await getUser();
	const canEdit = user ? canEditContent(user.user_role) : false;

	return (
		<PageTransitionWrapper className="p-8">
			<div className="max-w-3xl mx-auto px-4 py-8 z-10">
				{canEdit && user && (
					<CreateWikiPageBtn userId={user.id} type={WikiPageType.HISTORY} />
				)}

				<h1 className="text-2xl font-bold mb-6 text-center">Історія сервера</h1>
				{data
					?.sort(
						(a, b) =>
							new Date(b.created_at).getTime() -
							new Date(a.created_at).getTime(),
					)
					.map((page) => (
						<div
							key={page.id}
							className="relative mb-8 p-6 bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
						>
							{canEdit && user && <AdminButtons id={page.url_name} />}
							<div className="text-gray-600 font-semibold mb-4">
								{new Date(page.created_at).toLocaleDateString("uk-UA", {
									day: "2-digit",
									month: "long",
									year: "numeric",
								})}
							</div>
							<div className="text-xl font-semibold mb-4">
								<Link
									href={`/wiki/${page.url_name}`}
									className="hover:text-blue-400 transition-colors"
								>
									{page.title}
								</Link>
							</div>
							<div className="prose prose-slate max-w-none">
								<div className="markdown">
									<SafeMarkdown>{page.content}</SafeMarkdown>
								</div>
							</div>
						</div>
					))}
			</div>
		</PageTransitionWrapper>
	);
}
