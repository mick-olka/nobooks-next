import { createClient } from "@/app/utils/supabase/server";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { getAuthorizedUser } from "@/app/auth";
import { UserRole } from "@/app/types";
import { getWikiPageByUrlName } from "@/app/utils/services";
import { BackBtn, AdminButtons } from "@/app/components";

export default async function WikiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const pageId = (await params).id;
  const supabase = await createClient();
  const user = await getAuthorizedUser();
  const isAdmin = user ? user.user_role === UserRole.ADMIN : false;
  const { data } = await getWikiPageByUrlName(supabase, pageId);

  return (
    <div className="p-4 max-w-[1200px] mx-auto">
      <div className="flex items-center">
        <BackBtn isAdmin={isAdmin} />
        <h1 className="text-3xl font-bold my-6">{data.title}</h1>
      </div>
      <div className="card bg-base-100 shadow-md p-4">
        <Markdown className="markdown editor" rehypePlugins={[rehypeRaw]}>
          {data.content}
        </Markdown>
      </div>
      {isAdmin && user && <AdminButtons id={data.url_name} />}
    </div>
  );
}
