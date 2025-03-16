"use client";

import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import type { WikiPageType } from "@/app/types";
import { createWikiPage } from "@/app/utils/services";

type Props = {
  userId: string;
  type: WikiPageType;
};

export const CreateHistoryPageBtn = ({ userId, type }: Props) => {
  const router = useRouter();
  const supabase = createClient();
  const createHistoryPage = async () => {
    const { data } = await createWikiPage(supabase, {
      title: "New history page",
      content: "New history page content",
      created_by: userId,
      last_modified_by: userId,
      type,
    });
    if (data) router.push(`/wiki/${data[0].id}/edit`);
  };
  return (
    <button
      className="fixed top-24 right-4 btn btn-circle btn-primary text-2xl text-white"
      type="button"
      onClick={createHistoryPage}
    >
      +
    </button>
  );
};
