import { z } from "zod";
import { AppError } from "@/app/lib/errors";
import { WikiPageType } from "@/app/types";

// Lenient by design: this schema is defense-in-depth against clearly-invalid
// input (empty title/url_name, unknown type), not a strict content
// validator. `content` may be empty, and it must never reject a currently
// valid wiki edit.
export const wikiPageInputSchema = z.object({
	title: z.string().trim().min(1),
	content: z.string(),
	url_name: z.string().trim().min(1),
	type: z.nativeEnum(WikiPageType),
	created_by: z.string().optional(),
	last_modified_by: z.string().optional(),
});

export function parseWikiPageInput(input: unknown) {
	const result = wikiPageInputSchema.safeParse(input);
	if (!result.success) {
		throw new AppError(
			`Invalid wiki page input: ${result.error.issues.map((i) => i.message).join("; ")}`,
		);
	}
	return result.data;
}
