import { createClient } from "../supabase/server";

export const getMarkdownFileContent = async (fileName: string) => {
  const supabase = await createClient();
  const file = await supabase.storage
    .from("markdown-files")
    .download(`features/${fileName}`);
  if (!file.data) {
    return "File not found";
  }

  const content = await file.data.text();

  return content;
};
