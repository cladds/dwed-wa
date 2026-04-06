export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatCoord(value: number | null | undefined): string {
  if (value == null) return "---";
  return value.toFixed(2);
}

export function formatCoords(x: number | null, y: number | null, z: number | null): string {
  return `${formatCoord(x)} / ${formatCoord(y)} / ${formatCoord(z)}`;
}
