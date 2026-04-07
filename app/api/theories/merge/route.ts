import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: operative } = await supabase
    .from("operatives")
    .select("rank")
    .eq("discord_id", user.user_metadata.provider_id ?? user.id)
    .single();

  if (!operative || !["lead_investigator", "director"].includes(operative.rank)) {
    return NextResponse.json({ error: "Insufficient rank" }, { status: 403 });
  }

  const body = await request.json();
  const { sourceId, targetId } = body as { sourceId: string; targetId: string };

  if (!sourceId || !targetId || sourceId === targetId) {
    return NextResponse.json({ error: "Invalid merge params" }, { status: 400 });
  }

  // Move all extracted_leads from source to target
  await supabase
    .from("extracted_leads")
    .update({ theory_id: targetId })
    .eq("theory_id", sourceId);

  // Move comments
  await supabase
    .from("theory_comments")
    .update({ theory_id: targetId })
    .eq("theory_id", sourceId);

  // Get source theory's systems to merge
  const { data: source } = await supabase
    .from("theories")
    .select("systems_mentioned")
    .eq("id", sourceId)
    .single();

  const { data: target } = await supabase
    .from("theories")
    .select("systems_mentioned")
    .eq("id", targetId)
    .single();

  if (source && target) {
    const mergedSystems = Array.from(new Set([
      ...(target.systems_mentioned ?? []),
      ...(source.systems_mentioned ?? []),
    ]));

    await supabase
      .from("theories")
      .update({ systems_mentioned: mergedSystems })
      .eq("id", targetId);
  }

  // Update target counts
  const { count: leadCount } = await supabase
    .from("extracted_leads")
    .select("id", { count: "exact", head: true })
    .eq("theory_id", targetId);

  await supabase
    .from("theories")
    .update({
      evidence_count: leadCount ?? 0,
      source_post_count: leadCount ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetId);

  // Delete the source theory
  await supabase.from("theories").delete().eq("id", sourceId);

  return NextResponse.json({ merged: true, targetId });
}
