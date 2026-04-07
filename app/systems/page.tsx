import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { formatCoords } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  open_lead: "Open Lead",
  under_investigation: "Investigating",
  promising: "Promising",
  verified: "Verified",
  disproven: "Disproven",
  dead_end: "Dead End",
  cold: "Cold",
};

const STATUS_COLORS: Record<string, string> = {
  open_lead: "text-gold",
  under_investigation: "text-purple-400",
  promising: "text-coord-blue",
  verified: "text-status-success",
  disproven: "text-status-danger",
  dead_end: "text-text-dim",
  cold: "text-[#5a6a7a]",
};

export default async function SystemsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: systems } = await supabase
    .from("system_tickets")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-xl text-gold tracking-wide">
          Coordinate Registry
        </h1>
        <Link
          href="/submit/system"
          className="font-ui text-[10px] tracking-[0.15em] uppercase border border-border text-text-mid px-4 py-2 hover:bg-bg-hover transition-colors"
        >
          + Submit Coordinates
        </Link>
      </div>

      {systems && systems.length > 0 ? (
        <div className="border border-border bg-bg-card">
          <div className="grid grid-cols-[2fr_1fr_1fr_80px] px-5 py-2 border-b border-border">
            <span className="font-ui text-text-faint text-[9px] tracking-[0.2em] uppercase">System</span>
            <span className="font-ui text-text-faint text-[9px] tracking-[0.2em] uppercase">Coordinates</span>
            <span className="font-ui text-text-faint text-[9px] tracking-[0.2em] uppercase">Status</span>
            <span className="font-ui text-text-faint text-[9px] tracking-[0.2em] uppercase text-right">Score</span>
          </div>
          {systems.map((s) => (
            <Link
              key={s.id}
              href={`/systems/${s.id}`}
              className="grid grid-cols-[2fr_1fr_1fr_80px] px-5 py-3 border-b border-border last:border-0 hover:bg-bg-hover transition-colors items-center"
            >
              <div>
                <span className="font-system text-coord-blue text-sm">{s.system_name}</span>
                {s.original_author && (
                  <span className="font-system text-text-faint text-[9px] ml-2">via {s.original_author}</span>
                )}
              </div>
              <span className="font-system text-text-dim text-xs">
                {formatCoords(s.coord_x, s.coord_y, s.coord_z)}
              </span>
              <span className={`font-system text-[9px] tracking-wider uppercase ${STATUS_COLORS[s.status] ?? "text-text-dim"}`}>
                {STATUS_LABELS[s.status] ?? s.status}
              </span>
              <div className="text-right">
                <span className="font-system text-text-primary text-xs">{s.score}</span>
                <div className="w-full bg-bg-deep h-1 mt-1">
                  <div className="bg-gold/40 h-1" style={{ width: `${s.score}%` }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-border bg-bg-card p-8 flex items-center justify-center min-h-[200px]">
          <p className="font-system text-text-dim text-xs">
            {"// no systems tracked yet"}
          </p>
        </div>
      )}
    </div>
  );
}
