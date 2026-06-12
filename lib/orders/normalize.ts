import type { OrderStatus } from "@/types/database";

export interface OrderRow {
  id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
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
    customers: customers || { phone: "", name: null },
    order_items: orderItems.map((item) => ({
      ...item,
      notes: item.notes ?? null,
      addons: Array.isArray(item.addons) ? item.addons : [],
    })),
    notes: (raw.notes as string | null) ?? null,
  };
}
