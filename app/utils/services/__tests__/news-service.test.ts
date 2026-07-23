import { describe, expect, it } from "vitest";
import {
	formatDateForSlug,
	formatNewsContent,
	normalizeTelegramDate,
	normalizeTelegramMessage,
} from "@/app/utils/services/news-service";

describe("normalizeTelegramMessage", () => {
	it("trims and coerces missing to empty string", () => {
		expect(normalizeTelegramMessage("  hi  ")).toBe("hi");
		expect(normalizeTelegramMessage(undefined)).toBe("");
	});
});

describe("formatNewsContent", () => {
	it("returns the message alone when there is no image", () => {
		expect(formatNewsContent({ message: "hello" })).toBe("hello");
	});
	it("appends a markdown image when an image is present", () => {
		expect(formatNewsContent({ message: "hi", image: "https://x/y.png" })).toBe(
			"hi\n\n![Telegram image](https://x/y.png)",
		);
	});
});

describe("normalizeTelegramDate / formatDateForSlug", () => {
	it("parses a normal date string and formats a zero-padded slug", () => {
		const d = normalizeTelegramDate("2026-01-05 09:07:03");
		expect(formatDateForSlug(d)).toBe("2026-01-05-09-07-03");
	});
	it("falls back to a valid Date for a bad input (no throw)", () => {
		expect(normalizeTelegramDate("not-a-date")).toBeInstanceOf(Date);
	});
});
