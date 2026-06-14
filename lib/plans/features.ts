import { supportsDailyMenuCategory } from "@/lib/establishment/categories";
import type { EstablishmentCategory, PlanType } from "@/types/database";

export function isProPlan(plan: PlanType): boolean {
  return plan === "pro";
}

/** Cardápio do dia — disponível em todos os planos. */
export function canUseDailyMenu(_plan: PlanType): boolean {
  return true;
}

/** Horário de corte automático — disponível em todos os planos. */
export function canUseOrderCutoff(_plan: PlanType): boolean {
  return true;
}

export function resolveMenuItemIsDaily(
  _plan: PlanType,
  establishmentCategory: EstablishmentCategory,
  requested?: boolean
): boolean {
  if (!supportsDailyMenuCategory(establishmentCategory)) return false;
  return requested ?? true;
}

export function stripProEstablishmentFields(
  _plan: PlanType,
  data: { order_cutoff_time?: string | null }
): { order_cutoff_time?: string | null } {
  return data;
}
