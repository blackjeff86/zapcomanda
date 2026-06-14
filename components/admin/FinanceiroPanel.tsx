"use client";

import { useState } from "react";

type Billing = {
  id: string;
  establishmentId: string;
  establishmentName: string;
  plan: string;
  status: string;
  amount: number;
  sentAt: string;
};

type Stats = {
  mrr: number;
  receivedThisMonth: number;
  pendingVerification: number;
  overdueTotal: number;
};

type TabKey = "all" | "verified" | "confirmed" | "pending";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-secondary-container/20 text-secondary text-[12px] font-bold uppercase tracking-tight">
        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
        Verificado
      </span>
    );
  }
  if (status === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-primary-container/10 text-primary text-[12px] font-bold uppercase tracking-tight">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        A Verificar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[12px] font-bold uppercase tracking-tight">
      <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
      Aguardando
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  if (plan === "pro") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[11px] font-bold">
        PRO
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[11px] font-bold">
      BASIC
    </span>
  );
}

export default function FinanceiroPanel({
  stats,
  billings,
}: {
  stats: Stats;
  billings: Billing[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [localBillings, setLocalBillings] = useState<Billing[]>(billings);

  const refresh = async () => {
    const res = await fetch("/api/admin/clients");
    if (!res.ok) return;
  };

  const verify = async (billing: Billing) => {
    setLoadingId(billing.id);
    const res = await fetch(
      `/api/admin/clients/${billing.establishmentId}/mark-paid`,
      { method: "POST" }
    );
    const json = (await res.json()) as { error?: string };
    if (res.ok) {
      setLocalBillings((prev) =>
        prev.map((b) => (b.id === billing.id ? { ...b, status: "verified" } : b))
      );
      setFeedbacks((p) => ({ ...p, [billing.id]: "Verificado!" }));
    } else {
      setFeedbacks((p) => ({ ...p, [billing.id]: json.error ?? "Erro" }));
    }
    setLoadingId(null);
    setTimeout(
      () => setFeedbacks((p) => { const n = { ...p }; delete n[billing.id]; return n; }),
      4000
    );
  };

  const resend = async (billing: Billing) => {
    setLoadingId(billing.id);
    const res = await fetch(
      `/api/admin/clients/${billing.establishmentId}/billing-reminder`,
      { method: "POST" }
    );
    const json = (await res.json()) as { error?: string };
    setFeedbacks((p) => ({
      ...p,
      [billing.id]: res.ok ? "Reenviado!" : (json.error ?? "Erro"),
    }));
    if (res.ok) await refresh();
    setLoadingId(null);
    setTimeout(
      () => setFeedbacks((p) => { const n = { ...p }; delete n[billing.id]; return n; }),
      4000
    );
  };

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "Todos", count: localBillings.length },
    { key: "verified", label: "Verificados", count: localBillings.filter((b) => b.status === "verified").length },
    { key: "confirmed", label: "A Verificar", count: localBillings.filter((b) => b.status === "confirmed").length },
    { key: "pending", label: "Aguardando", count: localBillings.filter((b) => b.status === "pending").length },
  ];

  const visible =
    activeTab === "all"
      ? localBillings
      : localBillings.filter((b) => b.status === activeTab);

  return (
    <div className="max-w-[1440px] mx-auto p-6 md:p-8 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[30px] font-bold leading-[38px] tracking-tight text-on-surface">
            Financeiro
          </h2>
          <p className="text-body-md text-on-surface-variant">
            Gerencie cobranças, verificações de pagamento e receita recorrente.
          </p>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md font-medium text-on-surface-variant hover:bg-surface-container transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          Exportar Relatório
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* MRR */}
        <div className="bg-primary text-on-primary p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-1">
            <p className="text-label-md text-primary-fixed opacity-90">MRR</p>
            <div className="p-1.5 bg-primary-container rounded-lg">
              <span className="material-symbols-outlined text-[20px] text-on-primary">payments</span>
            </div>
          </div>
          <p className="text-[30px] font-bold leading-[38px] tabular-nums mt-4">{fmt(stats.mrr)}</p>
          <div className="flex items-center gap-1 mt-1 opacity-90">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span className="text-label-md font-bold">Receita recorrente/mês</span>
          </div>
        </div>

        {/* Received this month */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:-translate-y-0.5 transition-transform">
          <div className="flex justify-between items-start mb-1">
            <p className="text-label-md text-on-surface-variant">Recebido (mês)</p>
            <div className="p-1.5 bg-secondary-container/20 text-secondary rounded-lg">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
          </div>
          <p className="text-[30px] font-bold leading-[38px] tabular-nums text-on-surface mt-4">
            {fmt(stats.receivedThisMonth)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[12px] text-secondary">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            <span className="font-bold">Pagamentos verificados</span>
          </div>
        </div>

        {/* Pending verification */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:-translate-y-0.5 transition-transform">
          <div className="flex justify-between items-start mb-1">
            <p className="text-label-md text-on-surface-variant">A Verificar</p>
            <div className="p-1.5 bg-primary-container/10 text-primary rounded-lg">
              <span className="material-symbols-outlined text-[20px]">pending_actions</span>
            </div>
          </div>
          <p className="text-[30px] font-bold leading-[38px] tabular-nums text-on-surface mt-4">
            {fmt(stats.pendingVerification)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[12px] text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-bold">Clientes confirmaram pagamento</span>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:-translate-y-0.5 transition-transform">
          <div className="flex justify-between items-start mb-1">
            <p className="text-label-md text-on-surface-variant">Inadimplência</p>
            <div className="p-1.5 bg-error-container text-error rounded-lg">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
          </div>
          <p className="text-[30px] font-bold leading-[38px] tabular-nums text-error mt-4">
            {fmt(stats.overdueTotal)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[12px] text-error">
            <span className="material-symbols-outlined text-[14px]">priority_high</span>
            <span className="font-bold">Receita em risco</span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-label-md font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? "bg-primary-container/10 text-primary border border-primary"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {tab.label}
              <span
                className={`tabular-nums text-[11px] font-bold ${
                  activeTab === tab.key ? "text-primary" : "text-outline"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-body-sm text-on-surface-variant mr-2">Ordenar por:</span>
          <select className="bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-primary focus:border-primary px-2 py-1.5 min-w-[140px]">
            <option>Mais recentes</option>
            <option>Maior valor</option>
            <option>Status</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        {visible.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-[48px] text-outline-variant">receipt_long</span>
            <p className="mt-3 text-body-md font-medium text-on-surface-variant">
              Nenhum registro nesta categoria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant text-label-md border-b border-outline-variant uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Estabelecimento</th>
                  <th className="px-6 py-4 font-semibold">Plano</th>
                  <th className="px-6 py-4 font-semibold">Valor</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Data Envio</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {visible.map((billing) => (
                  <tr
                    key={billing.id}
                    className="hover:bg-surface-container-low transition-colors group"
                  >
                    {/* Establishment */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            billing.status === "verified"
                              ? "bg-secondary-container/30 text-secondary"
                              : billing.status === "confirmed"
                              ? "bg-primary-container/20 text-primary"
                              : "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {initials(billing.establishmentName)}
                        </div>
                        <p className="text-body-md font-semibold text-on-surface truncate max-w-[180px]">
                          {billing.establishmentName}
                        </p>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-6 py-4">
                      <PlanBadge plan={billing.plan} />
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4">
                      <span className="tabular-nums font-semibold text-on-surface text-body-md">
                        {fmt(billing.amount)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={billing.status} />
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <span className="tabular-nums text-body-sm text-on-surface-variant">
                        {fmtDate(billing.sentAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end items-center gap-2">
                        {feedbacks[billing.id] ? (
                          <span className="text-[12px] font-medium text-secondary">
                            {feedbacks[billing.id]}
                          </span>
                        ) : billing.status === "confirmed" ? (
                          <button
                            type="button"
                            disabled={loadingId === billing.id}
                            onClick={() => verify(billing)}
                            className="px-3 py-1.5 bg-secondary/10 text-secondary text-[12px] font-bold rounded-lg hover:bg-secondary hover:text-on-secondary transition-all active:scale-90 disabled:opacity-40 flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            Verificar pago
                          </button>
                        ) : billing.status === "pending" ? (
                          <button
                            type="button"
                            disabled={loadingId === billing.id}
                            onClick={() => resend(billing)}
                            className="px-3 py-1.5 bg-primary/10 text-primary text-[12px] font-bold rounded-lg hover:bg-primary hover:text-on-primary transition-all active:scale-90 disabled:opacity-40 flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">send</span>
                            Reenviar
                          </button>
                        ) : (
                          <span className="text-on-surface-variant opacity-30 text-body-sm">—</span>
                        )}
                        <button
                          type="button"
                          className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-body-sm text-on-surface-variant">
            Exibindo{" "}
            <span className="font-semibold text-on-surface">{visible.length}</span> de{" "}
            <span className="font-semibold text-on-surface">{localBillings.length}</span> cobranças
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="px-3 py-1.5 border border-outline-variant rounded-lg text-body-sm text-on-surface-variant disabled:opacity-40 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              Anterior
            </button>
            <button
              type="button"
              className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-body-sm font-semibold"
            >
              1
            </button>
            <button
              type="button"
              disabled
              className="px-3 py-1.5 border border-outline-variant rounded-lg text-body-sm text-on-surface-variant disabled:opacity-40 flex items-center gap-1"
            >
              Próxima
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
