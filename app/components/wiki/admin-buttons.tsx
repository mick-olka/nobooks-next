"use client";

import { deleteWikiPageAction } from "@/app/actions/wiki";
// import { createClient } from "@/app/utils/supabase/client";
import Link from "next/link";
import { redirect } from "next/navigation";

export const AdminButtons = ({ id }: { id: string }) => {
	// const supabase = createClient();
	const deleteWikiPage = async () => {
		if (!confirm("Are you sure you want to delete this page?")) {
			return;
		}
		const error = await deleteWikiPageAction(id);
		// const { error } = await supabase.from("wiki_pages").delete().eq("id", id);
		if (!error) {
			redirect("/");
		}
	};
	return (
		<div className="absolute top-24 right-4 flex gap-4">
			<Link href={`/wiki/${id}/edit`}>
				<button
					type="button"
					className="btn btn-circle btn-sm btn-outline btn-info"
				>
					✏️
				</button>
			</Link>
			<button
				onClick={deleteWikiPage}
				className="btn btn-circle btn-sm btn-outline btn-error"
				type="button"
			>
				🗑️
			</button>
		</div>
	);
};
