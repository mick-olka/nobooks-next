import { describe, expect, it } from "vitest";
import { constants } from "@/app/utils/constants";

describe("test harness", () => {
	it("runs and resolves the @ alias environment", () => {
		expect(1 + 1).toBe(2);
	});

	it("resolves the @/ alias to a real module", () => {
		expect(typeof constants.SITE_URL).toBe("string");
	});
});
