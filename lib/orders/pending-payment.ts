import type { OrderRow } from "@/lib/orders/normalize";
import { isPayOnDelivery } from "@/lib/payments/methods";

/** Pedidos com pagamento na entrega ainda não recebido (em andamento). */
export function filterAwaitingDeliveryPayment(orders: OrderRow[]): OrderRow[] {
  return orders.filter(
    (o) =>
      o.payment_method &&
      isPayOnDelivery(o.payment_method) &&
      !o.payment_collected &&
      o.status !== "cancelled" &&
      o.status !== "awaiting_payment" &&
      o.status !== "delivered"
  );
}

/** Entregas marcadas sem confirmação de pagamento (inconsistência / alerta). */
export function filterDeliveredWithoutPayment(orders: OrderRow[]): OrderRow[] {
  return orders.filter(
    (o) => o.status === "delivered" && !o.payment_collected
  );
}

export function hasPendingPaymentIssues(orders: OrderRow[]): boolean {
  return (
    filterAwaitingDeliveryPayment(orders).length > 0 ||
    filterDeliveredWithoutPayment(orders).length > 0
  );
}
