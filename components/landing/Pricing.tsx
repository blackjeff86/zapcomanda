import Link from "next/link";

const plans = [
  {
    name: "Básico",
    price: "49",
    description: "Para lanchonetes, esfihas e sanduíches — comece a receber pedidos online hoje.",
    features: [
      "Cardápio digital ilimitado",
      "Link próprio do restaurante",
      "Pedidos online pelo celular",
      "Pix automático",
      "Painel de pedidos em tempo real",
      "Histórico e faturamento do dia",
    ],
    cta: "Começar com o Básico",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "79",
    description: "Para marmitaria, quentinha ou doces — com controle de cardápio e ferramentas de crescimento.",
    features: [
      "Tudo do plano Básico",
      "Cardápio do dia",
      "Horário de corte de pedidos",
      "Cupons de desconto",
      "Relatório semanal",
    ],
    cta: "Começar com o Pro",
    highlighted: true,
    badge: "Mais popular",
  },
];

export default function Pricing() {
  return (
    <section id="planos" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">
            Planos
          </p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
            Menos que o custo de 2 pedidos errados por semana
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Sem taxa por pedido. Sem fidelidade. Cancele quando quiser.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 ${
                plan.highlighted
                  ? "border-brand bg-white shadow-xl shadow-brand/10 ring-2 ring-brand"
                  : "border-gray-200 bg-white"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-xs font-bold text-white">
                  {plan.badge}
                </span>
              )}

              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-600">{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-sm font-medium text-gray-500">R$</span>
                <span className="text-5xl font-extrabold tracking-tight text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-500">/mês</span>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                    <svg className="mt-0.5 h-5 w-5 shrink-0 text-brand" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`mt-8 block rounded-full py-3.5 text-center text-sm font-semibold transition ${
                  plan.highlighted
                    ? "bg-brand text-white shadow-lg shadow-brand/25 hover:bg-brand-dark"
                    : "border border-gray-200 bg-gray-50 text-gray-900 hover:bg-gray-100"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
