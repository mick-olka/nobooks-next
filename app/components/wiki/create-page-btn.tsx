"use client";

import { createWikiPageAction } from "@/app/actions/wiki";
import type { WikiPageType } from "@/app/types";
// import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
// import { createWikiPage } from "@/app/utils/services";

type Props = {
	userId: string;
	type: WikiPageType;
};

export const CreateWikiPageBtn = ({ userId, type }: Props) => {
	const router = useRouter();
	// const supabase = createClient();
	const handleCreate = async () => {
		const data = await createWikiPageAction({
			title: "New page title",
			content: "New page content",
			created_by: userId,
			last_modified_by: userId,
			url_name: Math.random().toString(36).substring(2, 10),
			type,
		});
		if (data) router.push(`/wiki/${data[0].url_name}/edit`);
	};
	return (
		<button
			className="fixed top-24 right-4 btn btn-circle btn-outline btn-sm text-xl btn-info z-20"
			type="button"
			onClick={handleCreate}
		>
			+
		</button>
	);
};
