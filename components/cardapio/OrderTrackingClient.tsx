"use client";

import { useState, useEffect } from "react";
import PublicFooter from "@/components/public/PublicFooter";

type OrderStatus =
  | "awaiting_payment"
  | "paid"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

type PaymentMethod = "pix" | "credit_card" | "debit_card" | "cash" | "meal_voucher";

type Establishment = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
};

type OrderItem = {
  item_name: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  addons: Array<{ id: string; name: string; price: number }>;
};

type Order = {
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

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  cash: "Dinheiro",
  meal_voucher: "Vale refeição",
};

const STATUS_ORDER: OrderStatus[] = [
  "awaiting_payment",
  "paid",
  "preparing",
  "out_for_delivery",
  "delivered",
];

type Step = { key: OrderStatus; label: string; icon: string };

const ALL_STEPS: Step[] = [
  { key: "awaiting_payment", label: "Aguardando pagamento", icon: "⏳" },
  { key: "paid", label: "Pagamento confirmado", icon: "✅" },
  { key: "preparing", label: "Em preparação", icon: "👨‍🍳" },
  { key: "out_for_delivery", label: "Saiu para entrega", icon: "🛵" },
  { key: "delivered", label: "Entregue", icon: "🎉" },
];

export default function OrderTrackingClient({
  establishment,
  order,
}: {
  establishment: Establishment;
  order: Order;
}) {
  const brand = establishment.primary_color || "#16a34a";
  const [liveStatus, setLiveStatus] = useState<OrderStatus>(order.status);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const TERMINAL = new Set<OrderStatus>(["delivered", "cancelled"]);
    if (TERMINAL.has(order.status)) return;

    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/cardapio/orders/${order.id}/status`);
        if (!res.ok) return;
        const data = await res.json();
        setLiveStatus(data.status as OrderStatus);
        if (TERMINAL.has(data.status)) clearInterval(id);
      } catch {
        // ignore, retry next tick
      }
    }, 10_000);

    return () => clearInterval(id);
  }, [order.id, order.status]);

  const isPix = order.payment_method === "pix";
  const isCancelled = liveStatus === "cancelled";
  const isDelivery = true; // delivery_type not stored on order, default to delivery labels

  const steps = isPix
    ? ALL_STEPS
    : ALL_STEPS.filter((s) => s.key !== "awaiting_payment" && s.key !== "paid");

  const currentIdx = STATUS_ORDER.indexOf(liveStatus);

  function stepState(step: Step): "done" | "current" | "pending" {
    const stepIdx = STATUS_ORDER.indexOf(step.key);
    if (currentIdx > stepIdx) return "done";
    if (currentIdx === stepIdx) return "current";
    return "pending";
  }

  const orderRef = order.id.slice(0, 8).toUpperCase();
  const createdAt = new Date(order.created_at).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          {establishment.logo_url && !logoError ? (
            <img
              src={establishment.logo_url}
              alt={establishment.name}
              onError={() => setLogoError(true)}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: brand }}
            >
              {establishment.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {establishment.name}
            </p>
            <p className="text-xs text-gray-400">Acompanhar pedido</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 p-4">
        {/* Order meta */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Pedido</p>
              <p className="text-lg font-bold text-gray-900">#{orderRef}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">{createdAt}</p>
              <p className="text-sm font-semibold text-gray-700">
                {PAYMENT_LABELS[order.payment_method]}
              </p>
            </div>
          </div>
        </div>

        {/* Status timeline */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="mb-4 text-sm font-semibold text-gray-700">Status do pedido</p>

          {isCancelled ? (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4">
              <span className="text-2xl">❌</span>
              <div>
                <p className="font-semibold text-red-800">Pedido cancelado</p>
                <p className="text-xs text-red-600">
                  Entre em contato com o estabelecimento.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step, i) => {
                const state = stepState(step);
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg transition-all duration-500 ${
                          state === "done"
                            ? "bg-green-100 text-green-700"
                            : state === "current"
                            ? "text-white shadow-md"
                            : "bg-gray-100 text-gray-400"
                        }`}
                        style={state === "current" ? { backgroundColor: brand } : {}}
                      >
                        {state === "done" ? "✓" : step.icon}
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          className={`mt-1 w-0.5 transition-all duration-500 ${
                            state === "done" ? "bg-green-200" : "bg-gray-200"
                          }`}
                          style={{ height: "20px" }}
                        />
                      )}
                    </div>
                    <div className="pt-2">
                      <p
                        className={`text-sm font-medium transition-all duration-300 ${
                          state === "done"
                            ? "text-green-700"
                            : state === "current"
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      {state === "current" && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          {step.key === "awaiting_payment" &&
                            "Pague via Pix para confirmar"}
                          {step.key === "preparing" &&
                            "Seu pedido está sendo preparado com carinho"}
                          {step.key === "out_for_delivery" &&
                            (isDelivery
                              ? "A caminho do seu endereço"
                              : "Pode vir buscar seu pedido!")}
                        </p>
                      )}
                    </div>
                    {state === "current" && (
                      <div className="ml-auto pt-2">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: brand }}>
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                          Agora
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {liveStatus !== "delivered" && !isCancelled && (
            <p className="mt-4 text-center text-xs text-gray-400">
              Atualizado automaticamente a cada 10 segundos
            </p>
          )}
        </div>

        {/* Order items */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-gray-700">Itens do pedido</p>
          <div className="space-y-2">
            {order.order_items.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.quantity}× {item.item_name}
                  </span>
                  <span className="font-medium text-gray-900">
                    {fmt(item.unit_price * item.quantity)}
                  </span>
                </div>
                {(item.notes ||
                  (Array.isArray(item.addons) && item.addons.length > 0)) && (
                  <p className="text-xs text-gray-400">
                    {[
                      Array.isArray(item.addons)
                        ? item.addons.map((a) => a.name).join(", ")
                        : "",
                      item.notes,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            ))}
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Taxa de entrega</span>
                <span>{fmt(order.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-gray-900">
              <span>Total</span>
              <span>{fmt(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Back to menu */}
        <a
          href={`/cardapio/${establishment.slug}`}
          className="block w-full rounded-2xl border border-gray-200 bg-white py-3 text-center text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Voltar ao cardápio
        </a>

        <PublicFooter />
      </main>
    </div>
  );
}
