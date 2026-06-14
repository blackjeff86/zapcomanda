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
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

const fmtPhone = (phone: string) =>
  phone.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

type Tab = "overdue" | "trial" | "active";

const PLAN_LABEL: Record<string, string> = {
  basic: "Basic",
  pro: "Pro",
};

const PLAN_COLOR: Record<string, string> = {
  basic: "bg-sky-900/50 text-sky-300 ring-sky-700",
  pro: "bg-violet-900/50 text-violet-300 ring-violet-700",
};

function ClientCard({
  client,
  onSendReminder,
  onMarkPaid,
  loading,
  feedback,
}: {
  client: ClientData;
  onSendReminder: (id: string) => Promise<void>;
  onMarkPaid: (id: string) => Promise<void>;
  loading: boolean;
  feedback: string | null;
}) {
  const isOverdue = client.subscription_status === "overdue";
  const isTrial = client.subscription_status === "trial";
  const isActive = client.subscription_status === "active";

  const hasPendingOrConfirmed =
    client.latest_notification &&
    (client.latest_notification.status === "pending" ||
      client.latest_notification.status === "confirmed");

  const borderColor = isOverdue
    ? "border-l-red-500"
    : isTrial
    ? "border-l-amber-500"
    : "border-l-emerald-500";

  const avatarColor = isOverdue
    ? "bg-red-900/60 text-red-300"
    : isTrial
    ? "bg-amber-900/60 text-amber-300"
    : "bg-emerald-900/60 text-emerald-300";

  return (
    <div
      className={`rounded-xl border-l-4 bg-gray-800/60 ring-1 ring-white/5 transition hover:bg-gray-800 ${borderColor}`}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor}`}
        >
          {initials(client.name)}
        </div>

        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-white">{client.name}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${
                PLAN_COLOR[client.plan] ?? "bg-gray-700 text-gray-300 ring-gray-600"
              }`}
            >
              {PLAN_LABEL[client.plan] ?? client.plan}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
            <span>{fmtPhone(client.whatsapp_number)}</span>
            <span>·</span>
            <span>desde {fmtDate(client.created_at)}</span>
            {client.last_payment_at && (
              <>
                <span>·</span>
                <span>último pgto {fmtDate(client.last_payment_at)}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: status + amount */}
        <div className="shrink-0 text-right">
          <p className="text-base font-bold text-white">
            {fmt(client.plan_amount)}
            <span className="text-xs font-normal text-gray-500">/mês</span>
          </p>
          <StatusPill client={client} />
        </div>
      </div>

      {/* Notification badge + actions */}
      {(client.latest_notification || isOverdue) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-4 py-3">
          <NotifBadge notif={client.latest_notification} />

          {isOverdue && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => onSendReminder(client.id)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/10 disabled:opacity-40"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {hasPendingOrConfirmed ? "Reenviar" : "Cobrar"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => onMarkPaid(client.id)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Marcar pago
              </button>
            </div>
          )}
        </div>
      )}

      {feedback && (
        <p className="border-t border-white/5 px-4 py-2 text-xs text-emerald-400">{feedback}</p>
      )}
    </div>
  );
}

function StatusPill({ client }: { client: ClientData }) {
  if (client.subscription_status === "trial") {
    return (
      <span className="mt-0.5 block text-xs font-medium text-amber-400">
        Trial · {client.trial_days_left}d restantes
      </span>
    );
  }
  if (client.subscription_status === "active") {
    return (
      <span className="mt-0.5 block text-xs font-medium text-emerald-400">Em dia</span>
    );
  }
  if (client.subscription_status === "overdue") {
    return (
      <span className="mt-0.5 block text-xs font-medium text-red-400">
        {client.days_overdue > 0 ? `${client.days_overdue}d em atraso` : "Vencido"}
      </span>
    );
  }
  return null;
}

function NotifBadge({ notif }: { notif: ClientData["latest_notification"] }) {
  if (!notif) return <span />;
  if (notif.status === "confirmed") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Estabelecimento confirmou pagamento
      </span>
    );
  }
  if (notif.status === "pending") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
        Lembrete enviado em {fmtDate(notif.sent_at)}
      </span>
    );
  }
  if (notif.status === "verified") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Pagamento verificado
      </span>
    );
  }
  return <span />;
}

function MetricCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: "red" | "amber" | "emerald" | "violet";
}) {
  const colors = {
    red: "from-red-950 to-red-900/30 border-red-800/40 text-red-400",
    amber: "from-amber-950 to-amber-900/30 border-amber-800/40 text-amber-400",
    emerald: "from-emerald-950 to-emerald-900/30 border-emerald-800/40 text-emerald-400",
    violet: "from-violet-950 to-violet-900/30 border-violet-800/40 text-violet-400",
  };
  return (
    <div
      className={`rounded-xl border bg-gradient-to-br p-5 ${colors[color]}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs opacity-60">{sub}</p>}
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
    setFeedbacks((p) => ({ ...p, [id]: res.ok ? "Pagamento confirmado!" : (json.error ?? "Erro") }));
    if (res.ok) await refresh();
    setLoadingId(null);
    setTimeout(() => setFeedbacks((p) => { const n = { ...p }; delete n[id]; return n; }), 4000);
  };

  const overdueClients = clients.filter((c) => c.subscription_status === "overdue");
  const trialClients = clients.filter((c) => c.subscription_status === "trial");
  const activeClients = clients.filter((c) => c.subscription_status === "active");

  const mrr = activeClients.reduce((s, c) => s + c.plan_amount, 0);
  const atRisk = overdueClients.reduce((s, c) => s + c.plan_amount, 0);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "overdue", label: "Em atraso", count: overdueClients.length },
    { key: "trial", label: "Trial", count: trialClients.length },
    { key: "active", label: "Em dia", count: activeClients.length },
  ];

  const visible =
    activeTab === "overdue"
      ? overdueClients
      : activeTab === "trial"
      ? trialClients
      : activeClients;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <p className="mt-1 text-sm text-gray-400">
          Assinaturas, cobranças e pagamentos em tempo real.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Em atraso"
          value={overdueClients.length}
          sub={atRisk > 0 ? `${fmt(atRisk)} em risco` : undefined}
          color="red"
        />
        <MetricCard
          label="Trial"
          value={trialClients.length}
          sub="período de teste"
          color="amber"
        />
        <MetricCard
          label="Em dia"
          value={activeClients.length}
          sub="assinaturas ativas"
          color="emerald"
        />
        <MetricCard
          label="MRR"
          value={fmt(mrr)}
          sub="receita mensal recorrente"
          color="violet"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-gray-800/60 p-1 ring-1 ring-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === tab.key
                  ? "bg-gray-100 text-gray-700"
                  : tab.key === "overdue"
                  ? "bg-red-900/60 text-red-400"
                  : tab.key === "trial"
                  ? "bg-amber-900/60 text-amber-400"
                  : "bg-emerald-900/60 text-emerald-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-gray-800/40 py-20 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-700">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-300">Nenhum estabelecimento aqui</p>
          <p className="mt-1 text-xs text-gray-500">Esta categoria está vazia no momento.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onSendReminder={sendReminder}
              onMarkPaid={markPaid}
              loading={loadingId === client.id}
              feedback={feedbacks[client.id] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
