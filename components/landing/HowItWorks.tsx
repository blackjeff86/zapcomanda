const steps = [
  {
    number: "01",
    title: "Cliente abre o cardápio",
    description:
      "Você compartilha o link. O cliente abre no celular, navega pelas categorias e escolhe o que quer — sem app, sem cadastro.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-6 3h.008v.008H6V15zm0-3h.008v.008H6V12zm0-3h.008v.008H6V9z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Pedido confirmado, Pix gerado",
    description:
      "O cliente confirma o pedido e recebe o código Pix na hora. Paga pelo app do banco — sem digitar nada.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Pagou? Aparece no painel",
    description:
      "Pagamento confirmado, pedido vai pro painel em tempo real. Você só muda o status: preparo → entregue.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">
            Simples assim
          </p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
            Do link ao pedido em menos de 2 minutos
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Seu cliente não precisa baixar app, criar conta nem aprender nada novo.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center">
              {index < steps.length - 1 && (
                <div className="absolute top-10 left-[60%] hidden h-0.5 w-[80%] bg-gradient-to-r from-brand/40 to-transparent md:block" />
              )}
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-light text-brand">
                {step.icon}
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-brand">
                Passo {step.number}
              </p>
              <h3 className="mt-2 text-xl font-bold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
