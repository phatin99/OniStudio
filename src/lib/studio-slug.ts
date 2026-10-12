// Shared, deterministic slug formatter for the room form and server action.
export function studioSlugFromName(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.slice(0, 112).replace(/-+$/, "") || "phong-studio";
}
