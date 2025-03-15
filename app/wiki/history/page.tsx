import { getAuthorizedUser } from "@/app/auth";
import { PageTransitionWrapper } from "@/app/components";
import { UserRole } from "@/app/types";
import { createClient } from "@/app/utils/supabase/server";
import { WikiPageType } from "../types";
import { CreateHistoryPageBtn } from "./create-page-btn";
import Link from "next/link";
import { getWikiPages } from "@/app/utils/services";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data } = await getWikiPages(supabase, WikiPageType.HISTORY);
  const user = await getAuthorizedUser();
  const isAdmin = user ? user.user_role === UserRole.ADMIN : false;

  return (
    <PageTransitionWrapper className="p-8">
      {isAdmin && user && <CreateHistoryPageBtn userId={user.id} />}
      <h1 className="text-2xl font-bold m-6">Історія сервера</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((page) => (
          <div key={page.id} className="card bg-base-100 shadow-md p-6 w-96">
            <h2 className="card-title">{page.title}</h2>
            <Markdown rehypePlugins={[rehypeRaw]} className="my-4">
              {`${page.content.slice(0, 200)}...`}
            </Markdown>
            <Link href={`/wiki/history/${page.id}`}>
              <button type="button" className="btn btn-primary">
                Читати
              </button>
            </Link>
          </div>
        ))}
      </div>
    </PageTransitionWrapper>
  );
}
