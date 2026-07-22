import { describe, expect, it } from "vitest";
import { isProtectedPath } from "@/app/auth/protected-paths";

describe("isProtectedPath", () => {
	it("protects /profile and nested paths", () => {
		expect(isProtectedPath("/profile")).toBe(true);
		expect(isProtectedPath("/profile/settings")).toBe(true);
	});

	it("leaves public content open", () => {
		expect(isProtectedPath("/")).toBe(false);
		expect(isProtectedPath("/wiki/intro")).toBe(false);
		expect(isProtectedPath("/rules")).toBe(false);
		expect(isProtectedPath("/stats")).toBe(false);
		expect(isProtectedPath("/login")).toBe(false);
	});

	it("does not treat a prefix substring as protected", () => {
		expect(isProtectedPath("/profiles-public")).toBe(false);
	});
});
