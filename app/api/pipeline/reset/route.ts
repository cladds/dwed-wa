import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: operative } = await supabase
    .from("operatives")
    .select("rank")
    .eq("discord_id", user.user_metadata.provider_id ?? user.id)
    .single();

  if (!operative || operative.rank !== "director") {
    return NextResponse.json({ error: "Director rank required" }, { status: 403 });
  }

  // Delete in order (foreign keys)
  const { count: commentsDeleted } = await supabase.from("theory_comments").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Unlink leads from theories first
  await supabase.from("extracted_leads").update({ theory_id: null, status: "unreviewed" }).neq("id", "00000000-0000-0000-0000-000000000000");

  const { count: leadsDeleted } = await supabase.from("extracted_leads").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { count: theoriesDeleted } = await supabase.from("theories").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Reset forum posts as unprocessed
  const { count: postsReset } = await supabase
    .from("forum_posts")
    .update({ ai_processed: false, ai_processed_at: null })
    .eq("ai_processed", true);

  return NextResponse.json({
    leadsDeleted: leadsDeleted ?? 0,
    theoriesDeleted: theoriesDeleted ?? 0,
    postsReset: postsReset ?? 0,
    commentsDeleted: commentsDeleted ?? 0,
  });
}
