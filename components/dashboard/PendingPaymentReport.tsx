"use client";

import type { OrderRow } from "@/lib/orders/normalize";
import {
  filterAwaitingDeliveryPayment,
  filterDeliveredWithoutPayment,
} from "@/lib/orders/pending-payment";
import { PAYMENT_METHOD_SHORT } from "@/lib/payments/methods";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PendingPaymentReport({ orders }: { orders: OrderRow[] }) {
  const awaiting = filterAwaitingDeliveryPayment(orders);
  const anomalies = filterDeliveredWithoutPayment(orders);

  if (awaiting.length === 0 && anomalies.length === 0) return null;

  return (
    <div className="mb-6 space-y-4">
      {awaiting.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <h3 className="font-bold text-amber-950">
            Cobrar na entrega ({awaiting.length})
          </h3>
          <p className="mt-1 text-sm text-amber-900">
            Pedidos em andamento com pagamento pendente — confirme o recebimento ao entregar.
          </p>
          <ul className="mt-3 divide-y divide-amber-200/80 rounded-xl border border-amber-200 bg-white">
            {awaiting.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
              >
                <div>
                  <span className="font-semibold text-gray-900">
                    {order.customers.name || "Cliente"}
                  </span>
                  <span className="ml-2 text-gray-500">{formatTime(order.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {order.payment_method && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                      {PAYMENT_METHOD_SHORT[order.payment_method]}
                    </span>
                  )}
                  <span className="font-bold text-gray-900">
                    {formatCurrency(Number(order.total_amount))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {anomalies.length > 0 && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
          <h3 className="font-bold text-red-950">
            Entregues sem pagamento confirmado ({anomalies.length})
          </h3>
          <p className="mt-1 text-sm text-red-900">
            Estes pedidos foram marcados como entregues, mas o pagamento não foi registrado.
            Revise manualmente.
          </p>
          <ul className="mt-3 divide-y divide-red-200/80 rounded-xl border border-red-200 bg-white">
            {anomalies.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
              >
                <span className="font-semibold text-gray-900">
                  {order.customers.name || "Cliente"}
                </span>
                <span className="font-bold text-red-700">
                  {formatCurrency(Number(order.total_amount))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
