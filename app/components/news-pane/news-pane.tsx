"use server";

import Link from "next/link";
import { SafeMarkdown } from "@/app/components/ui";
import { getCachedWikiPages } from "@/app/lib/data/wiki-cache";
import { WikiPageType } from "@/app/types";
import { syncTelegramNewsHourly } from "@/app/utils/services";

export const NewsPane = async () => {
	await syncTelegramNewsHourly();
	const data = await getCachedWikiPages(WikiPageType.HISTORY);

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
					className="mb-8 rounded-box border border-base-content/5 bg-base-100 p-6 shadow-sm transition-shadow hover:shadow-md"
				>
					<div className="mb-4 text-sm font-semibold uppercase tracking-wide text-base-content/60">
						{new Date(record.created_at).toLocaleDateString("uk-UA", {
							day: "2-digit",
							month: "long",
							year: "numeric",
						})}
					</div>
					<div className="markdown">
						<SafeMarkdown>{record.content}</SafeMarkdown>
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
