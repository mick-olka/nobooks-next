import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/app/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";
  console.log(code);
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const forwardedProto = request.headers.get("x-forwarded-proto"); // protocol (http/https)
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}${next}`
        );
      }

      if (forwardedHost) {
        const protocol = forwardedProto || "https";
        return NextResponse.redirect(`${protocol}://${forwardedHost}${next}`);
      }

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/auth/auth-code-error`
  );
}
