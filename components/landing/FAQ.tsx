const faqs = [
  {
    question: "Preciso trocar o número do WhatsApp?",
    answer:
      "Não. Você usa o mesmo número que já atende seus clientes. Só conectamos ele ao bot — o cliente continua mandando mensagem como sempre.",
  },
  {
    question: "Meu cliente precisa instalar algum app?",
    answer:
      "Não. Ele manda mensagem no WhatsApp, escolhe o pedido e paga o Pix. Simples assim — igual já faz hoje, só que organizado.",
  },
  {
    question: "Funciona pra quentinha com cardápio que muda todo dia?",
    answer:
      "Sim! No plano Pro você define o cardápio do dia toda manhã e pode configurar horário de corte pra parar de aceitar pedidos automaticamente.",
  },
  {
    question: "Quanto tempo leva pra configurar?",
    answer:
      "Cerca de 10 minutos. Cadastra o negócio, monta o cardápio e conecta o WhatsApp. No mesmo dia você já pode receber pedido automático.",
  },
  {
    question: "Tem taxa por pedido?",
    answer:
      "Não. Você paga só a mensalidade do plano. O Pix é processado via Asaas com as taxas normais do gateway de pagamento.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer:
      "Sim, sem fidelidade. Cancela pelo painel e pronto — sem burocracia.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">
            Dúvidas frequentes
          </p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
            Perguntou? A gente responde.
          </h2>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-gray-200 bg-white transition open:border-brand/30 open:shadow-sm"
            >
              <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-left font-semibold text-gray-900 marker:content-none">
                {faq.question}
                <svg
                  className="h-5 w-5 shrink-0 text-gray-400 transition group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-6 pb-5 text-sm leading-relaxed text-gray-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
