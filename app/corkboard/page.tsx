import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Corkboard } from "@/components/corkboard/Corkboard";

export default async function CorkboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: theories } = await supabase
    .from("theories")
    .select("id, title, status, category, slug, evidence_count")
    .order("evidence_count", { ascending: false });

  const { data: links } = await supabase
    .from("theory_links")
    .select("id, theory_a_id, theory_b_id, reason");

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
        <p className="font-system text-text-dim text-xs">
          Theory connections and investigation threads
        </p>
      </div>
      <div className="border border-border bg-bg-card" style={{ height: "calc(100vh - 160px)" }}>
        <Corkboard theories={theories ?? []} links={links ?? []} canEdit={canEdit} />
      </div>
    </div>
  );
}
