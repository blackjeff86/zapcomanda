function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface StatsOverviewProps {
  todayRevenue: number;
  activeOrders: number;
  todayOrdersCount: number;
  deliveredToday: number;
}

export default function StatsOverview({
  todayRevenue,
  activeOrders,
  todayOrdersCount,
  deliveredToday,
}: StatsOverviewProps) {
  const stats = [
    {
      label: "Faturamento hoje",
      value: formatCurrency(todayRevenue),
      hint: "Pedidos pagos e entregues",
      accent: "bg-emerald-500",
    },
    {
      label: "Pedidos ativos",
      value: String(activeOrders),
      hint: "Aguardando ou em preparo",
      accent: "bg-blue-500",
    },
    {
      label: "Pedidos hoje",
      value: String(todayOrdersCount),
      hint: "Total do dia",
      accent: "bg-violet-500",
    },
    {
      label: "Entregues hoje",
      value: String(deliveredToday),
      hint: "Finalizados",
      accent: "bg-orange-500",
    },
  ];

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <span className={`h-2 w-2 rounded-full ${stat.accent}`} />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            {stat.value}
          </p>
          <p className="mt-1 text-xs text-gray-400">{stat.hint}</p>
        </div>
      ))}
    </div>
  );
}
