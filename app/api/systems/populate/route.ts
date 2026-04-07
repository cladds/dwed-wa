import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  return POST();
}

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Get all unique systems mentioned in theories that aren't in the cache yet
  const { data: theories } = await supabase
    .from("theories")
    .select("systems_mentioned");

  if (!theories) return NextResponse.json({ populated: 0 });

  const allSystems = new Set<string>();
  for (const t of theories) {
    for (const sys of t.systems_mentioned ?? []) {
      allSystems.add(sys);
    }
  }

  // Check which are already cached
  const { data: existing } = await supabase
    .from("system_cache")
    .select("system_name");

  const existingNames = new Set((existing ?? []).map(e => e.system_name.toLowerCase()));
  const toFetch = Array.from(allSystems).filter(s => !existingNames.has(s.toLowerCase()));

  if (toFetch.length === 0) {
    return NextResponse.json({ populated: 0, message: "All systems already cached" });
  }

  let populated = 0;

  // Fetch from EDSM (max 10 at a time to be respectful)
  for (const systemName of toFetch.slice(0, 10)) {
    try {
      const params = new URLSearchParams({
        systemName,
        showCoordinates: "1",
        showInformation: "1",
      });

      const res = await fetch(`https://www.edsm.net/api-v1/system?${params}`);
      if (!res.ok) continue;

      const data = await res.json();
      if (!data?.name || !data?.coords) continue;

      await supabase.from("system_cache").upsert({
        system_name: data.name,
        edsm_id: String(data.id ?? ""),
        id64: String(data.id64 ?? ""),
        coord_x: data.coords.x,
        coord_y: data.coords.y,
        coord_z: data.coords.z,
        allegiance: data.information?.allegiance ?? null,
        government: data.information?.government ?? null,
        population: data.information?.population ?? null,
        security: data.information?.security ?? null,
        economy: data.information?.economy ?? null,
        fetched_at: new Date().toISOString(),
      }, { onConflict: "system_name" });

      populated++;

      // Be nice to EDSM
      await new Promise(r => setTimeout(r, 1000));
    } catch {
      // Skip failed lookups
    }
  }

  return NextResponse.json({ populated, remaining: Math.max(0, toFetch.length - 10) });
}
