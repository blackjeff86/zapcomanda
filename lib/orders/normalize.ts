import type { OrderStatus, PaymentMethod } from "@/types/database";

export interface OrderRow {
  id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  payment_method: PaymentMethod | null;
  payment_collected: boolean;
  delivered_at: string | null;
  delivery_fee: number;
  delivery_token: string | null;
  delivery_photo_url: string | null;
  delivery_confirmed_by: string | null;
  customers: { phone: string; name: string | null };
  order_items: Array<{
    item_name: string;
    quantity: number;
    subtotal: number;
    notes: string | null;
    addons: Array<{ id: string; name: string; price: number }>;
  }>;
  notes?: string | null;
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function normalizeOrderRow(raw: Record<string, unknown>): OrderRow {
  const customers = unwrapRelation(
    raw.customers as { phone: string; name: string | null } | { phone: string; name: string | null }[]
  );

  const orderItems = (raw.order_items as OrderRow["order_items"] | undefined) || [];

  return {
    id: String(raw.id),
    status: raw.status as OrderStatus,
    total_amount: Number(raw.total_amount),
    created_at: String(raw.created_at),
    payment_method: (raw.payment_method as PaymentMethod | null) ?? null,
    payment_collected: Boolean(raw.payment_collected),
    delivered_at: (raw.delivered_at as string | null) ?? null,
    delivery_fee: Number(raw.delivery_fee ?? 0),
    delivery_token: (raw.delivery_token as string | null) ?? null,
    delivery_photo_url: (raw.delivery_photo_url as string | null) ?? null,
    delivery_confirmed_by: (raw.delivery_confirmed_by as string | null) ?? null,
    customers: customers || { phone: "", name: null },
    order_items: orderItems.map((item) => ({
      ...item,
      notes: item.notes ?? null,
      addons: Array.isArray(item.addons) ? item.addons : [],
    })),
    notes: (raw.notes as string | null) ?? null,
  };
}
