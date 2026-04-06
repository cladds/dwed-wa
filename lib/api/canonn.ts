const CANONN_BASE = "https://api.canonn.tech";

type CanonnEndpoint =
  | "listeningposts"
  | "crashsites"
  | "guardianstructures"
  | "thargoidstructures"
  | "biologicals";

export async function fetchCanonnData(endpoint: CanonnEndpoint) {
  const res = await fetch(`${CANONN_BASE}/${endpoint}`);
  if (!res.ok) return [];

  return res.json();
}
