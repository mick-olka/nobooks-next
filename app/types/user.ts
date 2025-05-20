import type { UserRole } from "@/app/types";
import type { User } from "@supabase/supabase-js";

export type UserAccount = User & {
	user_role: UserRole;
	name?: string;
};
