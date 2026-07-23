import "@testing-library/jest-dom/vitest";

// Set up minimal environment variables for tests
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
	process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
}
if (!process.env.NEXT_PUBLIC_APP_URL) {
	process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
}
