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
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const fmtPhone = (phone: string) =>
  phone.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");

type Tab = "overdue" | "trial" | "active";

function StatusBadge({ client }: { client: ClientData }) {
  if (client.subscription_status === "trial") {
    return (
      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
        Trial · {client.trial_days_left}d restantes
      </span>
    );
  }
  if (client.subscription_status === "active") {
    return (
      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        Em dia
      </span>
    );
  }
  if (client.subscription_status === "overdue") {
    return (
      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        {client.days_overdue > 0 ? `${client.days_overdue}d em atraso` : "Vencido"}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
      {client.subscription_status}
    </span>
  );
}

function NotifBadge({ notif }: { notif: ClientData["latest_notification"] }) {
  if (!notif) return null;
  if (notif.status === "confirmed") {
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        ✓ Estabelecimento confirmou pagamento
      </span>
    );
  }
  if (notif.status === "pending") {
    return (
      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
        Lembrete enviado em {fmtDate(notif.sent_at)}
      </span>
    );
  }
  if (notif.status === "verified") {
    return (
      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-700">
        ✓ Verificado
      </span>
    );
  }
  return null;
}

function ClientCard({
  client,
  onSendReminder,
  onMarkPaid,
  loading,
}: {
  client: ClientData;
  onSendReminder: (id: string) => Promise<void>;
  onMarkPaid: (id: string) => Promise<void>;
  loading: boolean;
}) {
  const isOverdue = client.subscription_status === "overdue";
  const hasPendingOrConfirmed =
    client.latest_notification &&
    (client.latest_notification.status === "pending" ||
      client.latest_notification.status === "confirmed");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-gray-900">{client.name}</h3>
            <StatusBadge client={client} />
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            {fmtPhone(client.whatsapp_number)} · desde {fmtDate(client.created_at)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold text-gray-900">{fmt(client.plan_amount)}<span className="text-xs font-normal text-gray-400">/mês</span></p>
          {client.last_payment_at && (
            <p className="text-xs text-gray-400">Último pgto: {fmtDate(client.last_payment_at)}</p>
          )}
        </div>
      </div>

      {client.latest_notification && (
        <div className="mt-3">
          <NotifBadge notif={client.latest_notification} />
        </div>
      )}

      {isOverdue && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => onSendReminder(client.id)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {hasPendingOrConfirmed ? "Reenviar lembrete" : "Enviar lembrete"}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => onMarkPaid(client.id)}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Marcar como pago
          </button>
        </div>
      )}
    </div>
  );
}

export default function ClientesPanel({ initialClients }: { initialClients: ClientData[] }) {
  const [clients, setClients] = useState<ClientData[]>(initialClients);
  const [activeTab, setActiveTab] = useState<Tab>("overdue");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; message: string } | null>(null);

  const refresh = async () => {
    const res = await fetch("/api/admin/clients");
    if (res.ok) {
      const data = (await res.json()) as ClientData[];
      setClients(data);
    }
  };

  const sendReminder = async (id: string) => {
    setLoadingId(id);
    setFeedback(null);
    const res = await fetch(`/api/admin/clients/${id}/billing-reminder`, { method: "POST" });
    if (res.ok) {
      setFeedback({ id, message: "Lembrete de cobrança enviado!" });
      await refresh();
    } else {
      const json = await res.json() as { error?: string };
      setFeedback({ id, message: json.error ?? "Erro ao enviar lembrete" });
    }
    setLoadingId(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  const markPaid = async (id: string) => {
    setLoadingId(id);
    setFeedback(null);
    const res = await fetch(`/api/admin/clients/${id}/mark-paid`, { method: "POST" });
    if (res.ok) {
      setFeedback({ id, message: "Pagamento confirmado!" });
      await refresh();
    } else {
      const json = await res.json() as { error?: string };
      setFeedback({ id, message: json.error ?? "Erro ao marcar como pago" });
    }
    setLoadingId(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  const overdueClients = clients.filter((c) => c.subscription_status === "overdue");
  const trialClients = clients.filter((c) => c.subscription_status === "trial");
  const activeClients = clients.filter((c) => c.subscription_status === "active");

  const tabs: { key: Tab; label: string; count: number; color: string }[] = [
    { key: "overdue", label: "Em atraso", count: overdueClients.length, color: "red" },
    { key: "trial", label: "Período de teste", count: trialClients.length, color: "blue" },
    { key: "active", label: "Em dia", count: activeClients.length, color: "green" },
  ];

  const visible =
    activeTab === "overdue"
      ? overdueClients
      : activeTab === "trial"
      ? trialClients
      : activeClients;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center">
          <p className="text-3xl font-bold text-red-700">{overdueClients.length}</p>
          <p className="mt-1 text-xs font-medium text-red-600">Em atraso</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">{trialClients.length}</p>
          <p className="mt-1 text-xs font-medium text-blue-600">Período de teste</p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-center">
          <p className="text-3xl font-bold text-green-700">{activeClients.length}</p>
          <p className="mt-1 text-xs font-medium text-green-600">Em dia</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === tab.key
                  ? "bg-white/20 text-white"
                  : tab.color === "red"
                  ? "bg-red-100 text-red-700"
                  : tab.color === "blue"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Client list */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
          <p className="text-gray-400">Nenhum estabelecimento nesta categoria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((client) => (
            <div key={client.id}>
              <ClientCard
                client={client}
                onSendReminder={sendReminder}
                onMarkPaid={markPaid}
                loading={loadingId === client.id}
              />
              {feedback?.id === client.id && (
                <p className="mt-1.5 px-1 text-xs text-gray-600">{feedback.message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
