import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { fetchEDSMSystem } from "@/lib/api/edsm";
import { searchSpanshSystem } from "@/lib/api/spansh";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check cache first
  const { data: cached } = await supabase
    .from("system_cache")
    .select("*")
    .ilike("system_name", `%${query}%`)
    .limit(10);

  if (cached && cached.length > 0) {
    // Filter for entries less than 24hr old
    const fresh = cached.filter((c) => {
      const age = Date.now() - new Date(c.fetched_at).getTime();
      return age < 86400000; // 24 hours
    });

    if (fresh.length > 0) {
      return NextResponse.json({ results: fresh, source: "cache" });
    }
  }

  // Fetch from external APIs
  const [edsmResult, spanshResults] = await Promise.allSettled([
    fetchEDSMSystem(query),
    searchSpanshSystem(query),
  ]);

  const edsm = edsmResult.status === "fulfilled" ? edsmResult.value : null;
  const spansh = spanshResults.status === "fulfilled" ? spanshResults.value : [];

  // Cache EDSM result if found
  if (edsm) {
    await supabase.from("system_cache").upsert({
      system_name: edsm.name,
      edsm_id: String(edsm.id),
      id64: String(edsm.id64),
      coord_x: edsm.coords.x,
      coord_y: edsm.coords.y,
      coord_z: edsm.coords.z,
      edsm_data: edsm as unknown as Record<string, unknown>,
      allegiance: edsm.information?.allegiance ?? null,
      government: edsm.information?.government ?? null,
      population: edsm.information?.population ?? null,
      security: edsm.information?.security ?? null,
      economy: edsm.information?.economy ?? null,
      fetched_at: new Date().toISOString(),
    }, { onConflict: "system_name" });
  }

  return NextResponse.json({
    results: {
      edsm: edsm,
      spansh: spansh,
    },
    source: "api",
  });
}
