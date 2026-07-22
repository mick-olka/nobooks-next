"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { deleteWikiPageAction } from "@/app/actions/wiki";
// import { createClient } from "@/app/utils/supabase/client";

export const AdminButtons = ({ id }: { id: string }) => {
	const router = useRouter();
	// const supabase = createClient();
	const deleteWikiPage = async () => {
		if (!confirm("Are you sure you want to delete this page?")) {
			return;
		}
		const error = await deleteWikiPageAction(id);
		// const { error } = await supabase.from("wiki_pages").delete().eq("id", id);
		if (!error) {
			router.push("/");
		} else {
			toast.error("Не вдалося видалити сторінку");
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
