import { describe, expect, it } from "vitest";
import { parseWikiPageInput } from "@/app/actions/wiki-schema";
import { AppError } from "@/app/lib/errors";
import { WikiPageType } from "@/app/types";

const valid = {
	title: "T",
	content: "C",
	url_name: "slug",
	type: WikiPageType.WIKI,
};

describe("parseWikiPageInput", () => {
	it("accepts valid input", () => {
		expect(parseWikiPageInput(valid).url_name).toBe("slug");
	});
	it("accepts empty content", () => {
		expect(parseWikiPageInput({ ...valid, content: "" }).content).toBe("");
	});
	it("rejects empty title / url_name", () => {
		expect(() => parseWikiPageInput({ ...valid, title: "" })).toThrow(AppError);
		expect(() => parseWikiPageInput({ ...valid, url_name: "" })).toThrow(
			AppError,
		);
	});
	it("rejects an unknown type", () => {
		expect(() => parseWikiPageInput({ ...valid, type: "bogus" })).toThrow(
			AppError,
		);
	});
	it("passes through optional created_by/last_modified_by", () => {
		const r = parseWikiPageInput({
			...valid,
			created_by: "u1",
			last_modified_by: "u1",
		});
		expect(r.created_by).toBe("u1");
		expect(r.last_modified_by).toBe("u1");
	});
});
