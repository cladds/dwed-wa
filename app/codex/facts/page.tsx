import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmed", color: "border-status-success text-status-success" },
  unconfirmed: { label: "Unconfirmed", color: "border-gold text-gold" },
  debunked: { label: "Debunked", color: "border-status-danger text-status-danger" },
  rumour: { label: "Rumour", color: "border-text-dim text-text-dim" },
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  developer: "Developer",
  in_game: "In-Game",
  novel: "Novel",
  community: "Community",
};

export default async function ConfirmedFactsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: facts } = await supabase
    .from("confirmed_facts")
    .select("*")
    .order("sort_order", { ascending: true });

  // Group by status
  const confirmed = (facts ?? []).filter(f => f.status === "confirmed");
  const debunked = (facts ?? []).filter(f => f.status === "debunked");
  const rumours = (facts ?? []).filter(f => f.status === "rumour" || f.status === "unconfirmed");

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

  function FactCard({ fact }: { fact: typeof confirmed[0] }) {
    const style = STATUS_STYLES[fact.status] ?? STATUS_STYLES.confirmed;
    return (
      <div className="border border-border bg-bg-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className={`font-system text-[9px] tracking-wider uppercase border px-2 py-0.5 ${style.color}`}>
            {style.label}
          </span>
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
          <span className="font-system text-text-faint text-[9px] bg-bg-hover px-2 py-0.5">
            {SOURCE_TYPE_LABELS[fact.source_type] ?? fact.source_type}
          </span>
        </div>
        <h3 className="font-body text-text-primary text-base mb-2">{fact.title}</h3>
        <p className="font-body text-text-mid text-sm leading-relaxed">{fact.description}</p>
        {fact.source_url && (
          <a
            href={fact.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-system text-coord-blue text-[10px] hover:underline mt-3 inline-block"
          >
            View source
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
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

      {confirmed.length > 0 && (
        <div className="mb-10">
          <h2 className="font-ui text-status-success text-[10px] tracking-[0.25em] uppercase mb-4 border-b border-border pb-2">
            Confirmed ({confirmed.length})
          </h2>
          <div className="space-y-4">
            {confirmed.map(f => <FactCard key={f.id} fact={f} />)}
          </div>
        </div>
      )}

      {debunked.length > 0 && (
        <div className="mb-10">
          <h2 className="font-ui text-status-danger text-[10px] tracking-[0.25em] uppercase mb-4 border-b border-border pb-2">
            Debunked ({debunked.length})
          </h2>
          <div className="space-y-4">
            {debunked.map(f => <FactCard key={f.id} fact={f} />)}
          </div>
        </div>
      )}

      {rumours.length > 0 && (
        <div className="mb-10">
          <h2 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase mb-4 border-b border-border pb-2">
            Unverified Rumours ({rumours.length})
          </h2>
          <div className="space-y-4">
            {rumours.map(f => <FactCard key={f.id} fact={f} />)}
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
