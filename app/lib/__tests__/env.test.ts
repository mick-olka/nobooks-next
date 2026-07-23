import { describe, expect, it } from "vitest";
import { parseEnv } from "@/app/lib/env";
import { AppError } from "@/app/lib/errors";

const valid = {
	NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
	NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
	NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
	it("accepts a valid minimal environment", () => {
		const env = parseEnv(valid);
		expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
		expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
	});

	it("keeps optional values when present", () => {
		const env = parseEnv({ ...valid, CRON_SECRET: "s3cret" });
		expect(env.CRON_SECRET).toBe("s3cret");
	});

	it("throws AppError when a required var is missing", () => {
		const { NEXT_PUBLIC_SUPABASE_URL, ...rest } = valid;
		expect(() => parseEnv(rest)).toThrow(AppError);
		expect(() => parseEnv(rest)).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
	});

	it("throws when a URL var is not a URL", () => {
		expect(() =>
			parseEnv({ ...valid, NEXT_PUBLIC_APP_URL: "not-a-url" }),
		).toThrow(AppError);
	});
});
