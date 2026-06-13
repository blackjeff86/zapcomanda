const features = [
  {
    title: "Bot com cardápio interativo",
    description:
      "Categorias, itens, quantidade e confirmação — tudo por botões e respostas simples. Funciona até pra quem tem dificuldade com tecnologia.",
    tag: "WhatsApp",
  },
  {
    title: "Pix automático via Asaas",
    description:
      "Gera cobrança Pix na hora e confirma o pagamento sozinho. Acabou a dúvida \"pagou ou não pagou?\".",
    tag: "Pagamento",
  },
  {
    title: "Painel de pedidos em tempo real",
    description:
      "Veja cada pedido chegando ao vivo: aguardando pagamento, pago, em preparo, entregue. Um clique pra mudar o status.",
    tag: "Gestão",
  },
  {
    title: "Cardápio do dia",
    description:
      "Ideal pra marmita e confeitaria: define o que está pronto hoje e pronto. Cliente só vê o que tem — sem confusão com item que acabou.",
    tag: "Cardápio do dia",
    pro: true,
  },
  {
    title: "Horário de corte",
    description:
      "Pedidos aceitos só até o horário que você definir. Depois do corte? O bot avisa que encerrou e você não precisa recusar um por um.",
    tag: "Operação",
    pro: true,
  },
  {
    title: "Broadcast para clientes",
    description:
      "Manda o cardápio do dia ou promoção pra quem já pediu antes. Reativa cliente sem precisar postar em grupo.",
    tag: "Marketing",
    pro: true,
  },
];

export default function Features() {
  return (
    <section id="recursos" className="bg-gray-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">
            Tudo que você precisa
          </p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
            Ferramentas de restaurante grande.
            <br />
            Preço de negócio de bairro.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  {feature.tag}
                </span>
                {feature.pro && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Plano Pro
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900 group-hover:text-brand">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
