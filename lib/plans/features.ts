import { supportsDailyMenuCategory } from "@/lib/establishment/categories";
import type { EstablishmentCategory, PlanType } from "@/types/database";

export function isProPlan(plan: PlanType): boolean {
  return plan === "pro";
}

/** Cardápio do dia (marcar itens is_daily + filtro no bot). */
export function canUseDailyMenu(plan: PlanType): boolean {
  return isProPlan(plan);
}

/** Horário de corte automático no WhatsApp. */
export function canUseOrderCutoff(plan: PlanType): boolean {
  return isProPlan(plan);
}

export function resolveMenuItemIsDaily(
  plan: PlanType,
  establishmentCategory: EstablishmentCategory,
  requested?: boolean
): boolean {
  if (!supportsDailyMenuCategory(establishmentCategory)) return false;
  if (!canUseDailyMenu(plan)) return false;
  return requested ?? true;
}

export function stripProEstablishmentFields(
  plan: PlanType,
  data: { order_cutoff_time?: string | null }
): { order_cutoff_time?: string | null } {
  if (canUseOrderCutoff(plan)) return data;
  return { order_cutoff_time: null };
}
