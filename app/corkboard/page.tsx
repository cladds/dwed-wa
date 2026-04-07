import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Corkboard } from "@/components/corkboard/Corkboard";
import { CorkboardAddTheory } from "@/components/corkboard/CorkboardAddTheory";

export default async function CorkboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Only show major theories: pinned (priority > 0), active investigation, or well-evidenced
  const { data: theories } = await supabase
    .from("theories")
    .select("id, title, status, category, slug, evidence_count, priority")
    .or("priority.gt.0,status.in.(under_investigation,promising,verified),evidence_count.gte.3")
    .order("priority", { ascending: false });

  const { data: links } = await supabase
    .from("theory_links")
    .select("id, theory_a_id, theory_b_id, reason");

  // Fetch confirmed facts for corkboard display
  const { data: facts } = await supabase
    .from("confirmed_facts")
    .select("id, title, status, source_person, source_type")
    .order("sort_order", { ascending: true });

  // Check if user can edit
  const { data: { user } } = await supabase.auth.getUser();
  let canEdit = false;
  if (user) {
    const { data: operative } = await supabase
      .from("operatives")
      .select("rank")
      .eq("discord_id", user.user_metadata.provider_id ?? user.id)
      .single();
    canEdit = ["lead_investigator", "director"].includes(operative?.rank ?? "");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-xl text-gold tracking-wide">
          Corkboard
        </h1>
        <div className="flex items-center gap-4">
          <p className="font-system text-text-dim text-xs hidden sm:block">
            Theory connections and investigation threads
          </p>
          {canEdit && <CorkboardAddTheory existingIds={(theories ?? []).map(t => t.id)} />}
        </div>
      </div>
      <div className="relative border border-border bg-bg-card" style={{ height: "calc(100vh - 160px)" }}>
        <Corkboard theories={theories ?? []} links={links ?? []} facts={facts ?? []} canEdit={canEdit} />
      </div>
    </div>
  );
}
