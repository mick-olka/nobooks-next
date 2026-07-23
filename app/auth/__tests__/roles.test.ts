import { describe, expect, it } from "vitest";
import { canEditContent, parseRole } from "@/app/auth/roles";
import { UserRole } from "@/app/types";

describe("parseRole", () => {
	it("returns the matching role for a valid string", () => {
		expect(parseRole("admin")).toBe(UserRole.ADMIN);
		expect(parseRole("moderator")).toBe(UserRole.MODERATOR);
		expect(parseRole("user")).toBe(UserRole.USER);
	});

	it("defaults to USER for unknown, null, or non-string input", () => {
		expect(parseRole("superadmin")).toBe(UserRole.USER);
		expect(parseRole(null)).toBe(UserRole.USER);
		expect(parseRole(undefined)).toBe(UserRole.USER);
		expect(parseRole(42)).toBe(UserRole.USER);
	});
});

describe("canEditContent", () => {
	it("allows admin and moderator, denies user", () => {
		expect(canEditContent(UserRole.ADMIN)).toBe(true);
		expect(canEditContent(UserRole.MODERATOR)).toBe(true);
		expect(canEditContent(UserRole.USER)).toBe(false);
	});
});
