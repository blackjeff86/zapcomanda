export type MenuCategoryGroup<T> = {
  category: string;
  items: T[];
  minSortOrder: number;
};

/** Agrupa itens por categoria, ordenando categorias e itens por sort_order. */
export function groupMenuItemsByCategory<
  T extends { category: string; sort_order: number; name: string },
>(items: T[]): MenuCategoryGroup<T>[] {
  const map = new Map<string, T[]>();

  for (const item of items) {
    const category = item.category?.trim() || "Geral";
    const list = map.get(category) ?? [];
    list.push(item);
    map.set(category, list);
  }

  return Array.from(map.entries())
    .map(([category, categoryItems]) => {
      const sorted = [...categoryItems].sort(
        (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "pt-BR")
      );
      const minSortOrder = sorted.reduce(
        (min, i) => Math.min(min, i.sort_order),
        sorted[0]?.sort_order ?? 0
      );
      return { category, items: sorted, minSortOrder };
    })
    .sort(
      (a, b) =>
        a.minSortOrder - b.minSortOrder ||
        a.category.localeCompare(b.category, "pt-BR")
    );
}

export function categoryAnchorId(category: string): string {
  const slug = category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `categoria-${slug || "geral"}`;
}
