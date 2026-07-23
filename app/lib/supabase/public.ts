import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/app/lib/env";
import type { Database } from "@/app/lib/types/database.types";

export function createPublicClient() {
	return createSupabaseClient<Database>(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		{ auth: { persistSession: false } },
	);
}
