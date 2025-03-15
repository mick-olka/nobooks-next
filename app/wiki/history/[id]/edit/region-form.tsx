"use client";

import { updateWikiPage } from "@/app/utils/services";
import { createClient } from "@/app/utils/supabase/client";
import type { WikiPage } from "@/app/wiki/types";
import { redirect } from "next/navigation";
import { useState } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";

export const RegionForm = ({
  pageData,
  userId,
}: {
  pageData: WikiPage;
  userId: string;
}) => {
  const supabase = createClient();
  const [content, setContent] = useState(pageData.content);
  const [title, setTitle] = useState(pageData.title);

  const updateHistoryPage = async () => {
    const { data } = await updateWikiPage(supabase, pageData.id, {
      title: title,
      content: content,
      last_modified_by: userId,
      type: pageData.type,
    });
    if (data) {
      redirect(`/wiki/history/${pageData.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        name="title"
        placeholder="Назва"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input input-bordered w-full max-w-xs"
      />

      <div className="grid grid-cols-2 gap-4 h-full">
        <textarea
          className="min-h-[300px] p-2 border rounded h-full"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter markdown content..."
        />
        <div className="border rounded p-4 overflow-y-auto">
          <Markdown className="markdown editor" rehypePlugins={[rehypeRaw]}>
            {content}
          </Markdown>
        </div>
      </div>

      <button
        className="btn btn-primary"
        type="button"
        onClick={() => updateHistoryPage()}
      >
        Зберегти
      </button>
    </div>
  );
};
