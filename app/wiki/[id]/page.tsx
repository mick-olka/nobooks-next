import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { getUser } from "@/app/auth";
import { canEditContent } from "@/app/auth/roles";
import { AdminButtons, BackBtn } from "@/app/components";
import { getWikiPageByUrlName } from "@/app/lib/data/wiki";
import { isNotFoundError } from "@/app/lib/errors";
import { createClient } from "@/app/utils/supabase/server";

export default async function WikiPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const pageId = (await params).id;
	const supabase = await createClient();
	const user = await getUser();
	const canEdit = user ? canEditContent(user.user_role) : false;

	let data: Awaited<ReturnType<typeof getWikiPageByUrlName>>;
	try {
		data = await getWikiPageByUrlName(supabase, pageId);
	} catch (err) {
		if (isNotFoundError(err)) notFound();
		throw err;
	}

	return (
		<div className="p-4 max-w-[1200px] mx-auto">
			<div className="flex items-center">
				<BackBtn isAdmin={canEdit} />
				<h1 className="text-3xl font-bold my-6">{data.title}</h1>
			</div>
			<div className="card bg-base-100 shadow-md p-4">
				<div className="markdown editor">
					<Markdown rehypePlugins={[rehypeRaw]}>{data.content}</Markdown>
				</div>
			</div>
			{canEdit && user && <AdminButtons id={data.url_name} />}
		</div>
	);
}
