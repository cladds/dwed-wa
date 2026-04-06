import { edsmLimiter } from "./rate-limiter";

const EDSM_BASE = "https://www.edsm.net";

export interface EDSMCoords {
  x: number;
  y: number;
  z: number;
}

export interface EDSMSystemInfo {
  name: string;
  id: number;
  id64: number;
  coords: EDSMCoords;
  coordsLocked?: boolean;
  information?: {
    allegiance?: string;
    government?: string;
    faction?: string;
    factionState?: string;
    population?: number;
    security?: string;
    economy?: string;
    secondEconomy?: string;
    reserve?: string;
  };
  primaryStar?: {
    type: string;
    name: string;
    isScoopable: boolean;
  };
}

export async function fetchEDSMSystem(systemName: string): Promise<EDSMSystemInfo | null> {
  return edsmLimiter.schedule(async () => {
    const params = new URLSearchParams({
      systemName,
      showCoordinates: "1",
      showInformation: "1",
      showPrimaryStar: "1",
    });

    const res = await fetch(`${EDSM_BASE}/api-v1/system?${params}`, {
      next: { revalidate: 86400 }, // Cache for 24hr matching EDSM's cache
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || !data.name) return null;

    return data as EDSMSystemInfo;
  });
}

export async function fetchEDSMBodies(systemName: string) {
  return edsmLimiter.schedule(async () => {
    const params = new URLSearchParams({ systemName });
    const res = await fetch(`${EDSM_BASE}/api-system-v1/bodies?${params}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return res.json();
  });
}

export async function fetchEDSMSystemsInRadius(
  x: number, y: number, z: number, radius: number
) {
  return edsmLimiter.schedule(async () => {
    const params = new URLSearchParams({
      x: String(x),
      y: String(y),
      z: String(z),
      radius: String(radius),
      showCoordinates: "1",
    });

    const res = await fetch(`${EDSM_BASE}/api-v1/sphere-systems?${params}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    return res.json();
  });
}
