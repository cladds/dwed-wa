import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { GalaxyMap } from "@/components/map/GalaxyMap";

export default async function MapPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: tickets } = await supabase
    .from("system_tickets")
    .select("id, system_name, coord_x, coord_y, coord_z, status")
    .not("coord_x", "is", null);

  // Also get systems from cache (populated by search API)
  const { data: cached } = await supabase
    .from("system_cache")
    .select("id, system_name, coord_x, coord_y, coord_z")
    .not("coord_x", "is", null);

  const { data: mapZones } = await supabase
    .from("map_zones")
    .select("id, name, centre_x, centre_y, centre_z, radius_ly, colour, type");

  // Fetch confirmed facts that mention systems
  const { data: factsWithSystems } = await supabase
    .from("confirmed_facts")
    .select("id, title, status, systems_mentioned")
    .not("systems_mentioned", "eq", "{}");

  // Resolve fact systems to coordinates via system_cache
  const factSystemNames = new Set<string>();
  for (const f of factsWithSystems ?? []) {
    for (const sys of f.systems_mentioned ?? []) {
      factSystemNames.add(sys);
    }
  }

  const { data: factSystemCoords } = factSystemNames.size > 0
    ? await supabase
        .from("system_cache")
        .select("system_name, coord_x, coord_y, coord_z")
        .in("system_name", Array.from(factSystemNames))
    : { data: [] };

  const coordMap = new Map<string, { x: number; y: number; z: number }>();
  for (const c of factSystemCoords ?? []) {
    if (c.coord_x != null) {
      coordMap.set(c.system_name.toLowerCase(), { x: c.coord_x, y: c.coord_y!, z: c.coord_z! });
    }
  }

  const factPoints = (factsWithSystems ?? []).flatMap(f =>
    (f.systems_mentioned ?? [])
      .filter(sys => coordMap.has(sys.toLowerCase()))
      .map(sys => {
        const coords = coordMap.get(sys.toLowerCase())!;
        return {
          id: f.id,
          title: f.title,
          status: f.status,
          systemName: sys,
          x: coords.x,
          y: coords.y,
          z: coords.z,
        };
      })
  );

  const ticketSystems = (tickets ?? []).map((t) => ({
    id: t.id,
    name: t.system_name,
    x: t.coord_x!,
    y: t.coord_y!,
    z: t.coord_z!,
    status: t.status,
  }));

  // Add cached systems not already in tickets
  const ticketNames = new Set(ticketSystems.map(s => s.name.toLowerCase()));
  const cachedSystems = (cached ?? [])
    .filter(c => !ticketNames.has(c.system_name.toLowerCase()))
    .map(c => ({
      id: c.id,
      name: c.system_name,
      x: c.coord_x!,
      y: c.coord_y!,
      z: c.coord_z!,
      status: "open_lead",
    }));

  const systems = [...ticketSystems, ...cachedSystems];

  const zones = (mapZones ?? []).map((z) => ({
    id: z.id,
    name: z.name,
    centreX: z.centre_x ?? 0,
    centreY: z.centre_y ?? 0,
    centreZ: z.centre_z ?? 0,
    radiusLy: z.radius_ly ?? 0,
    colour: z.colour ?? "#c4923a",
    type: z.type,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-xl text-gold tracking-wide">
          Galaxy Chart
        </h1>
        <p className="font-system text-text-dim text-xs">
          {systems.length} systems tracked
        </p>
      </div>
      <div className="border border-border bg-bg-card" style={{ height: "calc(100vh - 160px)" }}>
        <GalaxyMap systems={systems} zones={zones} facts={factPoints} />
      </div>
    </div>
  );
}
