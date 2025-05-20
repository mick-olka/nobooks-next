import React from "react";
import { CreateWikiPageBtn } from "./create-page-btn";
import {
	UserRole,
	type WikiPage,
	type WikiPageType,
	type UserAccount,
} from "@/app/types";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import Link from "next/link";

type Props = {
	user: UserAccount | null;
	data: WikiPage[];
	type: WikiPageType;
};

export const WikiGrid = ({ data, user, type }: Props) => {
	const isAdmin = user ? user.user_role === UserRole.ADMIN : false;
	return (
		<>
			{isAdmin && user && <CreateWikiPageBtn userId={user.id} type={type} />}
			{/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> */}
			<div className="flex flex-wrap gap-6">
				{data?.map((page) => (
					<Link
						href={`/wiki/${page.url_name}`}
						// className="absolute bottom-4"
						key={page.id}
					>
						<div className="card bg-base-100 shadow-md p-6 w-96 h-32">
							<h2 className="card-title max-h-10">{page.title}</h2>
							{/* <Markdown rehypePlugins={[rehypeRaw]} className="my-4 max-h-12">
								{`${page.content.slice(0, 50)}...`}
							</Markdown> */}
							{/* <Link href={`/wiki/${page.url_name}`} className="absolute bottom-4">
              <button type="button" className="btn btn-primary">
                Читати
              </button>
            </Link> */}
							<p className="underline mt-4">Детальніше</p>
						</div>
					</Link>
				))}
			</div>
		</>
	);
};
