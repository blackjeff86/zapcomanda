"use client";

import { useState } from "react";

type OrderStatus =
  | "awaiting_payment"
  | "paid"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

type PaymentMethod = "pix" | "credit_card" | "debit_card" | "cash" | "meal_voucher";

type OrderItem = {
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes: string | null;
};

type CustomerOrder = {
  id: string;
  status: OrderStatus;
  total_amount: number;
  delivery_fee: number;
  payment_method: PaymentMethod;
  created_at: string;
  order_items: OrderItem[];
};

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: string; bg: string; text: string }
> = {
  awaiting_payment: { label: "Aguardando pagamento", icon: "⏳", bg: "bg-yellow-50", text: "text-yellow-700" },
  paid:             { label: "Pagamento confirmado", icon: "✅", bg: "bg-blue-50",   text: "text-blue-700"   },
  preparing:        { label: "Em preparação",        icon: "👨‍🍳", bg: "bg-orange-50", text: "text-orange-700" },
  out_for_delivery: { label: "Saiu para entrega",    icon: "🛵", bg: "bg-purple-50", text: "text-purple-700" },
  delivered:        { label: "Entregue",             icon: "🎉", bg: "bg-green-50",  text: "text-green-700"  },
  cancelled:        { label: "Cancelado",            icon: "❌", bg: "bg-red-50",    text: "text-red-700"    },
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix:          "Pix",
  credit_card:  "Cartão de crédito",
  debit_card:   "Cartão de débito",
  cash:         "Dinheiro",
  meal_voucher: "Vale refeição",
};

const ACTIVE_STATUSES = new Set<OrderStatus>([
  "awaiting_payment",
  "paid",
  "preparing",
  "out_for_delivery",
]);

export default function MyOrdersPanel({
  establishmentId,
  slug,
  brand,
  initialPhone,
  onClose,
}: {
  establishmentId: string;
  slug: string;
  brand: string;
  initialPhone: string;
  onClose: () => void;
}) {
  const [phone, setPhone] = useState(
    initialPhone.replace(/\D/g, "").slice(-11)
  );
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Digite um número de WhatsApp válido.");
      return;
    }
    setLoading(true);
    setError(null);
    setOrders(null);
    try {
      const res = await fetch(
        `/api/cardapio/orders/by-phone?establishment_id=${establishmentId}&phone=${digits}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao buscar pedidos");
      setOrders(data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar pedidos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-base font-semibold text-gray-900">Meus Pedidos</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Phone lookup form */}
        <div className="p-4">
          <p className="mb-3 text-sm text-gray-500">
            Digite seu WhatsApp para ver seus pedidos neste restaurante.
          </p>
          <form onSubmit={search} className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 11 99999-8888"
              className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": brand } as React.CSSProperties}
            />
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: brand }}
            >
              {loading ? "..." : "Buscar"}
            </button>
          </form>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Results */}
        {orders !== null && (
          <div className="px-4 pb-6">
            {orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center">
                <p className="text-2xl">📦</p>
                <p className="mt-2 text-sm text-gray-500">
                  Nenhum pedido encontrado para este número.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-400">
                  {orders.length} pedido{orders.length > 1 ? "s" : ""} encontrado{orders.length > 1 ? "s" : ""}
                </p>
                {orders.map((order) => {
                  const status = STATUS_CONFIG[order.status];
                  const isExpanded = expanded === order.id;
                  const isActive = ACTIVE_STATUSES.has(order.status);
                  const ref = order.id.slice(0, 8).toUpperCase();
                  const date = new Date(order.created_at).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={order.id}
                      className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
                    >
                      {/* Order header row */}
                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : order.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${status.bg}`}
                        >
                          {status.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                              #{ref}
                            </p>
                            {isActive && (
                              <span
                                className="rounded-full px-1.5 py-0.5 text-xs font-medium text-white"
                                style={{ backgroundColor: brand }}
                              >
                                em andamento
                              </span>
                            )}
                          </div>
                          <p className={`text-xs font-medium ${status.text}`}>
                            {status.label}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {fmt(order.total_amount)}
                          </p>
                          <p className="text-xs text-gray-400">{date}</p>
                        </div>
                        <span className="ml-1 text-gray-400 transition-transform" style={{
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          display: "inline-block",
                        }}>
                          ▾
                        </span>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                          <div className="space-y-1">
                            {order.order_items.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-gray-700">
                                  {item.quantity}× {item.item_name}
                                  {item.notes && (
                                    <span className="ml-1 text-xs text-gray-400">
                                      ({item.notes})
                                    </span>
                                  )}
                                </span>
                                <span className="font-medium text-gray-900">
                                  {fmt(item.subtotal)}
                                </span>
                              </div>
                            ))}
                            {order.delivery_fee > 0 && (
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Taxa de entrega</span>
                                <span>{fmt(order.delivery_fee)}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-gray-200 pt-1 text-sm font-bold text-gray-900">
                              <span>Total</span>
                              <span>{fmt(order.total_amount)}</span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {PAYMENT_LABELS[order.payment_method]}
                            </span>
                            {isActive && (
                              <a
                                href={`/cardapio/${slug}/pedido/${order.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium underline"
                                style={{ color: brand }}
                              >
                                Acompanhar ao vivo →
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
