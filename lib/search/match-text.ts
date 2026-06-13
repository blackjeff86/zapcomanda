export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesSearch(query: string, haystack: string): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;
  return normalizeSearchText(haystack).includes(q);
}

export function matchesSearchAny(query: string, parts: string[]): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;
  return parts.some((part) => normalizeSearchText(part).includes(q));
}
