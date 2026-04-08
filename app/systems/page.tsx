import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { formatCoords } from "@/lib/utils";

interface SystemWithContext {
  id: string;
  system_name: string;
  coord_x: number | null;
  coord_y: number | null;
  coord_z: number | null;
  allegiance: string | null;
  economy: string | null;
  theoryCount: number;
  factCount: number;
  theoryTitles: string[];
}

interface SystemsPageProps {
  searchParams: { q?: string };
}

export default async function SystemsPage({ searchParams }: SystemsPageProps) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const searchQuery = searchParams.q ?? "";

  // Get all cached systems with actual coordinates (skip 0,0,0 not-found entries)
  const { data: cachedSystems } = await supabase
    .from("system_cache")
    .select("id, system_name, coord_x, coord_y, coord_z, allegiance, economy")
    .not("coord_x", "eq", 0)
    .order("system_name", { ascending: true });

  // Get all theories with their systems
  const { data: theories } = await supabase
    .from("theories")
    .select("title, systems_mentioned");

  // Get confirmed facts with systems
  const { data: facts } = await supabase
    .from("confirmed_facts")
    .select("title, systems_mentioned")
    .not("systems_mentioned", "eq", "{}");

  // Build a map of system name -> theory/fact counts
  const theoryMap = new Map<string, string[]>();
  for (const t of theories ?? []) {
    for (const sys of t.systems_mentioned ?? []) {
      const key = sys.toLowerCase();
      if (!theoryMap.has(key)) theoryMap.set(key, []);
      theoryMap.get(key)!.push(t.title);
    }
  }

  const factMap = new Map<string, number>();
  for (const f of facts ?? []) {
    for (const sys of f.systems_mentioned ?? []) {
      const key = sys.toLowerCase();
      factMap.set(key, (factMap.get(key) ?? 0) + 1);
    }
  }

  // Merge into system list
  let systems: SystemWithContext[] = (cachedSystems ?? []).map(s => {
    const key = s.system_name.toLowerCase();
    const titles = theoryMap.get(key) ?? [];
    return {
      ...s,
      theoryCount: titles.length,
      factCount: factMap.get(key) ?? 0,
      theoryTitles: titles.slice(0, 3),
    };
  });

  // Filter: only show systems referenced by at least one theory or fact
  systems = systems.filter(s => s.theoryCount > 0 || s.factCount > 0);

  // Search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    systems = systems.filter(s => s.system_name.toLowerCase().includes(q));
  }

  // Sort by theory count desc
  systems.sort((a, b) => (b.theoryCount + b.factCount) - (a.theoryCount + a.factCount));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-xl text-gold tracking-wide">
            Coordinates
          </h1>
          <p className="font-system text-text-dim text-xs mt-1">
            {systems.length} systems of interest
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <form action="/systems" method="GET" className="flex-1 sm:flex-none">
            <input
              name="q"
              defaultValue={searchQuery}
              placeholder="Search systems..."
              className="w-full sm:w-56 bg-bg-deep border border-border px-4 py-2 font-system text-text-primary text-sm focus:border-gold/50 focus:outline-none"
            />
          </form>
          <Link
            href="/map"
            className="font-ui text-[10px] tracking-[0.15em] uppercase border border-border text-text-mid px-4 py-2 hover:bg-bg-hover transition-colors whitespace-nowrap flex items-center"
          >
            Galaxy Chart
          </Link>
        </div>
      </div>

      {searchQuery && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2 bg-gold/5 border border-gold/20">
          <p className="font-system text-gold text-xs">
            Filtered: {searchQuery}
          </p>
          <Link href="/systems" className="font-system text-text-faint text-[9px] hover:text-gold">
            Clear
          </Link>
        </div>
      )}

      {systems.length > 0 ? (
        <div className="border border-border bg-bg-card">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_80px_80px] px-5 py-2 border-b border-border">
            <span className="font-ui text-text-faint text-[9px] tracking-[0.2em] uppercase">System</span>
            <span className="font-ui text-text-faint text-[9px] tracking-[0.2em] uppercase">Coordinates</span>
            <span className="font-ui text-text-faint text-[9px] tracking-[0.2em] uppercase text-center">Theories</span>
            <span className="font-ui text-text-faint text-[9px] tracking-[0.2em] uppercase text-center">Facts</span>
          </div>

          {systems.map((s) => (
            <Link
              key={s.id}
              href={`/theories?q=${encodeURIComponent(s.system_name)}`}
              className="block md:grid md:grid-cols-[2fr_1fr_80px_80px] px-5 py-3 border-b border-border last:border-0 hover:bg-bg-hover transition-colors items-center"
            >
              <div>
                <span className="font-system text-coord-blue text-sm">{s.system_name}</span>
                {s.allegiance && (
                  <span className="font-system text-text-faint text-[9px] ml-2">{s.allegiance}</span>
                )}
                {/* Show first theory titles on mobile */}
                {s.theoryTitles.length > 0 && (
                  <p className="font-body text-text-dim text-[10px] mt-1 line-clamp-1 md:hidden">
                    {s.theoryTitles[0]}
                  </p>
                )}
              </div>
              <span className="font-system text-text-dim text-xs hidden md:block">
                {formatCoords(s.coord_x, s.coord_y, s.coord_z)}
              </span>
              <div className="text-center hidden md:block">
                {s.theoryCount > 0 ? (
                  <span className="font-system text-gold text-sm">{s.theoryCount}</span>
                ) : (
                  <span className="font-system text-text-faint text-sm">-</span>
                )}
              </div>
              <div className="text-center hidden md:block">
                {s.factCount > 0 ? (
                  <span className="font-system text-status-success text-sm">{s.factCount}</span>
                ) : (
                  <span className="font-system text-text-faint text-sm">-</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-border bg-bg-card p-8 flex items-center justify-center min-h-[200px]">
          <p className="font-system text-text-dim text-xs">
            {searchQuery ? "// no systems match your search" : "// run Map Systems in the pipeline to populate coordinates"}
          </p>
        </div>
      )}
    </div>
  );
}
