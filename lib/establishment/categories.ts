import type { EstablishmentCategory } from "@/types/database";

export const ESTABLISHMENT_CATEGORIES: EstablishmentCategory[] = [
  "lanchonete",
  "quentinha",
  "doces",
];

export const ESTABLISHMENT_CATEGORY_LABELS: Record<EstablishmentCategory, string> = {
  lanchonete: "Lanchonete / Sanduíches",
  quentinha: "Quentinha / Marmita",
  doces: "Doces & Confeitaria",
};

export const ESTABLISHMENT_CATEGORY_HINTS: Record<EstablishmentCategory, string> = {
  lanchonete: "Cardápio fixo: sanduíches, salgados, combos",
  quentinha: "Marmitas e quentinhas — ideal com cardápio do dia (Pro)",
  doces: "Bolos, tortas e doces — cardápio do dia para o que está pronto hoje (Pro)",
};

/** Categorias de menu sugeridas no onboarding por tipo de negócio. */
export const SUGGESTED_MENU_CATEGORIES: Record<EstablishmentCategory, string[]> = {
  lanchonete: ["Sanduíches", "Salgados", "Bebidas", "Combos"],
  quentinha: ["Quentinhas", "Marmitas", "Bebidas", "Especiais"],
  doces: ["Bolos", "Doces", "Tortas", "Salgados", "Bebidas"],
};

/** Negócios com produção diária variável (cardápio do dia no Pro). */
export function supportsDailyMenuCategory(category: EstablishmentCategory): boolean {
  return category === "quentinha" || category === "doces";
}

export function formatEstablishmentCategory(category: EstablishmentCategory): string {
  return ESTABLISHMENT_CATEGORY_LABELS[category] ?? category;
}

export function defaultMenuCategoryForEstablishment(
  category: EstablishmentCategory
): string {
  return SUGGESTED_MENU_CATEGORIES[category][0];
}
