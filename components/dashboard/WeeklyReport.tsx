"use client";

import { useEffect, useState } from "react";

type Period = "7" | "30" | "month";

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

interface ReportData {
  period_start: string;
  period_end: string;
  total_days: number;
  period_revenue: number;
  period_orders: number;
  paid_orders: number;
  cancelled_orders: number;
  avg_order_value: number;
  daily_avg: number;
  conversion_rate: number;
  delivery_revenue: number;
  days: DayData[];
  top_items: TopItem[];
  payment_methods: Record<string, number>;
  order_types: { local: number; pickup: number; delivery: number; unknown: number };
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  cash: "Dinheiro",
  meal_voucher: "Vale-refeição",
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  local: "Consumo no local",
  pickup: "Retirada",
  delivery: "Delivery",
  unknown: "Não identificado",
};

const PERIODS: { value: Period; label: string }[] = [
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "month", label: "Este mês" },
];

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${accent ? "border-brand/30 bg-brand/5" : "border-gray-200 bg-white"}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${accent ? "text-brand" : "text-gray-900"}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function RevenueChart({ days }: { days: DayData[] }) {
  const max = Math.max(...days.map((d) => d.revenue), 1);
  const showAllLabels = days.length <= 10;

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {days.map((day, i) => {
          const pct = (day.revenue / max) * 100;
          const showLabel = showAllLabels || i % 5 === 0 || i === days.length - 1;
          return (
            <div key={day.date} className="group relative flex flex-1 flex-col items-center" style={{ height: 120 }}>
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                {day.revenue > 0 ? fmt(day.revenue) : "R$ 0"}<br />
                <span className="text-gray-400">{day.label}</span>
              </div>
              {/* Bar track */}
              <div className="relative mt-auto w-full rounded-t-sm" style={{ height: 88 }}>
                <div className="absolute inset-0 rounded-t-sm bg-gray-100" />
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-brand transition-all duration-500"
                  style={{ height: `${Math.max(pct, day.revenue > 0 ? 2 : 0)}%` }}
                />
              </div>
              {/* Label */}
              <span className={`mt-1 truncate text-center text-[9px] leading-none text-gray-400 ${showLabel ? "opacity-100" : "opacity-0"}`}>
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HorizontalBar({
  label,
  value,
  total,
  count,
}: {
  label: string;
  value: number;
  total: number;
  count: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <li>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">
          {count} <span className="text-xs font-normal text-gray-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-brand transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl bg-gray-200" />)}
      </div>
      <div className="h-48 rounded-2xl bg-gray-200" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-52 rounded-2xl bg-gray-200" />
        <div className="h-52 rounded-2xl bg-gray-200" />
      </div>
    </div>
  );
}

export default function WeeklyReport() {
  const [period, setPeriod] = useState<Period>("7");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/reports/weekly?period=${period}`)
      .then((r) => r.json())
      .then((json: ReportData & { error?: string }) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, [period]);

  const totalPayments = data
    ? Object.values(data.payment_methods).reduce((s, v) => s + v, 0)
    : 0;

  const totalOrderTypes = data
    ? Object.values(data.order_types).reduce((s, v) => s + v, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              period === p.value
                ? "bg-brand text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {p.label}
          </button>
        ))}
        {data && (
          <span className="ml-auto text-xs text-gray-400">
            {fmtDate(data.period_start)} – {fmtDate(data.period_end)}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && <Skeleton />}

      {!loading && data && (
        <>
          {/* Stats cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Faturamento"
              value={fmt(data.period_revenue)}
              sub={`${data.paid_orders} pedidos pagos`}
              accent
            />
            <StatCard
              label="Ticket médio"
              value={fmt(data.avg_order_value)}
              sub="Por pedido pago"
            />
            <StatCard
              label="Média diária"
              value={fmt(data.daily_avg)}
              sub={`${data.total_days} dias no período`}
            />
            <StatCard
              label="Total de pedidos"
              value={String(data.period_orders)}
              sub={`${data.conversion_rate}% pagos${data.cancelled_orders > 0 ? ` · ${data.cancelled_orders} cancelados` : ""}`}
            />
          </div>

          {data.delivery_revenue > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
              <svg className="h-4 w-4 shrink-0 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <span className="text-sm text-sky-800">
                <span className="font-semibold">{fmt(data.delivery_revenue)}</span> arrecadados em taxas de entrega no período
              </span>
            </div>
          )}

          {/* Revenue chart */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">Faturamento por dia</h3>
            {data.days.every((d) => d.revenue === 0) ? (
              <p className="py-6 text-center text-sm text-gray-400">Nenhum faturamento no período.</p>
            ) : (
              <RevenueChart days={data.days} />
            )}
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
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="w-5 shrink-0 text-xs font-bold text-gray-300">
                          {i + 1}
                        </span>
                        <span className="truncate text-sm font-medium text-gray-800">{item.name}</span>
                      </div>
                      <div className="ml-2 shrink-0 text-right">
                        <span className="text-sm font-bold text-gray-900">{item.quantity}×</span>
                        <span className="ml-2 text-xs text-gray-400">{fmt(item.revenue)}</span>
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
                <ul className="space-y-4">
                  {Object.entries(data.payment_methods)
                    .sort((a, b) => b[1] - a[1])
                    .map(([method, count]) => (
                      <HorizontalBar
                        key={method}
                        label={PAYMENT_LABELS[method] ?? method}
                        value={count}
                        total={totalPayments}
                        count={count}
                      />
                    ))}
                </ul>
              )}
            </div>
          </div>

          {/* Order types */}
          {totalOrderTypes > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">Tipo de pedido</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {(["local", "pickup", "delivery", "unknown"] as const)
                  .filter((t) => data.order_types[t] > 0)
                  .map((type) => {
                    const count = data.order_types[type];
                    const pct = totalOrderTypes > 0 ? Math.round((count / totalOrderTypes) * 100) : 0;
                    return (
                      <div key={type} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">{count}</p>
                        <p className="mt-0.5 text-xs font-medium text-gray-500">{ORDER_TYPE_LABELS[type]}</p>
                        <p className="mt-1 text-xs text-gray-400">{pct}%</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <p className="text-right text-xs text-gray-400">
            Atualizado ao abrir a página · dados em horário UTC
          </p>
        </>
      )}
    </div>
  );
}
