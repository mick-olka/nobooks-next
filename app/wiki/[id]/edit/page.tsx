import { createClient } from "@/app/utils/supabase/server";
import { getAuthorizedUser } from "@/app/auth";
import { getWikiPageById } from "@/app/utils/services";
import { redirect } from "next/navigation";
import { WikiPageForm } from "@/app/components";
import { updateWikiPageAction } from "@/app/actions/wiki";

export default async function WikiEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const historyId = (await params).id;
  const supabase = await createClient();
  const user = await getAuthorizedUser({ adminProtectedPage: true });
  const { data } = await getWikiPageById(supabase, historyId);
  if (!user) redirect("/login");

  return (
    <div className="p-8">
      <WikiPageForm pageData={data} handleSubmitAction={updateWikiPageAction} />
    </div>
  );
}
