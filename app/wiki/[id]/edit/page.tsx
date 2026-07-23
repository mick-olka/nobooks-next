import { notFound } from "next/navigation";
import { updateWikiPageAction } from "@/app/actions/wiki";
import { requireRole } from "@/app/auth";
import { WikiPageForm } from "@/app/components";
import { getWikiPageByUrlName } from "@/app/lib/data/wiki";
import { isNotFoundError } from "@/app/lib/errors";
import { UserRole } from "@/app/types";
import { createClient } from "@/app/utils/supabase/server";

export default async function WikiEditPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const historyId = (await params).id;
	const supabase = await createClient();
	await requireRole(UserRole.ADMIN, UserRole.MODERATOR);

	let data: Awaited<ReturnType<typeof getWikiPageByUrlName>>;
	try {
		data = await getWikiPageByUrlName(supabase, historyId);
	} catch (err) {
		if (isNotFoundError(err)) notFound();
		throw err;
	}

	return (
		<div className="p-8">
			<WikiPageForm pageData={data} handleSubmitAction={updateWikiPageAction} />
		</div>
	);
}
