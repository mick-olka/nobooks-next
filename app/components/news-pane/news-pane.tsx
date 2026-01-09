"use server";

import { WikiPageType } from "@/app/types";
import { getWikiPages } from "@/app/utils/services";
import { createClient } from "@/app/utils/supabase/server";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import Link from "next/link";

export const NewsPane = async () => {
	const supabase = await createClient();
	const { data } = await getWikiPages(supabase, WikiPageType.HISTORY);

	const sortedNews = data
		?.sort(
			(a, b) =>
				new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
		)
		.slice(0, 4);

	return (
		<div className="max-w-3xl mx-auto px-4 py-8 z-10 relative">
			<h1 className="text-2xl font-bold mb-6">Останні оновлення</h1>
			{sortedNews.map((record) => (
				<div
					key={record.created_at}
					className="mb-8 p-6 bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
				>
					<div className="text-gray-600 font-semibold mb-4">
						{new Date(record.created_at).toLocaleDateString("uk-UA", {
							day: "2-digit",
							month: "long",
							year: "numeric",
						})}
					</div>
					<div className="prose prose-slate max-w-none">
						<div className="markdown">
							<Markdown rehypePlugins={[rehypeRaw]}>
								{record.content}
							</Markdown>
						</div>
					</div>
				</div>
			))}
			<div className="flex justify-center">
				<Link className="link-hover link" href="/history">
					<button type="button" className="btn btn-accent w-48">
						Дивитись більше
					</button>
				</Link>
			</div>
		</div>
	);
};
