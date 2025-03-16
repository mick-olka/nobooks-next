import { getAuthorizedUser } from "@/app/auth";
import { PageTransitionWrapper, WikiGrid } from "@/app/components";
import { WikiPageType } from "@/app/types";
import { createClient } from "@/app/utils/supabase/server";

import { getWikiPages } from "@/app/utils/services";

export default async function RegionListPage() {
  const supabase = await createClient();
  const { data } = await getWikiPages(supabase, WikiPageType.REGION);
  const user = await getAuthorizedUser();

  return (
    <PageTransitionWrapper className="p-8">
      <h1 className="text-2xl font-bold m-6">Поселення на сервері</h1>
      <WikiGrid data={data} user={user} type={WikiPageType.REGION} />
    </PageTransitionWrapper>
  );
}
