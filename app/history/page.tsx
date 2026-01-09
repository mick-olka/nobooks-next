import { getAuthorizedUser } from "@/app/auth";
import {
	AdminButtons,
	CreateWikiPageBtn,
	PageTransitionWrapper,
} from "@/app/components";
import { UserRole, WikiPageType } from "@/app/types";
import { createClient } from "@/app/utils/supabase/server";
import { getWikiPages } from "@/app/utils/services";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import Link from "next/link";

export default async function HistoryListPage() {
	const supabase = await createClient();
	const { data } = await getWikiPages(supabase, WikiPageType.HISTORY);
	const user = await getAuthorizedUser();
	const isAdmin = user ? user.user_role === UserRole.ADMIN : false;

	return (
		<PageTransitionWrapper className="p-8">
			<div className="max-w-3xl mx-auto px-4 py-8 z-10">
				{isAdmin && user && (
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
							{isAdmin && user && <AdminButtons id={page.url_name} />}
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
									<Markdown rehypePlugins={[rehypeRaw]}>
										{page.content}
									</Markdown>
								</div>
							</div>
						</div>
					))}
			</div>
		</PageTransitionWrapper>
	);
}
