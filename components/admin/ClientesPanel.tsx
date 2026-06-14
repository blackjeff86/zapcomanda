"use client";

import { useState } from "react";

type SubStatus = "trial" | "active" | "overdue" | "cancelled";

interface ClientData {
  id: string;
  name: string;
  slug: string;
  whatsapp_number: string;
  created_at: string;
  plan: string;
  subscription_status: SubStatus | string;
  trial_ends_at: string;
  trial_days_left: number;
  plan_amount: number;
  days_overdue: number;
  last_payment_at: string | null;
  latest_notification: {
    id: string;
    status: string;
    amount: number;
    sent_at: string;
  } | null;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

const fmtPhone = (phone: string) =>
  phone.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

type Tab = "overdue" | "trial" | "active";

function StatusChip({ client }: { client: ClientData }) {
  if (client.subscription_status === "overdue") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400 ring-1 ring-inset ring-red-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        {client.days_overdue > 0 ? `${client.days_overdue}d atraso` : "Vencido"}
      </span>
    );
  }
  if (client.subscription_status === "trial") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Trial · {client.trial_days_left}d
      </span>
    );
  }
  if (client.subscription_status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        Em dia
      </span>
    );
  }
  return <span className="text-xs text-gray-500">{client.subscription_status}</span>;
}

function PlanChip({ plan }: { plan: string }) {
  if (plan === "pro") {
    return (
      <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-xs font-bold text-violet-400 ring-1 ring-inset ring-violet-500/20">
        Pro
      </span>
    );
  }
  return (
    <span className="rounded-md bg-sky-500/15 px-2 py-0.5 text-xs font-bold text-sky-400 ring-1 ring-inset ring-sky-500/20">
      Basic
    </span>
  );
}

function NotifChip({ notif }: { notif: ClientData["latest_notification"] }) {
  if (!notif) return <span className="text-xs text-gray-600">—</span>;
  if (notif.status === "confirmed") {
    return <span className="text-xs font-medium text-amber-400">Aguardando verificação</span>;
  }
  if (notif.status === "pending") {
    return <span className="text-xs text-gray-500">Cobrado {fmtDate(notif.sent_at)}</span>;
  }
  if (notif.status === "verified") {
    return <span className="text-xs font-medium text-emerald-400">Verificado</span>;
  }
  return null;
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-white/5 bg-gray-900 px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600">{sub}</p>}
    </div>
  );
}

export default function ClientesPanel({ initialClients }: { initialClients: ClientData[] }) {
  const [clients, setClients] = useState<ClientData[]>(initialClients);
  const [activeTab, setActiveTab] = useState<Tab>("overdue");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  const refresh = async () => {
    const res = await fetch("/api/admin/clients");
    if (res.ok) setClients((await res.json()) as ClientData[]);
  };

  const sendReminder = async (id: string) => {
    setLoadingId(id);
    const res = await fetch(`/api/admin/clients/${id}/billing-reminder`, { method: "POST" });
    const json = (await res.json()) as { error?: string };
    setFeedbacks((p) => ({ ...p, [id]: res.ok ? "Lembrete enviado!" : (json.error ?? "Erro") }));
    if (res.ok) await refresh();
    setLoadingId(null);
    setTimeout(() => setFeedbacks((p) => { const n = { ...p }; delete n[id]; return n; }), 4000);
  };

  const markPaid = async (id: string) => {
    setLoadingId(id);
    const res = await fetch(`/api/admin/clients/${id}/mark-paid`, { method: "POST" });
    const json = (await res.json()) as { error?: string };
    setFeedbacks((p) => ({ ...p, [id]: res.ok ? "Pago!" : (json.error ?? "Erro") }));
    if (res.ok) await refresh();
    setLoadingId(null);
    setTimeout(() => setFeedbacks((p) => { const n = { ...p }; delete n[id]; return n; }), 4000);
  };

  const overdueClients = clients.filter((c) => c.subscription_status === "overdue");
  const trialClients = clients.filter((c) => c.subscription_status === "trial");
  const activeClients = clients.filter((c) => c.subscription_status === "active");

  const mrr = activeClients.reduce((s, c) => s + c.plan_amount, 0);
  const atRisk = overdueClients.reduce((s, c) => s + c.plan_amount, 0);
  const totalClients = clients.length;

  const tabs: { key: Tab; label: string; count: number; accent: string }[] = [
    { key: "overdue", label: "Em atraso", count: overdueClients.length, accent: "text-red-400" },
    { key: "trial", label: "Trial", count: trialClients.length, accent: "text-amber-400" },
    { key: "active", label: "Em dia", count: activeClients.length, accent: "text-emerald-400" },
  ];

  const visible =
    activeTab === "overdue" ? overdueClients : activeTab === "trial" ? trialClients : activeClients;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Clientes</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {totalClients} estabelecimento{totalClients !== 1 ? "s" : ""} cadastrado{totalClients !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Em atraso" value={overdueClients.length} sub={atRisk > 0 ? `${fmt(atRisk)} em risco` : "nenhum"} accent="text-red-400" />
        <MetricCard label="Trial" value={trialClients.length} sub="período de teste" accent="text-amber-400" />
        <MetricCard label="Ativos" value={activeClients.length} sub="assinaturas pagas" accent="text-emerald-400" />
        <MetricCard label="MRR" value={fmt(mrr)} sub="receita recorrente/mês" accent="text-violet-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-px rounded-lg border border-white/5 bg-gray-900 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-gray-800 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
            <span
              className={`tabular-nums text-xs font-bold ${
                activeTab === tab.key ? tab.accent : "text-gray-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-gray-900 py-20 text-center">
          <svg className="mb-3 h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-gray-400">Nenhum estabelecimento aqui</p>
          <p className="mt-1 text-xs text-gray-600">Esta aba está vazia no momento.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/5 bg-gray-900">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 border-b border-white/5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
            <span className="w-8" />
            <span>Estabelecimento</span>
            <span className="hidden sm:block">Plano</span>
            <span className="hidden sm:block">Valor</span>
            <span>Situação</span>
            <span className="hidden sm:block">Ações</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5">
            {visible.map((client) => {
              const isOverdue = client.subscription_status === "overdue";
              const hasPendingOrConfirmed =
                client.latest_notification &&
                (client.latest_notification.status === "pending" ||
                  client.latest_notification.status === "confirmed");

              return (
                <div
                  key={client.id}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isOverdue
                        ? "bg-red-900/60 text-red-300"
                        : client.subscription_status === "trial"
                        ? "bg-amber-900/60 text-amber-300"
                        : "bg-emerald-900/60 text-emerald-300"
                    }`}
                  >
                    {initials(client.name)}
                  </div>

                  {/* Name + phone */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{client.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{fmtPhone(client.whatsapp_number)}</span>
                      <span>·</span>
                      <NotifChip notif={client.latest_notification} />
                    </div>
                  </div>

                  {/* Plan */}
                  <div className="hidden sm:block">
                    <PlanChip plan={client.plan} />
                  </div>

                  {/* Amount */}
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold text-white">{fmt(client.plan_amount)}</p>
                    <p className="text-[10px] text-gray-600">/mês</p>
                  </div>

                  {/* Status */}
                  <div>
                    <StatusChip client={client} />
                  </div>

                  {/* Actions */}
                  <div className="hidden items-center gap-2 sm:flex">
                    {feedbacks[client.id] ? (
                      <span className="text-xs text-emerald-400">{feedbacks[client.id]}</span>
                    ) : isOverdue ? (
                      <>
                        <button
                          type="button"
                          disabled={loadingId === client.id}
                          onClick={() => sendReminder(client.id)}
                          title={hasPendingOrConfirmed ? "Reenviar cobrança" : "Enviar cobrança"}
                          className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-300 transition hover:bg-white/10 disabled:opacity-40"
                        >
                          {hasPendingOrConfirmed ? "Reenviar" : "Cobrar"}
                        </button>
                        <button
                          type="button"
                          disabled={loadingId === client.id}
                          onClick={() => markPaid(client.id)}
                          className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40"
                        >
                          Pago ✓
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-700">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
