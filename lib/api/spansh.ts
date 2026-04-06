import { spanshLimiter } from "./rate-limiter";

const SPANSH_BASE = "https://spansh.co.uk";

export interface SpanshSearchResult {
  name: string;
  id64: number;
  x?: number;
  y?: number;
  z?: number;
}

export interface SpanshSystemDetail {
  name: string;
  id64: number;
  x: number;
  y: number;
  z: number;
  estimated_scan_value?: number;
  estimated_mapping_value?: number;
  known_permit?: boolean;
  needs_permit?: boolean;
  population?: number;
  region?: string;
  bodies?: SpanshBody[];
}

export interface SpanshBody {
  name: string;
  type: string;
  subtype: string;
  distance_to_arrival: number;
  estimated_scan_value?: number;
  estimated_mapping_value?: number;
  terraforming_state?: string;
}

export async function searchSpanshSystem(query: string): Promise<SpanshSearchResult[]> {
  return spanshLimiter.schedule(async () => {
    const params = new URLSearchParams({ q: query, type: "system" });
    const res = await fetch(`${SPANSH_BASE}/api/search?${params}`);
    if (!res.ok) return [];

    const data = await res.json();
    return data.results ?? [];
  });
}

export async function fetchSpanshSystem(id64: string): Promise<SpanshSystemDetail | null> {
  return spanshLimiter.schedule(async () => {
    const res = await fetch(`${SPANSH_BASE}/api/system/${id64}`);
    if (!res.ok) return null;
    return res.json();
  });
}
