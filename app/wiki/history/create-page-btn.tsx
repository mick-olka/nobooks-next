"use client";

import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import { WikiPageType } from "../types";
import { createWikiPage } from "@/app/utils/services";

type Props = {
  userId: string;
};

export const CreateHistoryPageBtn = ({ userId }: Props) => {
  const router = useRouter();
  const supabase = createClient();
  const createHistoryPage = async () => {
    const { data } = await createWikiPage(supabase, {
      title: "New history page",
      content: "New history page content",
      created_by: userId,
      last_modified_by: userId,
      type: WikiPageType.HISTORY,
    });
    if (data) router.push(`/wiki/history/${data[0].id}/edit`);
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
