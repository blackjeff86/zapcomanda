"use client";

import React, { useState } from "react";

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
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

type TabKey = "all" | "active" | "overdue" | "trial";

function StatusBadge({ client }: { client: ClientData }) {
  if (client.subscription_status === "overdue") {
    const isCritical = client.days_overdue >= 20;
    return (
      <span
        className={`inline-flex px-2 py-1 rounded text-[12px] font-bold uppercase tracking-tight ${
          isCritical ? "bg-error text-on-error" : "bg-error-container text-error"
        }`}
      >
        Em atraso
      </span>
    );
  }
  if (client.subscription_status === "trial") {
    return (
      <span className="inline-flex px-2 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[12px] font-bold uppercase tracking-tight">
        Período de Teste
      </span>
    );
  }
  if (client.subscription_status === "active") {
    return (
      <span className="inline-flex px-2 py-1 rounded bg-secondary-container/20 text-secondary text-[12px] font-bold uppercase tracking-tight">
        Em dia
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-1 rounded bg-surface-container text-on-surface-variant text-[12px] font-bold uppercase tracking-tight">
      {client.subscription_status}
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
  if (plan === "premium") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary-container text-on-primary text-[11px] font-bold">
        <span className="material-symbols-outlined text-[14px]">star</span>
        PREMIUM
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[11px] font-bold">
      BASIC
    </span>
  );
}

function OverdueCell({ client }: { client: ClientData }) {
  if (client.subscription_status !== "overdue" || client.days_overdue === 0) {
    return <span className="text-on-surface-variant opacity-30">—</span>;
  }
  const isCritical = client.days_overdue >= 20;
  return (
    <span className={`flex items-center gap-1 tabular-nums font-semibold ${isCritical ? "text-error font-extrabold" : "text-error"}`}>
      <span className="material-symbols-outlined text-[16px]">
        {isCritical ? "emergency" : "history"}
      </span>
      {client.days_overdue} dias
    </span>
  );
}

function ExpirationCell({ client }: { client: ClientData }) {
  if (client.subscription_status === "trial") {
    return (
      <span className="tabular-nums text-tertiary font-bold">
        Expira em {client.trial_days_left}d
      </span>
    );
  }
  if (client.subscription_status === "overdue" && client.days_overdue >= 20) {
    return <span className="tabular-nums text-error font-bold">SUSPENSO EM BREVE</span>;
  }
  if (client.last_payment_at) {
    return (
      <span className="tabular-nums text-on-surface font-medium">
        {fmtDate(client.last_payment_at)}
      </span>
    );
  }
  return <span className="tabular-nums text-on-surface-variant">{fmtDate(client.trial_ends_at)}</span>;
}

function ActionCell({
  client,
  loadingId,
  feedback,
  onReminder,
  onMarkPaid,
}: {
  client: ClientData;
  loadingId: string | null;
  feedback: string | undefined;
  onReminder: (id: string) => void;
  onMarkPaid: (id: string) => void;
}) {
  if (feedback) {
    return <span className="text-[12px] font-medium text-secondary">{feedback}</span>;
  }

  if (client.subscription_status === "overdue") {
    const hasNotif =
      client.latest_notification &&
      (client.latest_notification.status === "pending" ||
        client.latest_notification.status === "confirmed");
    return (
      <div className="flex justify-end items-center gap-2">
        <button
          type="button"
          disabled={loadingId === client.id}
          onClick={() => onReminder(client.id)}
          title={hasNotif ? "Reenviar lembrete" : "Enviar cobrança"}
          className="p-2 text-primary hover:bg-primary-container/10 rounded-lg transition-all active:scale-90 disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[20px]">notifications_active</span>
        </button>
        <button
          type="button"
          disabled={loadingId === client.id}
          onClick={() => onMarkPaid(client.id)}
          title="Confirmar pagamento"
          className="p-2 text-secondary hover:bg-secondary-container/20 rounded-lg transition-all active:scale-90 disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
        </button>
        <button
          type="button"
          className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg opacity-0 group-hover:opacity-100 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      </div>
    );
  }

  if (client.subscription_status === "trial") {
    return (
      <div className="flex justify-end items-center gap-2">
        <button
          type="button"
          className="px-3 py-1.5 bg-primary/10 text-primary text-[12px] font-bold rounded-lg hover:bg-primary hover:text-on-primary transition-all"
        >
          Converter
        </button>
        <button
          type="button"
          className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg opacity-0 group-hover:opacity-100 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-end items-center gap-2">
      <button
        type="button"
        disabled
        className="p-2 text-outline opacity-20 cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
      </button>
      <button
        type="button"
        title="Ver detalhes"
        className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all"
      >
        <span className="material-symbols-outlined text-[20px]">visibility</span>
      </button>
      <button
        type="button"
        className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg opacity-0 group-hover:opacity-100 transition-all"
      >
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>
    </div>
  );
}

export default function ClientesPanel({
  initialClients,
}: {
  initialClients: ClientData[];
}) {
  const [clients, setClients] = useState<ClientData[]>(initialClients);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState<string | null>(null);

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
    setTimeout(
      () => setFeedbacks((p) => { const n = { ...p }; delete n[id]; return n; }),
      4000
    );
  };

  const changePlan = async (id: string, plan: "basic" | "pro") => {
    setPlanLoading(id);
    const res = await fetch(`/api/admin/clients/${id}/change-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const json = (await res.json()) as { error?: string; plan?: string };
    if (res.ok) {
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, plan: json.plan ?? plan } : c))
      );
      setFeedbacks((p) => ({ ...p, [`plan-${id}`]: `Plano alterado para ${plan.toUpperCase()}` }));
      setTimeout(
        () => setFeedbacks((p) => { const n = { ...p }; delete n[`plan-${id}`]; return n; }),
        3000
      );
    } else {
      setFeedbacks((p) => ({ ...p, [`plan-${id}`]: json.error ?? "Erro ao migrar" }));
    }
    setPlanLoading(null);
  };

  const markPaid = async (id: string) => {
    setLoadingId(id);
    const res = await fetch(`/api/admin/clients/${id}/mark-paid`, { method: "POST" });
    const json = (await res.json()) as { error?: string };
    setFeedbacks((p) => ({ ...p, [id]: res.ok ? "Pago!" : (json.error ?? "Erro") }));
    if (res.ok) await refresh();
    setLoadingId(null);
    setTimeout(
      () => setFeedbacks((p) => { const n = { ...p }; delete n[id]; return n; }),
      4000
    );
  };

  const overdueClients = clients.filter((c) => c.subscription_status === "overdue");
  const trialClients = clients.filter((c) => c.subscription_status === "trial");
  const activeClients = clients.filter((c) => c.subscription_status === "active");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Em Dia" },
    { key: "overdue", label: "Em Atraso" },
    { key: "trial", label: "Período de Teste" },
  ];

  const visible =
    activeTab === "all"
      ? clients
      : activeTab === "active"
      ? activeClients
      : activeTab === "overdue"
      ? overdueClients
      : trialClients;

  const totalClients = clients.length;
  const mrr = activeClients.reduce((s, c) => s + c.plan_amount, 0);
  const atRisk = overdueClients.reduce((s, c) => s + c.plan_amount, 0);

  return (
    <div className="max-w-[1440px] mx-auto p-6 md:p-8 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[30px] font-bold leading-[38px] tracking-tight text-on-surface">
            Gestão de Clientes
          </h2>
          <p className="text-body-md text-on-surface-variant">
            Monitore estabelecimentos, planos e status de pagamento em tempo real.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md font-medium text-on-surface-variant hover:bg-surface-container transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            Filtros Avançados
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-primary text-on-primary rounded-lg text-body-md font-medium hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Novo Estabelecimento
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-transform">
          <div className="flex justify-between items-start mb-1">
            <p className="text-label-md text-on-surface-variant">Total de Clientes</p>
            <span className="p-1.5 bg-primary-container/10 text-primary rounded-lg material-symbols-outlined text-[20px]">storefront</span>
          </div>
          <p className="text-[30px] font-bold leading-[38px] tabular-nums text-on-surface">{totalClients.toLocaleString("pt-BR")}</p>
          <div className="mt-2 flex items-center gap-1 text-[12px] text-secondary">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span className="font-bold">+{trialClients.length}</span>
            <span className="text-on-surface-variant font-normal opacity-60">em teste</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-transform">
          <div className="flex justify-between items-start mb-1">
            <p className="text-label-md text-on-surface-variant">Em Dia</p>
            <span className="p-1.5 bg-secondary-container/20 text-secondary rounded-lg material-symbols-outlined text-[20px]">verified</span>
          </div>
          <p className="text-[30px] font-bold leading-[38px] tabular-nums text-on-surface">{activeClients.length.toLocaleString("pt-BR")}</p>
          <div className="mt-2 flex items-center gap-1 text-[12px] text-secondary">
            <span className="font-bold">
              {totalClients > 0 ? Math.round((activeClients.length / totalClients) * 100) : 0}%
            </span>
            <span className="text-on-surface-variant font-normal opacity-60">da base</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-transform">
          <div className="flex justify-between items-start mb-1">
            <p className="text-label-md text-on-surface-variant">Em Atraso</p>
            <span className="p-1.5 bg-error-container text-error rounded-lg material-symbols-outlined text-[20px]">warning</span>
          </div>
          <p className="text-[30px] font-bold leading-[38px] tabular-nums text-error">{overdueClients.length.toLocaleString("pt-BR")}</p>
          <div className="mt-2 flex items-center gap-1 text-[12px] text-error">
            <span className="material-symbols-outlined text-[14px]">priority_high</span>
            <span className="font-bold">{fmt(atRisk)}</span>
            <span className="text-on-surface-variant font-normal opacity-60">pendente</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-transform">
          <div className="flex justify-between items-start mb-1">
            <p className="text-label-md text-on-surface-variant">Período de Teste</p>
            <span className="p-1.5 bg-tertiary-container/10 text-tertiary rounded-lg material-symbols-outlined text-[20px]">timer</span>
          </div>
          <p className="text-[30px] font-bold leading-[38px] tabular-nums text-on-surface">{trialClients.length.toLocaleString("pt-BR")}</p>
          <div className="mt-2 flex items-center gap-1 text-[12px] text-on-surface-variant">
            <span className="font-bold">MRR {fmt(mrr)}</span>
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
              className={`px-4 py-2 rounded-full text-label-md font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-primary-container/10 text-primary border border-primary"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-body-sm text-on-surface-variant mr-2">Ordenar por:</span>
          <select className="bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-primary focus:border-primary px-2 py-1.5 min-w-[140px]">
            <option>Mais recentes</option>
            <option>Atraso (Maior)</option>
            <option>Vencimento Próximo</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        {visible.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-[48px] text-outline-variant">inbox</span>
            <p className="mt-3 text-body-md font-medium text-on-surface-variant">
              Nenhum estabelecimento nesta categoria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant text-label-md border-b border-outline-variant uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Estabelecimento</th>
                  <th className="px-6 py-4 font-semibold">Plano</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Dias de Atraso</th>
                  <th className="px-6 py-4 font-semibold">Expiração / Último Pgto</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {visible.map((client) => {
                  const isCritical =
                    client.subscription_status === "overdue" && client.days_overdue >= 20;
                  const isExpanded = expandedId === client.id;
                  return (
                    <React.Fragment key={client.id}>
                    <tr
                      key={client.id}
                      onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}
                      className={`hover:bg-surface-container-low transition-colors group cursor-pointer ${
                        isCritical ? "bg-error-container/5" : ""
                      } ${expandedId === client.id ? "bg-surface-container-low" : ""}`}
                    >
                      {/* Establishment */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                              client.subscription_status === "overdue"
                                ? "bg-error-container text-error"
                                : client.subscription_status === "trial"
                                ? "bg-tertiary-fixed text-on-tertiary-fixed"
                                : "bg-surface-container-high text-on-surface-variant"
                            }`}
                          >
                            {initials(client.name)}
                          </div>
                          <div>
                            <p className="text-body-md font-bold text-on-surface">
                              {client.name}
                            </p>
                            <p className="text-[11px] text-on-surface-variant opacity-70">
                              {client.whatsapp_number.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3")}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-6 py-4">
                        <PlanBadge plan={client.plan} />
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge client={client} />
                      </td>

                      {/* Days overdue */}
                      <td className="px-6 py-4">
                        <OverdueCell client={client} />
                      </td>

                      {/* Expiration */}
                      <td className="px-6 py-4">
                        <ExpirationCell client={client} />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <ActionCell
                          client={client}
                          loadingId={loadingId}
                          feedback={feedbacks[client.id]}
                          onReminder={sendReminder}
                          onMarkPaid={markPaid}
                        />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-surface-container-low border-b border-outline-variant">
                        <td colSpan={6} className="px-8 py-5">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                            <div>
                              <p className="text-label-sm text-on-surface-variant mb-2 font-semibold uppercase tracking-wider">
                                Migração de Plano
                              </p>
                              <div className="flex items-center gap-3">
                                {(["basic", "pro"] as const).map((p) => {
                                  const isCurrent = client.plan === p;
                                  const isLoading = planLoading === client.id;
                                  return (
                                    <button
                                      key={p}
                                      type="button"
                                      disabled={isCurrent || isLoading}
                                      onClick={(e) => { e.stopPropagation(); changePlan(client.id, p); }}
                                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                        isCurrent
                                          ? "bg-primary text-on-primary cursor-default"
                                          : "border border-outline-variant text-on-surface-variant hover:bg-primary/10 hover:text-primary hover:border-primary disabled:opacity-40"
                                      }`}
                                    >
                                      {isCurrent ? `✓ ${p.toUpperCase()} (atual)` : `Migrar para ${p.toUpperCase()}`}
                                    </button>
                                  );
                                })}
                                {planLoading === client.id && (
                                  <span className="text-xs text-on-surface-variant animate-pulse">Salvando...</span>
                                )}
                                {feedbacks[`plan-${client.id}`] && (
                                  <span className="text-xs font-medium text-secondary">{feedbacks[`plan-${client.id}`]}</span>
                                )}
                              </div>
                            </div>
                            <div className="sm:ml-auto text-right">
                              <p className="text-label-sm text-on-surface-variant">Cadastro</p>
                              <p className="text-body-sm font-medium text-on-surface">{fmtDate(client.created_at)}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-body-sm text-on-surface-variant">
            Exibindo <span className="font-semibold text-on-surface">{visible.length}</span>{" "}
            de <span className="font-semibold text-on-surface">{totalClients}</span>{" "}
            estabelecimentos
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
