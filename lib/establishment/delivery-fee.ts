import type { Establishment } from "@/types/database";

export function getEstablishmentDeliveryFee(establishment: Establishment): number {
  if (!establishment.delivery_fee_enabled) return 0;
  const amount = Number(establishment.delivery_fee_amount);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}
