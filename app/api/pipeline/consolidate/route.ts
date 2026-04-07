import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: theories } = await supabase
    .from("theories")
    .select("id, title, evidence_count, priority")
    .order("evidence_count", { ascending: false });

  if (!theories || theories.length === 0) {
    return NextResponse.json({ prioritized: 0, totalTheories: 0 });
  }

  // Auto-prioritize based on evidence count
  let prioritized = 0;
  for (const theory of theories) {
    if ((theory.priority ?? 0) > 0) continue;
    let autoPriority = 0;
    if (theory.evidence_count >= 30) autoPriority = 75;
    else if (theory.evidence_count >= 15) autoPriority = 50;
    else if (theory.evidence_count >= 5) autoPriority = 25;

    if (autoPriority > 0) {
      await supabase.from("theories").update({ priority: autoPriority }).eq("id", theory.id);
      prioritized++;
    }
  }

  return NextResponse.json({ prioritized, totalTheories: theories.length });
}
