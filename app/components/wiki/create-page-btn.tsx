"use client";

// import { createClient } from "@/app/utils/supabase/client";
import { unstable_rethrow, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createWikiPageAction } from "@/app/actions/wiki";
import type { WikiPageType } from "@/app/types";

// import { createWikiPage } from "@/app/utils/services";

type Props = {
	userId: string;
	type: WikiPageType;
};

export const CreateWikiPageBtn = ({ userId, type }: Props) => {
	const router = useRouter();
	// const supabase = createClient();
	const handleCreate = async () => {
		try {
			const data = await createWikiPageAction({
				title: "New page title",
				content: "New page content",
				created_by: userId,
				last_modified_by: userId,
				url_name: Math.random().toString(36).substring(2, 10),
				type,
			});
			if (data) router.push(`/wiki/${data.url_name}/edit`);
		} catch (error) {
			// Next.js redirects (e.g. from requireRole) throw a control-flow
			// error that must propagate, not be treated as a failure.
			unstable_rethrow(error);
			toast.error("Не вдалося створити сторінку");
		}
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
