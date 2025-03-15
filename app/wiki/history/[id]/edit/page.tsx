import { RegionForm } from "./region-form";
import { createClient } from "@/app/utils/supabase/server";
import { getAuthorizedUser } from "@/app/auth";
import { getWikiPageById } from "@/app/utils/services";
import { redirect } from "next/navigation";

export default async function RegionEditPage({
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
      <RegionForm pageData={data} userId={user.id} />
    </div>
  );
}
