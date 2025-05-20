import { updateWikiPageAction } from "@/app/actions/wiki";
import { getAuthorizedUser } from "@/app/auth";
import { WikiPageForm } from "@/app/components";
import { getWikiPageByUrlName } from "@/app/utils/services";
import { createClient } from "@/app/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function WikiEditPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const historyId = (await params).id;
	const supabase = await createClient();
	const user = await getAuthorizedUser({ adminProtectedPage: true });
	const { data } = await getWikiPageByUrlName(supabase, historyId);
	if (!user) redirect("/login");

	return (
		<div className="p-8">
			<WikiPageForm pageData={data} handleSubmitAction={updateWikiPageAction} />
		</div>
	);
}
