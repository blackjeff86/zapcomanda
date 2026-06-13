import type { CouponDiscountType, DiscountCoupon } from "@/types/database";

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function parseCouponExpiryDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) throw new Error("Data inválida");
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

export function calculateCouponDiscount(
  orderTotalBeforeDiscount: number,
  coupon: Pick<DiscountCoupon, "discount_type" | "discount_value">
): number {
  if (orderTotalBeforeDiscount <= 0) return 0;

  if (coupon.discount_type === "percent") {
    const pct = Number(coupon.discount_value);
    const amount = orderTotalBeforeDiscount * (pct / 100);
    return Math.min(orderTotalBeforeDiscount, Math.round(amount * 100) / 100);
  }

  const fixed = Number(coupon.discount_value);
  return Math.min(orderTotalBeforeDiscount, fixed);
}

export function isCouponExpired(coupon: Pick<DiscountCoupon, "expires_at">): boolean {
  return new Date(coupon.expires_at).getTime() < Date.now();
}

export function formatCouponDiscountLabel(
  type: CouponDiscountType,
  value: number
): string {
  if (type === "percent") {
    return `${value}%`;
  }
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export interface CouponValidationResult {
  coupon: DiscountCoupon;
  discountAmount: number;
  totalAfterDiscount: number;
}

export function applyCouponToOrder(
  subtotal: number,
  deliveryFee: number,
  coupon: DiscountCoupon
): CouponValidationResult {
  if (!coupon.is_active) {
    throw new Error("Este cupom está desativado");
  }
  if (isCouponExpired(coupon)) {
    throw new Error("Este cupom expirou");
  }

  const beforeDiscount = subtotal + deliveryFee;
  const discountAmount = calculateCouponDiscount(beforeDiscount, coupon);
  const totalAfterDiscount = Math.max(0, beforeDiscount - discountAmount);

  return { coupon, discountAmount, totalAfterDiscount };
}
