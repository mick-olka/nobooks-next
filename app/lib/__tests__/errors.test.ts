import { describe, expect, it } from "vitest";
import { AppError, isNotFoundError, NotFoundError } from "@/app/lib/errors";

describe("errors", () => {
	it("AppError carries a message and name", () => {
		const err = new AppError("boom");
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe("AppError");
		expect(err.message).toBe("boom");
	});

	it("AppError preserves the cause", () => {
		const cause = new Error("root");
		const err = new AppError("wrapped", { cause });
		expect(err.cause).toBe(cause);
	});

	it("NotFoundError formats the resource and is an AppError", () => {
		const err = new NotFoundError("wiki page: intro");
		expect(err).toBeInstanceOf(AppError);
		expect(err.name).toBe("NotFoundError");
		expect(err.message).toBe("Not found: wiki page: intro");
	});

	it("isNotFoundError narrows correctly", () => {
		expect(isNotFoundError(new NotFoundError("x"))).toBe(true);
		expect(isNotFoundError(new AppError("x"))).toBe(false);
		expect(isNotFoundError(new Error("x"))).toBe(false);
	});
});
