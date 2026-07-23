import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/app/types";

export type UserAccount = User & {
	user_role: UserRole;
	name?: string;
};
