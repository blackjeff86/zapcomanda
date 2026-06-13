"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import OrderCard from "@/components/dashboard/OrderCard";
import PendingPaymentReport from "@/components/dashboard/PendingPaymentReport";
import { useDashboardSearch } from "@/components/dashboard/DashboardSearch";
import { createClient } from "@/lib/supabase/client";
import { isActiveOrderStatus } from "@/lib/orders/status-ui";
import { ORDER_LIST_SELECT } from "@/lib/orders/select";
import { normalizeOrderRow, type OrderRow } from "@/lib/orders/normalize";
import { matchesSearchAny } from "@/lib/search/match-text";
import type { OrderStatus } from "@/types/database";

type MainFilter = "active" | "delivered" | "all";

const MAIN_FILTERS: {
  key: MainFilter;
  label: string;
  description: string;
}[] = [
  {
    key: "active",
    label: "Para fazer agora",
    description: "Pedidos que precisam da sua atenção",
  },
  {
    key: "delivered",
    label: "Já entregues",
    description: "Pedidos finalizados hoje ou antes",
  },
  {
    key: "all",
    label: "Todos",
    description: "Ver todos os pedidos",
  },
];

export default function OrdersBoard({
  establishmentId,
  initialOrders,
  devBypass = false,
  devMock = false,
}: {
  establishmentId: string;
  initialOrders: OrderRow[];
  devBypass?: boolean;
  devMock?: boolean;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<MainFilter>("active");
  const [showStageFilters, setShowStageFilters] = useState(false);
  const [stageFilter, setStageFilter] = useState<OrderStatus | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { query: searchQuery } = useDashboardSearch();
  const searchParams = useSearchParams();
  const highlightOrderId = searchParams.get("highlightOrder");

  const fetchOrders = useCallback(async () => {
    if (devMock) return;

    if (devBypass) {
      const response = await fetch(
        `/api/orders?establishment_id=${establishmentId}`
      );
      if (!response.ok) return;
      const data = await response.json();
      setOrders(
        data.map((row: Parameters<typeof normalizeOrderRow>[0]) =>
          normalizeOrderRow(row)
        )
      );
      return;
    }

    const supabase = createClient();
    const { data } = await supabase
      .schema("zapcomanda")
      .from("orders")
      .select(ORDER_LIST_SELECT)
      .eq("establishment_id", establishmentId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) setOrders(data.map((row) => normalizeOrderRow(row)));
  }, [establishmentId, devBypass, devMock]);

  useEffect(() => {
    if (devMock) return;

    if (devBypass) {
      const interval = setInterval(fetchOrders, 8000);
      return () => clearInterval(interval);
    }

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
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [establishmentId, fetchOrders, devBypass, devMock]);

  const counts = useMemo(() => {
    let active = 0;
    let delivered = 0;
    const byStage: Partial<Record<OrderStatus, number>> = {};

    for (const order of orders) {
      if (isActiveOrderStatus(order.status)) active += 1;
      if (order.status === "delivered") delivered += 1;
      byStage[order.status] = (byStage[order.status] ?? 0) + 1;
    }

    return { active, delivered, all: orders.length, byStage };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let list = orders;

    if (filter === "active") {
      list = list.filter((o) => isActiveOrderStatus(o.status));
    } else if (filter === "delivered") {
      list = list.filter((o) => o.status === "delivered");
    }

    if (stageFilter) {
      list = list.filter((o) => o.status === stageFilter);
    }

    const q = searchQuery.trim();
    if (q) {
      list = list.filter((order) =>
        matchesSearchAny(q, [
          order.customers.name ?? "",
          order.customers.phone,
          order.id,
          order.id.slice(0, 8),
          order.notes ?? "",
          ...order.order_items.map((i) => i.item_name),
        ])
      );
    }

    return list;
  }, [orders, filter, stageFilter, searchQuery]);

  useEffect(() => {
    if (!highlightOrderId) return;

    const order = orders.find((o) => o.id === highlightOrderId);
    if (order && filter === "active" && !isActiveOrderStatus(order.status)) {
      setFilter("all");
      setStageFilter(null);
    }

    const timer = window.setTimeout(() => {
      const el = document.getElementById(`order-${highlightOrderId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-brand", "ring-offset-2");
        window.setTimeout(() => {
          el.classList.remove("ring-2", "ring-brand", "ring-offset-2");
        }, 2500);
      }
    }, 100);

    return () => window.clearTimeout(timer);
  }, [highlightOrderId, orders, filter]);

  async function updateStatus(
    orderId: string,
    status: OrderStatus,
    options?: { payment_collected?: boolean }
  ) {
    setUpdating(orderId);

    try {
      if (devMock) {
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id !== orderId) return o;
            const next = { ...o, status };
            if (status === "paid") {
              next.payment_collected = true;
            }
            if (status === "delivered") {
              next.delivered_at = new Date().toISOString();
              next.payment_collected = options?.payment_collected ?? true;
              next.delivery_confirmed_by = "owner";
            }
            if (status === "out_for_delivery" && !next.delivery_token) {
              next.delivery_token = `dev-${orderId.slice(0, 8)}`;
            }
            return next;
          })
        );
        return;
      }

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...options }),
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

  const activeFilterMeta = MAIN_FILTERS.find((f) => f.key === filter);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Pedidos</h2>
        <p className="mt-1 text-sm text-gray-500">
          Toque no botão verde de cada pedido para avançar a etapa. É só um clique.
        </p>
      </div>

      {devMock && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Dados de exemplo — conecte um estabelecimento real no onboarding.
        </p>
      )}

      <PendingPaymentReport orders={orders} />

      {/* Filtros principais — grandes e claros */}
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        {MAIN_FILTERS.map((item) => {
          const count =
            item.key === "active"
              ? counts.active
              : item.key === "delivered"
                ? counts.delivered
                : counts.all;
          const isActive = filter === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setFilter(item.key);
                setStageFilter(null);
              }}
              className={`rounded-xl border-2 px-4 py-3 text-left transition active:scale-[0.98] ${
                isActive
                  ? "border-brand bg-brand-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-base font-bold ${
                    isActive ? "text-brand-dark" : "text-gray-900"
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${
                    isActive ? "bg-brand text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">{item.description}</p>
            </button>
          );
        })}
      </div>

      {/* Filtro por etapa — opcional */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowStageFilters((v) => !v)}
          className="text-sm font-medium text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline"
        >
          {showStageFilters ? "Ocultar filtros por etapa" : "Filtrar por etapa específica"}
        </button>

        {showStageFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                "awaiting_payment",
                "paid",
                "preparing",
                "out_for_delivery",
                "delivered",
              ] as OrderStatus[]
            ).map((status) => {
              const count = counts.byStage[status] ?? 0;
              if (count === 0) return null;
              const isActive = stageFilter === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setStageFilter(isActive ? null : status)
                  }
                  className={`min-h-[44px] rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {status === "awaiting_payment" && "Aguardando Pix"}
                  {status === "paid" && "Pagamento recebido"}
                  {status === "preparing" && "Em preparo"}
                  {status === "out_for_delivery" && "Saiu para entrega"}
                  {status === "delivered" && "Entregues"}
                  <span className="ml-1 opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeFilterMeta && filter === "active" && counts.active > 0 && (
        <p className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <span className="font-semibold">{counts.active} pedido(s)</span> precisam de
          ação. Comece pelo de cima e toque no botão verde grande.
        </p>
      )}

      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center sm:p-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-lg font-semibold text-gray-800">
            {filter === "active"
              ? "Nada pendente por aqui!"
              : "Nenhum pedido nesta lista"}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {filter === "active"
              ? "Quando chegar um pedido no WhatsApp, ele aparece aqui automaticamente."
              : "Os pedidos do WhatsApp aparecerão nesta área."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              updating={updating === order.id}
              onStatusChange={(status, options) => updateStatus(order.id, status, options)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
