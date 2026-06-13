import { z } from "zod";

export const PAYMENT_METHODS = [
  "pix",
  "credit_card",
  "debit_card",
  "cash",
  "meal_voucher",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix (paga agora)",
  credit_card: "Cartão de crédito (na entrega)",
  debit_card: "Cartão de débito (na entrega)",
  cash: "Dinheiro (na entrega)",
  meal_voucher: "Ticket refeição (na entrega)",
};

export const PAYMENT_METHOD_SHORT: Record<PaymentMethod, string> = {
  pix: "Pix",
  credit_card: "Crédito",
  debit_card: "Débito",
  cash: "Dinheiro",
  meal_voucher: "Ticket",
};

/** Pix é cobrado antes do preparo; demais na entrega. */
export function isPayOnDelivery(method: PaymentMethod): boolean {
  return method !== "pix";
}

export function normalizeAcceptedMethods(
  raw: unknown
): PaymentMethod[] {
  if (!Array.isArray(raw)) return ["pix"];
  const valid = raw.filter(
    (m): m is PaymentMethod =>
      typeof m === "string" && PAYMENT_METHODS.includes(m as PaymentMethod)
  );
  return valid.length > 0 ? valid : ["pix"];
}

export const paymentMethodSchema = z.enum(PAYMENT_METHODS);

export const acceptedPaymentMethodsSchema = z
  .array(paymentMethodSchema)
  .min(1, "Selecione pelo menos uma forma de pagamento");
