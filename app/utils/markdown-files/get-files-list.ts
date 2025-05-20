import { createClient } from "@/app/utils/supabase/server";

export const getMarkdownFilesList = async () => {
	const supabase = await createClient();
	const { data, error } = await supabase.storage
		.from("markdown-files")
		.list("features", {
			limit: 100,
			offset: 0,
			sortBy: { column: "name", order: "asc" },
		});
	if (error || !data) {
		console.warn("Storage error: ", error);
		return [];
	}

	return data
		.filter((file) => file.name !== ".emptyFolderPlaceholder")
		.map((file) => file.name);
};
