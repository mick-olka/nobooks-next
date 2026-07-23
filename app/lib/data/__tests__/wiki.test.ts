import { describe, expect, it, vi } from "vitest";
import {
	createWikiPage,
	deleteWikiPage,
	deleteWikiPageByUrlName,
	getWikiPageById,
	getWikiPageByUrlName,
	getWikiPages,
	updateWikiPage,
} from "@/app/lib/data/wiki";
import { AppError, NotFoundError } from "@/app/lib/errors";
import { type WikiPageDTO, WikiPageType } from "@/app/types";

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

const dto: WikiPageDTO = {
	title: "Intro",
	content: "hi",
	url_name: "intro",
	type: WikiPageType.WIKI,
};

describe("getWikiPages", () => {
	it("returns rows filtered by type", async () => {
		const { client, from, builder } = mockClient({ data: [page], error: null });
		const rows = await getWikiPages(client, WikiPageType.WIKI);
		expect(from).toHaveBeenCalledWith("wiki_pages");
		expect(builder.eq).toHaveBeenCalledWith("type", WikiPageType.WIKI);
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
		const { client, builder } = mockClient({ data: page, error: null });
		await expect(getWikiPageByUrlName(client, "intro")).resolves.toEqual(page);
		expect(builder.eq).toHaveBeenCalledWith("url_name", "intro");
	});

	it("throws NotFoundError when the row is missing", async () => {
		const { client } = mockClient({ data: null, error: null });
		await expect(getWikiPageByUrlName(client, "nope")).rejects.toBeInstanceOf(
			NotFoundError,
		);
	});
});

describe("getWikiPageById", () => {
	it("returns the page on success", async () => {
		const { client } = mockClient({ data: page, error: null });
		await expect(getWikiPageById(client, "1")).resolves.toEqual(page);
	});

	it("throws NotFoundError when the row is missing", async () => {
		const { client } = mockClient({ data: null, error: null });
		await expect(getWikiPageById(client, "404")).rejects.toBeInstanceOf(
			NotFoundError,
		);
	});

	it("throws AppError on a query error", async () => {
		const { client } = mockClient({
			data: null,
			error: { message: "db down" },
		});
		await expect(getWikiPageById(client, "1")).rejects.toBeInstanceOf(AppError);
	});
});

describe("createWikiPage", () => {
	it("returns the created page and inserts the body", async () => {
		const { client, from, builder } = mockClient({ data: page, error: null });
		await expect(createWikiPage(client, dto)).resolves.toEqual(page);
		expect(from).toHaveBeenCalledWith("wiki_pages");
		expect(builder.insert).toHaveBeenCalledWith(dto);
	});

	it("throws AppError on a query error", async () => {
		const { client } = mockClient({
			data: null,
			error: { message: "db down" },
		});
		await expect(createWikiPage(client, dto)).rejects.toBeInstanceOf(AppError);
	});
});

describe("updateWikiPage", () => {
	it("returns the updated page and updates by id", async () => {
		const { client, builder } = mockClient({ data: page, error: null });
		await expect(updateWikiPage(client, "1", dto)).resolves.toEqual(page);
		expect(builder.update).toHaveBeenCalledWith(dto);
		expect(builder.eq).toHaveBeenCalledWith("id", "1");
	});

	it("throws AppError on a query error", async () => {
		const { client } = mockClient({
			data: null,
			error: { message: "db down" },
		});
		await expect(updateWikiPage(client, "1", dto)).rejects.toBeInstanceOf(
			AppError,
		);
	});
});

describe("deleteWikiPage", () => {
	it("resolves and deletes by id", async () => {
		const { client, builder } = mockClient({ data: null, error: null });
		await expect(deleteWikiPage(client, "1")).resolves.toBeUndefined();
		expect(builder.delete).toHaveBeenCalled();
		expect(builder.eq).toHaveBeenCalledWith("id", "1");
	});

	it("throws AppError on a query error", async () => {
		const { client } = mockClient({
			data: null,
			error: { message: "db down" },
		});
		await expect(deleteWikiPage(client, "1")).rejects.toBeInstanceOf(AppError);
	});
});

describe("deleteWikiPageByUrlName", () => {
	it("resolves and deletes by url_name", async () => {
		const { client, builder } = mockClient({ data: null, error: null });
		await expect(
			deleteWikiPageByUrlName(client, "intro"),
		).resolves.toBeUndefined();
		expect(builder.eq).toHaveBeenCalledWith("url_name", "intro");
	});

	it("throws AppError on a query error", async () => {
		const { client } = mockClient({
			data: null,
			error: { message: "db down" },
		});
		await expect(
			deleteWikiPageByUrlName(client, "intro"),
		).rejects.toBeInstanceOf(AppError);
	});
});
