import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  open_lead: "Open Lead",
  under_investigation: "Under Investigation",
  promising: "Promising",
  verified: "Verified",
  disproven: "Disproven",
  dead_end: "Dead End",
  cold: "Cold",
};

const STATUS_COLORS: Record<string, string> = {
  open_lead: "border-gold bg-gold/10 text-gold",
  under_investigation: "border-purple-400 bg-purple-400/10 text-purple-400",
  promising: "border-coord-blue bg-coord-blue/10 text-coord-blue",
  verified: "border-status-success bg-status-success/10 text-status-success",
  disproven: "border-status-danger bg-status-danger/10 text-status-danger",
  dead_end: "border-text-dim bg-text-dim/10 text-text-dim",
  cold: "border-[#5a6a7a] bg-[#5a6a7a]/10 text-[#5a6a7a]",
};

export default async function DossiersPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: dossiers } = await supabase
    .from("dossiers")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-xl text-gold tracking-wide">
          Leads
        </h1>
        <Link
          href="/submit/dossier"
          className="font-ui text-[10px] tracking-[0.15em] uppercase bg-gold/10 border border-gold/30 text-gold px-4 py-2 hover:bg-gold/20 transition-colors"
        >
          + New Lead
        </Link>
      </div>

      {dossiers && dossiers.length > 0 ? (
        <div className="space-y-3">
          {dossiers.map((d) => (
            <Link
              key={d.id}
              href={`/dossiers/${d.slug}`}
              className="block border border-border bg-bg-card hover:bg-bg-hover transition-colors"
            >
              <div className="px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`font-system text-[9px] tracking-wider uppercase border px-2 py-0.5 ${STATUS_COLORS[d.status] ?? ""}`}>
                    {STATUS_LABELS[d.status] ?? d.status}
                  </span>
                  <span className="font-system text-text-faint text-[9px]">
                    Strength: {d.evidence_strength}/5
                  </span>
                  {d.original_author && (
                    <span className="font-system text-text-faint text-[9px]">
                      via {d.original_author}
                    </span>
                  )}
                </div>
                <h2 className="font-body text-text-primary text-base mb-1">{d.title}</h2>
                <p className="font-body text-text-dim text-sm line-clamp-2">{d.hypothesis}</p>
                <div className="flex items-center gap-3 mt-3">
                  {d.tags?.map((tag: string) => (
                    <span key={tag} className="font-system text-text-faint text-[9px] bg-bg-hover px-2 py-0.5">
                      {tag}
                    </span>
                  ))}
                  <span className="font-system text-text-faint text-[9px] ml-auto">
                    {new Date(d.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-border bg-bg-card p-8 flex items-center justify-center min-h-[200px]">
          <p className="font-system text-text-dim text-xs">
            {"// no leads submitted yet -- import from forum archive or create new"}
          </p>
        </div>
      )}
    </div>
  );
}
