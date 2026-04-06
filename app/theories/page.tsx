import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  open_lead: "Open Lead",
  under_investigation: "Investigating",
  promising: "Promising",
  verified: "Verified",
  disproven: "Disproven",
  dead_end: "Dead End",
};

const STATUS_COLORS: Record<string, string> = {
  open_lead: "border-gold text-gold",
  under_investigation: "border-purple-400 text-purple-400",
  promising: "border-coord-blue text-coord-blue",
  verified: "border-status-success text-status-success",
  disproven: "border-status-danger text-status-danger",
  dead_end: "border-text-dim text-text-dim",
};

const CATEGORY_COLORS: Record<string, string> = {
  theory: "text-gold",
  system: "text-coord-blue",
  evidence: "text-status-success",
  lore: "text-status-warning",
  mechanic: "text-text-primary",
};

interface TheoriesPageProps {
  searchParams: { source?: string };
}

export default async function TheoriesPage({ searchParams }: TheoriesPageProps) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const source = searchParams.source ?? "all";

  let query = supabase
    .from("theories")
    .select("*")
    .order("updated_at", { ascending: false });

  if (source === "open") query = query.eq("source", "open");
  if (source === "forum") query = query.eq("source", "forum");

  const { data: theories } = await query;

  const tabs = [
    { key: "all", label: "All Theories" },
    { key: "open", label: "Open Theories" },
    { key: "forum", label: "Forum Theories" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-xl text-gold tracking-wide">
          Theories
        </h1>
        <Link
          href="/submit/dossier"
          className="font-ui text-[10px] tracking-[0.15em] uppercase bg-gold/10 border border-gold/30 text-gold px-4 py-2 hover:bg-gold/20 transition-colors"
        >
          + New Theory
        </Link>
      </div>

      <div className="flex gap-1 mb-6">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/theories" : `/theories?source=${tab.key}`}
            className={`font-ui text-[10px] tracking-[0.15em] uppercase px-4 py-2 border transition-colors ${
              source === tab.key || (tab.key === "all" && source === "all")
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-border text-text-dim hover:text-text-primary hover:bg-bg-hover"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {theories && theories.length > 0 ? (
        <div className="space-y-3">
          {theories.map((t) => (
            <Link
              key={t.id}
              href={`/theories/${t.slug}`}
              className="block border border-border bg-bg-card hover:bg-bg-hover transition-colors"
            >
              <div className="px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`font-ui text-[9px] tracking-[0.2em] uppercase ${CATEGORY_COLORS[t.category] ?? "text-text-dim"}`}>
                    {t.category}
                  </span>
                  <span className={`font-system text-[9px] tracking-wider uppercase border px-2 py-0.5 ${STATUS_COLORS[t.status] ?? ""}`}>
                    {STATUS_LABELS[t.status] ?? t.status}
                  </span>
                  {t.source === "forum" && (
                    <span className="font-system text-text-faint text-[9px] bg-bg-hover px-2 py-0.5">
                      forum archive
                    </span>
                  )}
                  {t.source_post_count > 0 && (
                    <span className="font-system text-text-dim text-[9px]">
                      {t.source_post_count} posts
                    </span>
                  )}
                </div>
                <h2 className="font-body text-text-primary text-base mb-1">{t.title}</h2>
                <p className="font-body text-text-mid text-sm line-clamp-2">{t.summary}</p>
                {t.systems_mentioned.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {t.systems_mentioned.slice(0, 6).map((sys: string) => (
                      <span key={sys} className="font-system text-coord-blue text-[10px] bg-coord-blue/10 px-2 py-0.5">
                        {sys}
                      </span>
                    ))}
                    {t.systems_mentioned.length > 6 && (
                      <span className="font-system text-text-faint text-[10px]">
                        +{t.systems_mentioned.length - 6} more
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-3">
                  {t.original_author && (
                    <span className="font-system text-text-faint text-[9px]">
                      via {t.original_author}
                    </span>
                  )}
                  <span className="font-system text-text-faint text-[9px] ml-auto">
                    {new Date(t.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-border bg-bg-card p-8 text-center">
          <p className="font-system text-text-dim text-xs">
            {"// no theories yet -- import from forum archive or create new"}
          </p>
        </div>
      )}
    </div>
  );
}
