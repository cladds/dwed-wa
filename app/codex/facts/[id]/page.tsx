import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmed", color: "border-status-success text-status-success" },
  unconfirmed: { label: "Unconfirmed", color: "border-gold text-gold" },
  debunked: { label: "Debunked", color: "border-status-danger text-status-danger" },
  rumour: { label: "Rumour", color: "border-text-dim text-text-dim" },
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  developer: "Developer Statement",
  in_game: "In-Game Source",
  novel: "Canonical Novel",
  community: "Community Research",
};

interface FactDetailProps {
  params: { id: string };
}

export default async function FactDetailPage({ params }: FactDetailProps) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: fact } = await supabase
    .from("confirmed_facts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!fact) notFound();

  // Get theories linked to this fact
  const { data: linkedTheoriesRaw } = await supabase
    .from("theory_fact_links")
    .select("id, relationship, notes, theory:theories(id, title, slug, status)")
    .eq("fact_id", fact.id);

  interface LinkedTheoryRow {
    id: string;
    relationship: string;
    notes: string | null;
    theory: { id: string; title: string; slug: string; status: string } | null;
  }

  const linkedTheories = (linkedTheoriesRaw ?? []).map(row => {
    const r = row as unknown as { id: string; relationship: string; notes: string | null; theory: unknown };
    const theory = Array.isArray(r.theory) ? r.theory[0] : r.theory;
    return { id: r.id, relationship: r.relationship, notes: r.notes, theory } as LinkedTheoryRow;
  });

  const style = STATUS_STYLES[fact.status] ?? STATUS_STYLES.confirmed;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/codex/facts" className="font-system text-text-dim text-xs hover:text-gold transition-colors">
          &lt; Back to What We Know
        </Link>
      </div>

      <div className="border border-border bg-bg-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className={`font-system text-[10px] tracking-wider uppercase border px-2.5 py-1 ${style.color}`}>
            {style.label}
          </span>
          <span className="font-system text-text-faint text-[10px] bg-bg-hover px-2.5 py-1">
            {SOURCE_TYPE_LABELS[fact.source_type] ?? fact.source_type}
          </span>
        </div>

        <h1 className="font-heading text-xl text-gold tracking-wide mb-4">
          {fact.title}
        </h1>

        <p className="font-body text-text-primary text-base leading-relaxed whitespace-pre-wrap">
          {fact.description}
        </p>
      </div>

      {/* Source details */}
      <div className="border border-border bg-bg-card p-6 mb-6">
        <h2 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase mb-4">
          Source Details
        </h2>
        <div className="space-y-3">
          {fact.source_person && (
            <div className="flex justify-between items-start">
              <span className="font-system text-text-dim text-xs">Source</span>
              <span className="font-body text-text-primary text-sm text-right">{fact.source_person}</span>
            </div>
          )}
          <div className="flex justify-between items-start">
            <span className="font-system text-text-dim text-xs">Type</span>
            <span className="font-body text-text-primary text-sm">{SOURCE_TYPE_LABELS[fact.source_type] ?? fact.source_type}</span>
          </div>
          {fact.source_date && (
            <div className="flex justify-between items-start">
              <span className="font-system text-text-dim text-xs">Date</span>
              <span className="font-system text-text-primary text-sm">{fact.source_date}</span>
            </div>
          )}
          {fact.source_url && (
            <div className="flex justify-between items-start">
              <span className="font-system text-text-dim text-xs">Reference</span>
              <a
                href={fact.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-system text-coord-blue text-sm hover:underline truncate max-w-[60%] text-right"
              >
                {fact.source_url.length > 50 ? fact.source_url.substring(0, 48) + "..." : fact.source_url}
              </a>
            </div>
          )}
          {(fact.systems_mentioned ?? []).length > 0 && (
            <div className="flex justify-between items-start">
              <span className="font-system text-text-dim text-xs">Systems</span>
              <div className="flex gap-2 flex-wrap justify-end">
                {fact.systems_mentioned.map((sys: string) => (
                  <Link
                    key={sys}
                    href={`/theories?q=${encodeURIComponent(sys)}`}
                    className="font-system text-coord-blue text-[10px] bg-coord-blue/10 px-2 py-0.5 hover:bg-coord-blue/20 transition-colors"
                  >
                    {sys}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between items-start">
            <span className="font-system text-text-dim text-xs">Added to darkwheel</span>
            <span className="font-system text-text-faint text-sm">{new Date(fact.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Linked theories */}
      {linkedTheories && linkedTheories.length > 0 && (
        <div className="border border-border bg-bg-card mb-6">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase">
              Linked Theories ({linkedTheories.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {linkedTheories.map((link) => {
              const theory = link.theory;
              if (!theory) return null;
              const relColor = link.relationship === "supports" ? "text-status-success" :
                link.relationship === "contradicts" ? "text-status-danger" : "text-text-dim";
              return (
                <Link
                  key={link.id}
                  href={`/theories/${theory.slug}`}
                  className="block px-5 py-3 hover:bg-bg-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-system text-[9px] tracking-wider uppercase ${relColor}`}>
                      {link.relationship}
                    </span>
                    <span className="font-body text-text-primary text-sm">{theory.title}</span>
                  </div>
                  {link.notes && (
                    <p className="font-system text-text-faint text-[10px] mt-1 ml-[70px]">{link.notes}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
