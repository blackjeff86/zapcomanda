const testimonials = [
  {
    quote:
      "Antes eu perdia pedido no telefone e no papel. Agora o cliente acessa o link, escolhe e paga. Eu só olho o painel e preparo.",
    name: "Cida",
    business: "Marmitaria da Cida — São Paulo",
    initials: "MC",
  },
  {
    quote:
      "O Pix automático mudou minha vida. Não fico mais perguntando 'você pagou?' pra ninguém. Confirmou, aparece no painel.",
    name: "Roberto",
    business: "Lanchonete do Beto — Belo Horizonte",
    initials: "RB",
  },
  {
    quote:
      "Configurar o cardápio do dia leva 5 minutos de manhã. O horário de corte me salvou no domingo — fechei pedido sozinha às 10h30.",
    name: "Fernanda",
    business: "Quentinha da Fê — Recife",
    initials: "FF",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-brand-light/30 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">
            Quem já usa
          </p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
            Dono de lanchonete não tem tempo de aprender sistema complicado
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="flex flex-col rounded-2xl border border-brand/10 bg-white p-6 shadow-sm"
            >
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-700">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.business}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
