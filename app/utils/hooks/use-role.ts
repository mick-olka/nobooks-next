// import { useEffect, useState } from "react";
// import { createClient } from "@/app/utils/supabase/server";
// import type { UserRole } from "@/app/types";

export function useRole() {
	//   const supabase = createClient();
	//   const [role, setRole] = useState<UserRole | null>(null);
	//   const [loading, setLoading] = useState(true);
	//   useEffect(() => {
	//     async function getUserRole() {
	//       if (!user) {
	//         setRole(null);
	//         setLoading(false);
	//         return;
	//       }
	//       const { data, error } = await supabase
	//         .from("auth.users")
	//         .select("role")
	//         .eq("id", user.id)
	//         .single();
	//       if (error) {
	//         console.error("Error fetching user role:", error);
	//         return;
	//       }
	//       setRole(data.role);
	//       setLoading(false);
	//     }
	//     getUserRole();
	//   }, [user, supabase]);
	//   return { role, loading };
}
