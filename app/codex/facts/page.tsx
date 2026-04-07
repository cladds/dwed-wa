import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const STATUS_STYLES: Record<string, { label: string; color: string; borderColor: string }> = {
  confirmed: { label: "Confirmed", color: "border-status-success text-status-success", borderColor: "border-status-success/30" },
  unconfirmed: { label: "Unconfirmed", color: "border-gold text-gold", borderColor: "border-gold/30" },
  debunked: { label: "Debunked", color: "border-status-danger text-status-danger", borderColor: "border-status-danger/30" },
  rumour: { label: "Rumour", color: "border-text-dim text-text-dim", borderColor: "border-border" },
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  developer: "Developer Statements",
  in_game: "In-Game Sources",
  novel: "Canonical Novels",
  community: "Community Research",
};

const SOURCE_TYPE_ORDER = ["developer", "in_game", "novel", "community"];

interface Fact {
  id: string;
  title: string;
  description: string;
  source_person: string | null;
  source_type: string;
  source_url: string | null;
  source_date: string | null;
  status: string;
  sort_order: number;
  systems_mentioned: string[];
  created_at: string;
  updated_at: string;
}

export default async function ConfirmedFactsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: facts } = await supabase
    .from("confirmed_facts")
    .select("*")
    .order("sort_order", { ascending: true });

  const allFacts = (facts ?? []) as Fact[];
  const confirmed = allFacts.filter(f => f.status === "confirmed");
  const debunked = allFacts.filter(f => f.status === "debunked");
  const rumours = allFacts.filter(f => f.status === "rumour" || f.status === "unconfirmed");

  // Sub-group confirmed by source type
  const confirmedByType: Record<string, Fact[]> = {};
  for (const f of confirmed) {
    const key = f.source_type;
    if (!confirmedByType[key]) confirmedByType[key] = [];
    confirmedByType[key].push(f);
  }

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

  function FactCard({ fact }: { fact: Fact }) {
    const style = STATUS_STYLES[fact.status] ?? STATUS_STYLES.confirmed;
    return (
      <Link href={`/codex/facts/${fact.id}`} className={`block border ${style.borderColor} bg-bg-card hover:bg-bg-hover transition-colors group`}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {fact.source_person && (
              <span className="font-system text-text-faint text-[9px]">
                {fact.source_person}
              </span>
            )}
            {fact.source_date && (
              <span className="font-system text-text-faint text-[9px]">
                {fact.source_date}
              </span>
            )}
          </div>
          <h3 className="font-body text-text-primary text-sm mb-1.5 group-hover:text-gold transition-colors leading-snug">{fact.title}</h3>
          <p className="font-body text-text-mid text-xs leading-relaxed line-clamp-2">{fact.description}</p>
          {fact.source_url && (
            <p className="font-system text-coord-blue text-[9px] mt-2">source</p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/codex" className="font-system text-text-dim text-xs hover:text-gold transition-colors">
          &lt; Back to Codex
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-xl text-gold tracking-wide">
            What We Know
          </h1>
          <p className="font-body text-text-mid text-sm mt-1">
            Verified facts, debunked claims, and persistent rumours. Every theory on darkwheel.space is measured against these.
          </p>
        </div>
        {canEdit && (
          <Link
            href="/admin/facts"
            className="font-ui text-[10px] tracking-[0.15em] uppercase border border-gold/30 text-gold px-4 py-2 hover:bg-gold/10 transition-colors"
          >
            + Add Fact
          </Link>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-status-success/20 bg-bg-card p-4 text-center">
          <p className="font-system text-status-success text-2xl mb-1">{confirmed.length}</p>
          <p className="font-ui text-text-dim text-[9px] tracking-[0.2em] uppercase">Confirmed</p>
        </div>
        <div className="border border-status-danger/20 bg-bg-card p-4 text-center">
          <p className="font-system text-status-danger text-2xl mb-1">{debunked.length}</p>
          <p className="font-ui text-text-dim text-[9px] tracking-[0.2em] uppercase">Debunked</p>
        </div>
        <div className="border border-border bg-bg-card p-4 text-center">
          <p className="font-system text-text-dim text-2xl mb-1">{rumours.length}</p>
          <p className="font-ui text-text-dim text-[9px] tracking-[0.2em] uppercase">Rumours</p>
        </div>
      </div>

      {/* Confirmed facts grouped by source type */}
      {confirmed.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 bg-status-success" />
            <h2 className="font-ui text-status-success text-[10px] tracking-[0.25em] uppercase">
              Confirmed Facts ({confirmed.length})
            </h2>
            <div className="flex-1 border-b border-status-success/20" />
          </div>

          {SOURCE_TYPE_ORDER.filter(t => confirmedByType[t]?.length).map(sourceType => (
            <div key={sourceType} className="mb-8">
              <div className="border border-border">
                <div className="px-4 py-2.5 bg-bg-card border-b border-border">
                  <h3 className="font-ui text-text-dim text-[9px] tracking-[0.25em] uppercase">
                    {SOURCE_TYPE_LABELS[sourceType] ?? sourceType} ({confirmedByType[sourceType].length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {confirmedByType[sourceType].map((f, i) => (
                    <div key={f.id} className={`${i % 2 === 0 && confirmedByType[sourceType].length > 1 ? "md:border-r md:border-border" : ""} ${i < confirmedByType[sourceType].length - (confirmedByType[sourceType].length % 2 === 0 ? 2 : 1) ? "border-b border-border" : i === confirmedByType[sourceType].length - 2 && confirmedByType[sourceType].length % 2 === 0 ? "border-b border-border" : ""}`}>
                      <FactCard fact={f} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Debunked */}
      {debunked.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 bg-status-danger" />
            <h2 className="font-ui text-status-danger text-[10px] tracking-[0.25em] uppercase">
              Debunked Claims ({debunked.length})
            </h2>
            <div className="flex-1 border-b border-status-danger/20" />
          </div>
          <div className="border border-status-danger/20">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {debunked.map((f, i) => (
                <div key={f.id} className={`${i % 2 === 0 && debunked.length > 1 ? "md:border-r md:border-border" : ""} ${i < debunked.length - 2 ? "border-b border-border" : ""}`}>
                  <FactCard fact={f} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rumours */}
      {rumours.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 bg-text-dim" />
            <h2 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">
              Unverified Rumours ({rumours.length})
            </h2>
            <div className="flex-1 border-b border-border" />
          </div>
          <div className="border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {rumours.map((f, i) => (
                <div key={f.id} className={`${i % 2 === 0 && rumours.length > 1 ? "md:border-r md:border-border" : ""} ${i < rumours.length - 2 ? "border-b border-border" : ""}`}>
                  <FactCard fact={f} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(!facts || facts.length === 0) && (
        <div className="border border-border bg-bg-card p-12 text-center">
          <p className="font-system text-text-dim text-xs">{"// no confirmed facts recorded yet"}</p>
        </div>
      )}
    </div>
  );
}
