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

  const { data: mapZones } = await supabase
    .from("map_zones")
    .select("id, name, centre_x, centre_y, centre_z, radius_ly, colour, type");

  const systems = (tickets ?? []).map((t) => ({
    id: t.id,
    name: t.system_name,
    x: t.coord_x!,
    y: t.coord_y!,
    z: t.coord_z!,
    status: t.status,
  }));

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
        <GalaxyMap systems={systems} zones={zones} />
      </div>
    </div>
  );
}
