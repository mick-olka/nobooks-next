import { describe, expect, it, vi } from "vitest";
import { getWikiPageByUrlName, getWikiPages } from "@/app/lib/data/wiki";
import { AppError, NotFoundError } from "@/app/lib/errors";
import { WikiPageType } from "@/app/types";

type Result = { data: unknown; error: unknown };

// Minimal fluent Supabase query-builder mock. Every chainable method
// returns the same builder; terminals (`single`, `then`) resolve `result`.
function mockClient(result: Result) {
	const builder: Record<string, unknown> = {};
	for (const method of [
		"select",
		"eq",
		"order",
		"insert",
		"update",
		"delete",
	]) {
		builder[method] = vi.fn(() => builder);
	}
	builder.single = vi.fn(() => Promise.resolve(result));
	builder.maybeSingle = vi.fn(() => Promise.resolve(result));
	// biome-ignore lint/suspicious/noThenProperty: thenable test double mirrors Supabase's chainable query builder
	builder.then = (resolve: (r: Result) => unknown) => resolve(result);
	const from = vi.fn(() => builder);
	// biome-ignore lint/suspicious/noExplicitAny: test double for SupabaseClient
	return { client: { from } as any, from, builder };
}

const page = {
	id: "1",
	title: "Intro",
	content: "hi",
	url_name: "intro",
	created_at: "",
	updated_at: "",
	created_by: "",
	last_modified_by: "",
	type: "wiki",
};

describe("getWikiPages", () => {
	it("returns rows filtered by type", async () => {
		const { client, from } = mockClient({ data: [page], error: null });
		const rows = await getWikiPages(client, WikiPageType.WIKI);
		expect(from).toHaveBeenCalledWith("wiki_pages");
		expect(rows).toEqual([page]);
	});

	it("throws AppError on a query error", async () => {
		const { client } = mockClient({
			data: null,
			error: { message: "db down" },
		});
		await expect(
			getWikiPages(client, WikiPageType.WIKI),
		).rejects.toBeInstanceOf(AppError);
	});
});

describe("getWikiPageByUrlName", () => {
	it("returns a single page", async () => {
		const { client } = mockClient({ data: page, error: null });
		await expect(getWikiPageByUrlName(client, "intro")).resolves.toEqual(page);
	});

	it("throws NotFoundError when the row is missing", async () => {
		const { client } = mockClient({ data: null, error: null });
		await expect(getWikiPageByUrlName(client, "nope")).rejects.toBeInstanceOf(
			NotFoundError,
		);
	});
});
