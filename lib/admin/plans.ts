import type { PlanType } from "@/types/database";

export const PLAN_AMOUNTS: Record<PlanType, number> = {
  basic: 49,
  pro: 79,
};

export function planAmount(plan: PlanType | string): number {
  return PLAN_AMOUNTS[plan as PlanType] ?? PLAN_AMOUNTS.basic;
}
