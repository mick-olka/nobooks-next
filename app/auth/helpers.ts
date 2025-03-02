import { createClient } from "@/app/utils/supabase/server";
import { redirect } from "next/navigation";

export const checkUserProtected = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  return data.user;
};

export const checkIfAuthorized = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return null;
  }

  return data.user;
};
