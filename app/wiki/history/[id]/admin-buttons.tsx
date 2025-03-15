"use client";

import { createClient } from "@/app/utils/supabase/client";
import Link from "next/link";
import { redirect } from "next/navigation";

export const AdminButtons = ({ id }: { id: string }) => {
  const supabase = createClient();
  const deleteWikiPage = async () => {
    if (!confirm("Are you sure you want to delete this page?")) {
      return;
    }
    const { error } = await supabase.from("wiki_pages").delete().eq("id", id);
    if (!error) {
      redirect("/wiki/history");
    }
  };
  return (
    <div className="fixed top-24 right-4">
      <Link href={`/wiki/history/${id}/edit`}>
        <button
          type="button"
          className="btn btn-circle btn-info fixed top-20 right-4"
        >
          ✏️
        </button>
      </Link>
      <button
        onClick={deleteWikiPage}
        className="btn btn-circle btn-error fixed top-36 right-4"
        type="button"
      >
        🗑️
      </button>
    </div>
  );
};
