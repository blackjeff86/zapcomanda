import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-brand-light/60 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-amber-100/50 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-light/50 px-4 py-1.5 text-sm font-medium text-brand-dark">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            Para lanchonete, marmita, doces e muito mais
          </div>

          <h1 className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.4rem]">
            Seu cardápio online.{" "}
            <span className="text-brand">Seus pedidos organizados.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600 sm:text-xl">
            O cliente acessa o link, escolhe pelo cardápio, paga na hora — e o pedido já aparece no seu painel. Sem ligação, sem confusão, sem anotação em papel.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-brand px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark hover:shadow-brand/40"
            >
              Começar agora — é grátis por 7 dias
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              Ver como funciona
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <CheckIcon />
              Sem taxa por pedido
            </span>
            <span className="flex items-center gap-1.5">
              <CheckIcon />
              Cardápio no ar em 10 minutos
            </span>
            <span className="flex items-center gap-1.5">
              <CheckIcon />
              Cancele quando quiser
            </span>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-[340px] sm:max-w-[380px]">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="animate-float relative mx-auto">
      <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-2xl shadow-gray-300/25">
        {/* Browser bar */}
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
            <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
            <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
          </div>
          <div className="flex-1 rounded-full bg-white border border-gray-200 px-3 py-1 text-[10px] text-gray-400">
            zapcomanda.com.br/marmitaria-cida
          </div>
        </div>

        {/* Store header */}
        <div className="bg-brand px-4 py-3">
          <p className="text-sm font-bold text-white">Marmitaria da Cida</p>
          <p className="text-xs text-white/70">Peça pelo cardápio • Pix na hora</p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-gray-100 bg-white px-3 py-2">
          <span className="shrink-0 rounded-full bg-brand px-3 py-1 text-[10px] font-semibold text-white">Pratos</span>
          <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-[10px] font-medium text-gray-600">Bebidas</span>
          <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-[10px] font-medium text-gray-600">Combos</span>
        </div>

        {/* Menu items */}
        <div className="space-y-2 bg-gray-50 p-3">
          {[
            { name: "Feijoada completa", price: "R$ 22,00", desc: "Feijão preto, arroz, farofa..." },
            { name: "Strogonoff de frango", price: "R$ 18,00", desc: "Com arroz e batata palha" },
            { name: "Frango grelhado", price: "R$ 16,00", desc: "Com salada e arroz", active: true },
          ].map((item) => (
            <div
              key={item.name}
              className={`flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ${
                item.active ? "ring-brand/30" : "ring-black/5"
              }`}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900">{item.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{item.desc}</p>
                <p className="mt-0.5 text-xs font-bold text-brand">{item.price}</p>
              </div>
              <button className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                item.active ? "bg-brand text-white" : "bg-gray-100 text-gray-600"
              }`}>
                {item.active ? "✓" : "+"}
              </button>
            </div>
          ))}
        </div>

        {/* Cart bar */}
        <div className="bg-brand px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">1 item no carrinho</span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand">Ver pedido →</span>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -bottom-4 -right-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-lg sm:-right-4">
        <p className="text-xs font-medium text-gray-500">Pedido recebido</p>
        <p className="text-lg font-bold text-brand">+ R$ 16,00</p>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-brand" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  );
}
