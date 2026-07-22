import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/lib/env", () => ({
	env: {
		NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
		NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
	},
}));

describe("createPublicClient", () => {
	it("returns a client exposing from()", async () => {
		const { createPublicClient } = await import("@/app/lib/supabase/public");
		const client = createPublicClient();
		expect(typeof client.from).toBe("function");
	});
});
