"use client";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

type Stats = {
  total: number;
  trial: number;
  active: number;
  overdue: number;
  mrr: number;
};

type ChartPoint = { date: string; count: number };

type Notification = {
  id: string;
  status: string;
  amount: number;
  sentAt: string;
  establishmentId: string;
  establishmentName?: string;
};

function MetricCard({
  label,
  value,
  sub,
  icon,
  iconBg,
  iconColor,
  variant,
}: {
  label: string;
  value: string;
  sub: React.ReactNode;
  icon: string;
  iconBg: string;
  iconColor: string;
  variant?: "primary";
}) {
  const isPrimary = variant === "primary";
  return (
    <div
      className={`p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${
        isPrimary
          ? "bg-primary text-on-primary border-primary"
          : "bg-surface-container-lowest border-outline-variant"
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <span
          className={`text-label-md uppercase ${isPrimary ? "text-primary-fixed opacity-90" : "text-on-surface-variant"}`}
        >
          {label}
        </span>
        <div className={`p-1 rounded-lg ${iconBg}`}>
          <span className={`material-symbols-outlined text-[20px] ${iconColor}`}>{icon}</span>
        </div>
      </div>
      <div className="mt-4">
        <h3
          className={`text-[30px] font-bold leading-[38px] tracking-tight tabular-nums ${
            isPrimary ? "text-on-primary" : "text-on-surface"
          }`}
        >
          {value}
        </h3>
        <div className={`flex items-center gap-1 mt-1 ${isPrimary ? "opacity-90" : ""}`}>
          {sub}
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ status }: { status: string }) {
  if (status === "verified" || status === "confirmed") {
    return (
      <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
        <span
          className="material-symbols-outlined text-on-secondary-fixed-variant text-[20px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          check_circle
        </span>
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0">
        <span
          className="material-symbols-outlined text-on-surface-variant text-[20px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          schedule
        </span>
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center shrink-0">
      <span
        className="material-symbols-outlined text-error text-[20px]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        error
      </span>
    </div>
  );
}

function activityLabel(status: string) {
  if (status === "verified") return "Pagamento Verificado";
  if (status === "confirmed") return "Pagamento Confirmado";
  if (status === "pending") return "Cobrança Enviada";
  return "Notificação";
}

export default function DashboardPanel({
  stats,
  chartData,
  recentNotifications,
}: {
  stats: Stats;
  chartData: ChartPoint[];
  recentNotifications: Notification[];
}) {
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div className="max-w-[1440px] mx-auto p-6 md:p-8">
      {/* Page header */}
      <div className="mb-8">
        <h2 className="text-[30px] font-bold leading-[38px] tracking-tight text-on-surface">
          Dashboard
        </h2>
        <p className="text-body-md text-on-surface-variant">
          Visão geral do ecossistema ZapComanda em tempo real.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <MetricCard
          label="Total Clientes"
          value={stats.total.toLocaleString("pt-BR")}
          icon="group"
          iconBg="bg-surface-container"
          iconColor="text-primary"
          sub={
            <>
              <span className="material-symbols-outlined text-secondary text-[14px]">trending_up</span>
              <span className="text-secondary text-label-md font-bold">+{stats.trial}</span>
              <span className="text-body-sm text-on-surface-variant">em teste</span>
            </>
          }
        />
        <MetricCard
          label="Em Teste"
          value={stats.trial.toLocaleString("pt-BR")}
          icon="hourglass_empty"
          iconBg="bg-surface-container"
          iconColor="text-tertiary"
          sub={
            <span className="text-body-sm text-on-surface-variant">período de avaliação</span>
          }
        />
        <MetricCard
          label="Ativos"
          value={stats.active.toLocaleString("pt-BR")}
          icon="verified"
          iconBg="bg-secondary-container/20"
          iconColor="text-on-secondary-fixed-variant"
          sub={
            <>
              <span className="text-secondary text-label-md font-bold">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
              </span>
              <span className="text-body-sm text-on-surface-variant">retenção</span>
            </>
          }
        />
        <MetricCard
          label="Em Atraso"
          value={stats.overdue.toLocaleString("pt-BR")}
          icon="warning"
          iconBg="bg-error-container"
          iconColor="text-on-error-container"
          sub={
            <>
              <span className="material-symbols-outlined text-error text-[14px]">history</span>
              <span className="text-error text-label-md font-bold">
                {stats.total > 0 ? ((stats.overdue / stats.total) * 100).toFixed(1) : 0}%
              </span>
              <span className="text-body-sm text-on-surface-variant">inadimplência</span>
            </>
          }
        />
        <MetricCard
          label="MRR (Receita)"
          value={fmt(stats.mrr)}
          icon="payments"
          iconBg="bg-primary-container"
          iconColor="text-on-primary"
          variant="primary"
          sub={
            <>
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span className="text-label-md font-bold">{stats.active} contratos ativos</span>
            </>
          }
        />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center">
            <div>
              <h4 className="text-headline-md text-on-surface">Novos Cadastros</h4>
              <p className="text-body-sm text-on-surface-variant">Crescimento nos últimos 30 dias</p>
            </div>
          </div>
          <div className="p-6 h-[300px] flex items-end gap-1.5 relative">
            {/* Grid lines */}
            <div className="absolute inset-6 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-t border-outline-variant/30 w-full" />
              ))}
              <div className="h-0" />
            </div>
            {chartData.map((d, i) => {
              const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
              const isToday = i === chartData.length - 1;
              return (
                <div
                  key={d.date}
                  className="flex-1 relative group flex items-end"
                  style={{ height: "100%" }}
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      isToday ? "bg-primary" : "bg-surface-container-high hover:bg-primary-container"
                    }`}
                    style={{ height: `${Math.max(pct, 2)}%` }}
                    title={`${d.date}: ${d.count} cadastros`}
                  />
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {d.count}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="px-6 pb-4 flex justify-between text-label-md text-on-surface-variant">
            <span>Há 30 dias</span>
            <span>Há 15 dias</span>
            <span>Hoje</span>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col">
          <div className="p-6 border-b border-outline-variant">
            <h4 className="text-headline-md text-on-surface">Atividades Recentes</h4>
            <p className="text-body-sm text-on-surface-variant">Notificações e cobranças</p>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {recentNotifications.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant text-center py-8">
                Nenhuma atividade recente.
              </p>
            ) : (
              recentNotifications.map((n) => (
                <div key={n.id} className="flex gap-4">
                  <ActivityIcon status={n.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-bold text-on-surface">{activityLabel(n.status)}</p>
                    <p className="text-body-sm text-on-surface-variant">
                      {fmt(n.amount)}
                    </p>
                    <span className="text-label-md text-outline">{fmtDate(n.sentAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-outline-variant bg-surface-container-low">
            <button
              type="button"
              className="w-full text-center text-label-md font-bold text-primary hover:underline"
            >
              Ver todo histórico
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 pt-6 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4 text-on-surface-variant">
        <p className="text-body-sm">© {new Date().getFullYear()} ZapComanda Admin. Sistema de Gestão de Retaguarda.</p>
        <div className="flex gap-6 items-center text-label-md">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span>API Status: Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
