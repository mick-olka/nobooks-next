import { type UserAccount, UserRole } from "@/app/types/index";
import { createClient } from "@/app/utils/supabase/server";
import { redirect } from "next/navigation";

export const getAuthorizedUser = async ({
	protectedPage,
	adminProtectedPage,
}: {
	protectedPage?: boolean;
	adminProtectedPage?: boolean;
} = {}): Promise<UserAccount | null> => {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getUser();
	let userRole = UserRole.USER;
	if (data.user) {
		const { data: role } = await supabase.rpc("get_user_role");
		userRole = role;
	}

	if (error || !data?.user) {
		if (protectedPage) {
			redirect("/login");
		} else return null;
	}

	if (adminProtectedPage && userRole !== UserRole.ADMIN) {
		redirect("/");
	}

	return {
		...data.user,
		user_role: userRole,
		name:
			data.user.user_metadata?.custom_claims?.global_name ||
			data.user.email ||
			data.user.id,
	};
};

// export const checkUserAdminProtected = async () => {
//   const supabase = await createClient();

//   const { data, error } = await supabase.auth.getUser();

//   if (error || !data?.user) {
//     redirect("/login");
//   }

//   if (data.user && data.user.role !== UserRole.ADMIN) {
//     redirect("/");
//   }

//   return data.user;
// };
