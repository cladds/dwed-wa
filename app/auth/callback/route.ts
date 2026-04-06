import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if operative record exists, create if not
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existing } = await supabase
          .from("operatives")
          .select("id")
          .eq("discord_id", user.user_metadata.provider_id ?? user.id)
          .single();

        if (!existing) {
          const cmdrName = user.user_metadata.full_name
            ?? user.user_metadata.name
            ?? user.user_metadata.preferred_username
            ?? "CMDR Unknown";

          await supabase.from("operatives").insert({
            discord_id: user.user_metadata.provider_id ?? user.id,
            cmdr_name: cmdrName,
          });
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
