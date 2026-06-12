"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderStatus } from "@/types/database";
import { normalizeOrderRow, type OrderRow } from "@/lib/orders/normalize";

const STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: "Aguardando pagamento",
  paid: "Pago",
  preparing: "Em preparo",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  awaiting_payment: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: "preparing",
  preparing: "delivered",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersList({
  establishmentId,
  initialOrders,
}: {
  establishmentId: string;
  initialOrders: OrderRow[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .schema("zapcomanda")
      .from("orders")
      .select("id, status, total_amount, created_at, notes, customers(phone, name), order_items(item_name, quantity, subtotal, notes, addons)")
      .eq("establishment_id", establishmentId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) setOrders(data.map((row) => normalizeOrderRow(row)));
  }, [establishmentId]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`orders:${establishmentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "zapcomanda",
          table: "orders",
          filter: `establishment_id=eq.${establishmentId}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [establishmentId, fetchOrders]);

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdating(orderId);

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao atualizar");
      }

      await fetchOrders();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao atualizar pedido");
    } finally {
      setUpdating(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <p className="text-gray-500">Nenhum pedido ainda.</p>
        <p className="mt-1 text-sm text-gray-400">
          Os pedidos do WhatsApp aparecerão aqui automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const nextStatus = NEXT_STATUS[order.status];

        return (
          <div
            key={order.id}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">
                  Pedido #{order.id.slice(0, 8)}
                </p>
                <p className="text-sm text-gray-500">
                  {formatTime(order.created_at)} ·{" "}
                  {order.customers.name || order.customers.phone}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(Number(order.total_amount))}
                </span>
              </div>
            </div>

            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              {order.order_items.map((item, index) => (
                <li key={index}>
                  <span>
                    {item.quantity}x {item.item_name} —{" "}
                    {formatCurrency(Number(item.subtotal))}
                  </span>
                  {item.addons && item.addons.length > 0 && (
                    <span className="mt-0.5 block text-xs text-green-700">
                      + {item.addons.map((a) => `${a.name} (${formatCurrency(Number(a.price))})`).join(", ")}
                    </span>
                  )}
                  {item.notes && (
                    <span className="mt-0.5 block text-xs italic text-amber-700">
                      Obs: {item.notes}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {order.notes && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <span className="font-medium">Observações:</span> {order.notes}
              </p>
            )}

            {nextStatus && (
              <button
                onClick={() => updateStatus(order.id, nextStatus)}
                disabled={updating === order.id}
                className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
              >
                {updating === order.id
                  ? "Atualizando..."
                  : nextStatus === "preparing"
                    ? "Marcar em preparo"
                    : "Marcar entregue"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
