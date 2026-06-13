"use client";

import { useEffect, useState } from "react";

interface DayData {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface WeeklyData {
  week_start: string;
  week_end: string;
  week_revenue: number;
  week_orders: number;
  paid_orders: number;
  avg_order_value: number;
  days: DayData[];
  top_items: TopItem[];
  payment_methods: Record<string, number>;
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  cash: "Dinheiro",
  meal_voucher: "Vale-refeição",
};

function RevenueBar({ days }: { days: DayData[] }) {
  const max = Math.max(...days.map((d) => d.revenue), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {days.map((day) => {
        const pct = (day.revenue / max) * 100;
        return (
          <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-gray-500 leading-none">
              {day.revenue > 0 ? formatCurrency(day.revenue).replace("R$ ", "R$") : ""}
            </span>
            <div className="w-full rounded-t-md bg-brand/20 relative" style={{ height: "80px" }}>
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-md bg-brand transition-all"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500 text-center leading-none">{day.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function WeeklyReport() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reports/weekly")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded-lg bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="h-40 rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Erro ao carregar relatório: {error}
      </div>
    );
  }

  if (!data) return null;

  const totalPayments = Object.values(data.payment_methods).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Faturamento da semana</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            {formatCurrency(data.week_revenue)}
          </p>
          <p className="mt-1 text-xs text-gray-400">Pedidos pagos</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total de pedidos</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            {data.week_orders}
          </p>
          <p className="mt-1 text-xs text-gray-400">{data.paid_orders} pagos</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Ticket médio</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            {formatCurrency(data.avg_order_value)}
          </p>
          <p className="mt-1 text-xs text-gray-400">Por pedido pago</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Média diária</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            {formatCurrency(data.week_revenue / 7)}
          </p>
          <p className="mt-1 text-xs text-gray-400">Últimos 7 dias</p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Faturamento por dia</h3>
        <RevenueBar days={data.days} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top items */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Itens mais vendidos</h3>
          {data.top_items.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum item vendido ainda.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.top_items.map((item, i) => (
                <li key={item.name} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                    <span className="truncate text-sm font-medium text-gray-800">{item.name}</span>
                  </div>
                  <div className="shrink-0 ml-2 text-right">
                    <span className="text-sm font-semibold text-gray-900">{item.quantity}x</span>
                    <span className="ml-2 text-xs text-gray-500">{formatCurrency(item.revenue)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Payment methods */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Formas de pagamento</h3>
          {totalPayments === 0 ? (
            <p className="text-sm text-gray-400">Nenhum pagamento registrado ainda.</p>
          ) : (
            <ul className="space-y-3">
              {Object.entries(data.payment_methods).map(([method, count]) => {
                const pct = Math.round((count / totalPayments) * 100);
                return (
                  <li key={method}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-700">{PAYMENT_LABELS[method] ?? method}</span>
                      <span className="font-semibold text-gray-900">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-brand"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Período: {data.week_start} a {data.week_end}. Atualizado ao abrir a página.
      </p>
    </div>
  );
}
