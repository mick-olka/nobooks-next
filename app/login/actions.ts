"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/app/utils/supabase/server";

export const logout = async () => {
	const supabase = await createClient();
	await supabase.auth.signOut();
	redirect("/login");
};

export const signInWithDiscord = async () => {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "discord",
		options: {
			redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
		},
	});
	if (error) {
		console.error("Error signing in with Discord", error);
		return;
	}
	if (data?.url) redirect(data.url);
};
