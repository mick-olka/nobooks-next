import { redirect } from "next/navigation";
import { parseRole } from "@/app/auth/roles";
import type { UserAccount, UserRole } from "@/app/types";
import { createClient } from "@/app/utils/supabase/server";

async function loadUser(): Promise<UserAccount | null> {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getUser();
	if (error || !data.user) return null;

	const { data: role } = await supabase.rpc("get_user_role");
	return {
		...data.user,
		user_role: parseRole(role),
		name:
			data.user.user_metadata?.custom_claims?.global_name ||
			data.user.email ||
			data.user.id,
	};
}

/** Returns the signed-in user or null. Never redirects. */
export async function getUser(): Promise<UserAccount | null> {
	return loadUser();
}

/** Requires a signed-in user; redirects to /login otherwise. */
export async function requireUser(): Promise<UserAccount> {
	const user = await loadUser();
	if (!user) redirect("/login");
	return user;
}

/** Requires one of the given roles; redirects home if lacking, /login if signed out. */
export async function requireRole(...roles: UserRole[]): Promise<UserAccount> {
	const user = await loadUser();
	if (!user) redirect("/login");
	if (!roles.includes(user.user_role)) redirect("/");
	return user;
}
