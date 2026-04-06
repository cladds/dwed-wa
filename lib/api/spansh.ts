const SPANSH_BASE = "https://spansh.co.uk";

interface SpanshSearchResult {
  name: string;
  id64: number;
}

export async function searchSpanshSystem(query: string): Promise<SpanshSearchResult[]> {
  const params = new URLSearchParams({ q: query, type: "system" });
  const res = await fetch(`${SPANSH_BASE}/api/search?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  return data.results ?? [];
}

export async function fetchSpanshSystem(id64: string) {
  const res = await fetch(`${SPANSH_BASE}/api/system/${id64}`);
  if (!res.ok) return null;

  return res.json();
}
