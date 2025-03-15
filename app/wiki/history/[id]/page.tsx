import { createClient } from "@/app/utils/supabase/server";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { getAuthorizedUser } from "@/app/auth";
import { UserRole } from "@/app/types";
import { getWikiPageById } from "@/app/utils/services";
import { AdminButtons } from "./admin-buttons";
import Link from "next/link";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const pageId = (await params).id;
  const supabase = await createClient();
  const user = await getAuthorizedUser();
  const isAdmin = user ? user.user_role === UserRole.ADMIN : false;
  const { data } = await getWikiPageById(supabase, pageId);

  return (
    <div className="p-4 max-w-[1200px] mx-auto">
      <div className="flex items-center">
        <Link href="/wiki/history">
          <button type="button" className="btn btn-link text-2xl">
            {"< Назад"}
          </button>
        </Link>
        <h1 className="text-3xl font-bold my-6">{data.title}</h1>
      </div>
      <div className="card bg-base-100 shadow-md p-4">
        <Markdown className="markdown editor" rehypePlugins={[rehypeRaw]}>
          {data.content}
        </Markdown>
      </div>
      {isAdmin && user && <AdminButtons id={data.id} />}
    </div>
  );
}
