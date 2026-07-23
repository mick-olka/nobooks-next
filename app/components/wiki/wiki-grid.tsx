import Link from "next/link";
import { canEditContent } from "@/app/auth/roles";
import type { UserAccount, WikiPage, WikiPageType } from "@/app/types";
import { CreateWikiPageBtn } from "./create-page-btn";

type Props = {
	user: UserAccount | null;
	data: WikiPage[];
	type: WikiPageType;
};

export const WikiGrid = ({ data, user, type }: Props) => {
	const canEdit = user ? canEditContent(user.user_role) : false;
	return (
		<>
			{canEdit && user && <CreateWikiPageBtn userId={user.id} type={type} />}
			<div className="flex flex-wrap justify-center gap-6">
				{data?.map((page) => (
					<Link
						href={`/wiki/${page.url_name}`}
						key={page.id}
						className="block w-full sm:w-80"
					>
						<div className="card h-32 border border-base-content/5 bg-base-100 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-base-content/15 hover:shadow-md">
							<h2 className="card-title line-clamp-2">{page.title}</h2>
							<p className="mt-auto text-base-content/70 underline">
								Детальніше
							</p>
						</div>
					</Link>
				))}
			</div>
		</>
	);
};
