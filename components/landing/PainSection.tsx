const pains = [
  {
    emoji: "😵‍💫",
    title: "Pedido perdido, cliente sem resposta",
    description:
      "Cliente pediu às 11h, você viu às 13h. Pedido sumiu entre mensagem, ligação e anotação em papel.",
  },
  {
    emoji: "🧾",
    title: "Pix sem comprovante, pedido sem confirmação",
    description:
      "Fica na dúvida se pagou ou não. Enquanto isso, a comida esfria e o cliente reclama.",
  },
  {
    emoji: "📱",
    title: "Celular virou segunda cozinha",
    description:
      "Você deveria estar na chapa, mas passa o almoço inteiro respondendo \"tem feijoada?\" e \"quanto fica?\"",
  },
];

export default function PainSection() {
  return (
    <section className="bg-gray-900 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">
            Você conhece essa rotina
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Receber pedido na mão funciona.
            <br />
            <span className="text-gray-400">Mas não foi feito pra crescer.</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {pains.map((pain) => (
            <div
              key={pain.title}
              className="rounded-2xl border border-gray-800 bg-gray-800/50 p-6 transition hover:border-gray-700"
            >
              <span className="text-3xl">{pain.emoji}</span>
              <h3 className="mt-4 text-lg font-semibold text-white">{pain.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                {pain.description}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-lg text-gray-300">
          O ZapComanda resolve isso{" "}
          <span className="font-semibold text-white">sem complicar a vida do seu cliente.</span>
        </p>
      </div>
    </section>
  );
}
