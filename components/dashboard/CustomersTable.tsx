"use client";

import { useMemo, useState } from "react";

export type CustomerWithStats = {
  id: string;
  name: string | null;
  phone: string;
  created_at: string;
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
  activity: "active" | "at_risk" | "dormant" | "new";
};

const ACTIVITY_CONFIG = {
  active: { label: "Ativo", classes: "bg-green-100 text-green-700" },
  at_risk: { label: "Em risco", classes: "bg-amber-100 text-amber-700" },
  dormant: { label: "Sumido", classes: "bg-gray-100 text-gray-500" },
  new: { label: "Novo", classes: "bg-blue-100 text-blue-700" },
};

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

type Filter = "all" | "active" | "at_risk" | "dormant" | "new";

export default function CustomersTable({ customers }: { customers: CustomerWithStats[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(
    () => ({
      all: customers.length,
      active: customers.filter((c) => c.activity === "active").length,
      at_risk: customers.filter((c) => c.activity === "at_risk").length,
      dormant: customers.filter((c) => c.activity === "dormant").length,
      new: customers.filter((c) => c.activity === "new").length,
    }),
    [customers]
  );

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesFilter = filter === "all" || c.activity === filter;
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        (c.name ?? "").toLowerCase().includes(q) ||
        c.phone.includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [customers, filter, search]);

  const FILTER_LABELS: Record<Filter, string> = {
    all: `Todos (${counts.all})`,
    active: `Ativos (${counts.active})`,
    at_risk: `Em risco (${counts.at_risk})`,
    dormant: `Sumidos (${counts.dormant})`,
    new: `Novos (${counts.new})`,
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === f
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:bg-white sm:w-64"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16">
          <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-500">Nenhum cliente encontrado</p>
          <p className="mt-1 text-xs text-gray-400">
            {customers.length === 0
              ? "Clientes aparecem aqui após o primeiro pedido"
              : "Tente ajustar os filtros"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* Desktop table */}
          <div className="hidden sm:block">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Telefone
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Pedidos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Total gasto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Último pedido
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => {
                  const cfg = ACTIVITY_CONFIG[c.activity];
                  const initials = (c.name ?? c.phone)
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase();
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand">
                            {initials}
                          </div>
                          <span className="font-medium text-gray-900">{c.name ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{fmtPhone(c.phone)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {c.order_count}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {fmt(c.total_spent)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{fmtDate(c.last_order_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.classes}`}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-gray-100 sm:hidden">
            {filtered.map((c) => {
              const cfg = ACTIVITY_CONFIG[c.activity];
              const initials = (c.name ?? c.phone)
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase();
              return (
                <div key={c.id} className="flex items-start gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-gray-900">{c.name ?? fmtPhone(c.phone)}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.classes}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {c.name && <p className="mt-0.5 text-xs text-gray-500">{fmtPhone(c.phone)}</p>}
                    <div className="mt-1.5 flex gap-4 text-xs text-gray-500">
                      <span>{c.order_count} {c.order_count === 1 ? "pedido" : "pedidos"}</span>
                      <span>{fmt(c.total_spent)}</span>
                      <span>Últ. {fmtDate(c.last_order_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        {filtered.length} de {customers.length} clientes
      </p>
    </div>
  );
}
