const EDSM_BASE = "https://www.edsm.net";

interface EDSMCoords {
  x: number;
  y: number;
  z: number;
}

interface EDSMSystemInfo {
  name: string;
  id: number;
  id64: number;
  coords: EDSMCoords;
  information?: Record<string, unknown>;
}

export async function fetchEDSMSystem(systemName: string): Promise<EDSMSystemInfo | null> {
  const params = new URLSearchParams({
    systemName,
    showCoordinates: "1",
    showInformation: "1",
  });

  const res = await fetch(`${EDSM_BASE}/api-v1/system?${params}`);
  if (!res.ok) return null;

  const data = await res.json();
  if (!data || !data.name) return null;

  return data as EDSMSystemInfo;
}

export async function fetchEDSMBodies(systemName: string) {
  const params = new URLSearchParams({ systemName });
  const res = await fetch(`${EDSM_BASE}/api-system-v1/bodies?${params}`);
  if (!res.ok) return null;

  return res.json();
}
