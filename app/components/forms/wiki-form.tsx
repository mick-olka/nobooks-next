"use client";

import type { WikiPage, WikiPageFormData } from "@/app/types";
import { useState } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";

export const WikiPageForm = ({
  handleSubmitAction,
  pageData,
}: {
  handleSubmitAction: (formData: WikiPageFormData) => void;
  pageData: WikiPage;
}) => {
  const [content, setContent] = useState(pageData.content);
  const [title, setTitle] = useState(pageData.title);
  const [urlName, setUrlName] = useState(pageData.url_name);

  const handleSubmit = () => {
    handleSubmitAction({
      title,
      content,
      id: pageData.id,
      userId: pageData.last_modified_by,
      url_name: urlName,
      type: pageData.type,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-12">
        <div>
          <label htmlFor="title">Заголовок</label>
          <input
            type="text"
            name="title"
            placeholder="Назва"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input input-bordered w-full max-w-xs"
          />
        </div>
        <div>
          <label htmlFor="url_name">URL назва</label>
          <input
            type="text"
            name="url_name"
            placeholder="URL назва"
            value={urlName}
            onChange={(e) => setUrlName(e.target.value)}
            className="input input-bordered w-full max-w-xs"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 h-full">
        <textarea
          className="min-h-[300px] p-2 border rounded w-full md:w-1/2"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter markdown content..."
        />
        <div className="border rounded p-4 overflow-y-auto w-full md:w-1/2">
          <Markdown className="markdown editor" rehypePlugins={[rehypeRaw]}>
            {content}
          </Markdown>
        </div>
      </div>

      <button className="btn btn-primary" type="button" onClick={handleSubmit}>
        Зберегти
      </button>
    </div>
  );
};
