import type { OrderStatus } from "@/types/database";
import { generateDeliveryToken } from "@/lib/orders/delivery-token";

export function buildOrderStatusUpdate(
  status: OrderStatus,
  paymentCollected?: boolean,
  existingDeliveryToken?: string | null
): Record<string, unknown> {
  const updates: Record<string, unknown> = { status };

  if (status === "out_for_delivery" && !existingDeliveryToken) {
    updates.delivery_token = generateDeliveryToken();
  }

  if (status === "paid") {
    updates.payment_collected = true;
  }

  if (status === "delivered") {
    updates.delivered_at = new Date().toISOString();
    updates.payment_collected = paymentCollected ?? true;
    updates.delivery_confirmed_by = "owner";
  }

  return updates;
}

export const ORDER_LIST_SELECT =
  "id, status, total_amount, delivery_fee, created_at, notes, payment_method, payment_collected, delivered_at, delivery_token, delivery_photo_url, delivery_confirmed_by, cash_tender_amount, change_amount, customers(phone, name), order_items(item_name, quantity, subtotal, notes, addons)";
