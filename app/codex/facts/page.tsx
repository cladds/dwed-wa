import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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
    const accentColor = fact.status === "confirmed" ? "bg-status-success/60" :
      fact.status === "debunked" ? "bg-status-danger/60" : "bg-text-dim/40";
    return (
      <Link href={`/codex/facts/${fact.id}`} className="block hover:bg-bg-hover transition-colors group">
        <div className="flex h-full">
          <div className={`w-[3px] ${accentColor} shrink-0`} />
          <div className="p-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {fact.source_person && (
                <span className="font-system text-gold/70 text-[9px]">
                  {fact.source_person}
                </span>
              )}
              {fact.source_date && (
                <span className="font-system text-text-faint text-[9px]">
                  {fact.source_date}
                </span>
              )}
              {fact.source_url && (
                <span className="font-system text-coord-blue text-[9px] ml-auto">source</span>
              )}
            </div>
            <h3 className="font-body text-text-primary text-sm mb-2 group-hover:text-gold transition-colors leading-snug">{fact.title}</h3>
            <p className="font-body text-text-dim text-xs leading-relaxed line-clamp-2 italic">{fact.description}</p>
          </div>
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
      <div className="grid grid-cols-3 gap-px bg-border mb-8 border border-border">
        <div className="bg-bg-card p-4 text-center">
          <p className="font-heading text-status-success text-xl mb-0.5">{confirmed.length}</p>
          <p className="font-ui text-status-success/60 text-[9px] tracking-[0.2em] uppercase">Confirmed</p>
        </div>
        <div className="bg-bg-card p-4 text-center">
          <p className="font-heading text-status-danger text-xl mb-0.5">{debunked.length}</p>
          <p className="font-ui text-status-danger/60 text-[9px] tracking-[0.2em] uppercase">Debunked</p>
        </div>
        <div className="bg-bg-card p-4 text-center">
          <p className="font-heading text-text-dim text-xl mb-0.5">{rumours.length}</p>
          <p className="font-ui text-text-faint text-[9px] tracking-[0.2em] uppercase">Rumours</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-border">
                  {confirmedByType[sourceType].map((f, i) => (
                    <div key={f.id} className={`${i % 2 === 0 ? "md:border-r border-border" : ""} ${Math.floor(i / 2) < Math.floor((confirmedByType[sourceType].length - 1) / 2) ? "md:border-b md:border-border" : ""}`}>
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
          <div className="border border-status-danger/20 bg-bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-border">
              {debunked.map((f, i) => (
                <div key={f.id} className={`${i % 2 === 0 ? "md:border-r border-border" : ""} ${Math.floor(i / 2) < Math.floor((debunked.length - 1) / 2) ? "md:border-b md:border-border" : ""}`}>
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
          <div className="border border-border bg-bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-border">
              {rumours.map((f, i) => (
                <div key={f.id} className={`${i % 2 === 0 ? "md:border-r border-border" : ""} ${Math.floor(i / 2) < Math.floor((rumours.length - 1) / 2) ? "md:border-b md:border-border" : ""}`}>
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
