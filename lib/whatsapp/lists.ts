import type { ListRow } from "@/lib/whatsapp/client";

export const LIST_PAGE_SIZE = 9;

export interface PaginatedList {
  rows: ListRow[];
  page: number;
  totalPages: number;
}

export function buildPaginatedList(
  items: ListRow[],
  page: number,
  nextId: string,
  prevId: string
): PaginatedList {
  const totalPages = Math.ceil(items.length / LIST_PAGE_SIZE);
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const start = safePage * LIST_PAGE_SIZE;
  const slice = items.slice(start, start + LIST_PAGE_SIZE);
  const rows = [...slice];

  if (safePage < totalPages - 1) {
    rows.push({
      id: `${nextId}:${safePage + 1}`,
      title: "Mais opções →",
      description: `Página ${safePage + 2} de ${totalPages}`,
    });
  }

  if (safePage > 0) {
    rows.unshift({
      id: `${prevId}:${safePage - 1}`,
      title: "← Opções anteriores",
      description: `Página ${safePage} de ${totalPages}`,
    });
  }

  return { rows, page: safePage, totalPages };
}

export function parsePageId(buttonId: string, prefix: string): number | null {
  if (!buttonId.startsWith(`${prefix}:`)) return null;
  const page = parseInt(buttonId.split(":")[1], 10);
  return isNaN(page) ? null : page;
}
