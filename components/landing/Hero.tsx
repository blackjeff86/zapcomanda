import Link from "next/link";
import { LogoIcon } from "@/components/brand/Logo";

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
            Feito para lanchonete de bairro e quentinha
          </div>

          <h1 className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.4rem]">
            Pare de perder pedido no{" "}
            <span className="text-brand">WhatsApp</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600 sm:text-xl">
            Cardápio automático, Pix na hora e painel de pedidos — tudo no mesmo
            lugar. Você foca na cozinha. O ZapComanda cuida do resto.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-brand px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark hover:shadow-brand/40"
            >
              Começar agora — é rápido
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
              Configura em 10 minutos
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
      <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white p-2 shadow-2xl shadow-gray-300/25">
        <div className="overflow-hidden rounded-[1.65rem] bg-[#e5ddd5]">
          <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
            <LogoIcon size={38} className="shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Marmitaria da Cida</p>
              <p className="text-xs text-white/70">online agora</p>
            </div>
          </div>

          <div className="space-y-3 px-3.5 py-3.5">
            <ChatBubble>
              Olá! 👋 Toque para pedir —{" "}
              <span className="text-gray-500">sem digitar número.</span>
            </ChatBubble>

            <ListCard
              title="Cardápio"
              subtitle="Escolha uma categoria"
              buttonLabel="📋 Ver cardápio"
              rows={[
                { title: "🍱 Pratos do dia", subtitle: "3 itens" },
                { title: "🥤 Bebidas", subtitle: "4 itens" },
              ]}
            />

            <SelectedReply label="🍱 Pratos do dia" />

            <ListCard
              title="Pratos do dia"
              subtitle="Toque no item desejado"
              buttonLabel="🍽️ Ver itens"
              rows={[
                { title: "Feijoada", subtitle: "R$ 22,00", active: true },
                { title: "Strogonoff", subtitle: "R$ 18,00" },
                { title: "Frango grelhado", subtitle: "R$ 16,00" },
              ]}
            />

            <SelectedReply label="Feijoada — R$ 22,00" />

            <ChatBubble highlight>
              💳 <span className="font-semibold">Pix: R$ 22,00</span>
            </ChatBubble>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-4 -right-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-lg sm:-right-4">
        <p className="text-xs font-medium text-gray-500">Pedido recebido</p>
        <p className="text-lg font-bold text-brand">+ R$ 22,00</p>
      </div>
    </div>
  );
}

function ChatBubble({
  children,
  highlight,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <p
      className={`max-w-[88%] rounded-2xl rounded-tl-sm px-3 py-2 text-xs leading-relaxed shadow-sm ${
        highlight
          ? "bg-white text-gray-800 ring-2 ring-brand/20"
          : "bg-white text-gray-700"
      }`}
    >
      {children}
    </p>
  );
}

function SelectedReply({ label }: { label: string }) {
  return (
    <div className="flex justify-end">
      <span className="inline-flex items-center gap-1.5 rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 text-xs font-medium text-gray-800 shadow-sm">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#25d366] text-[9px] text-white">
          ✓
        </span>
        {label}
      </span>
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

function ListCard({
  title,
  subtitle,
  buttonLabel,
  rows,
}: {
  title: string;
  subtitle: string;
  buttonLabel: string;
  rows: Array<{ title: string; subtitle: string; active?: boolean }>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl rounded-tl-sm bg-white shadow-sm ring-1 ring-black/5">
      <div className="border-b border-gray-100 px-3 py-2">
        <p className="text-xs font-semibold text-gray-900">{title}</p>
        <p className="text-[11px] text-gray-500">{subtitle}</p>
      </div>

      <div className="divide-y divide-gray-50 px-1.5 py-1">
        {rows.map((row) => (
          <div
            key={row.title}
            className={`flex items-center justify-between rounded-lg px-2 py-2 ${
              row.active ? "bg-[#e7fce8] ring-1 ring-[#25d366]/25" : ""
            }`}
          >
            <div>
              <p className="text-xs font-medium text-gray-800">{row.title}</p>
              <p className="text-[11px] text-gray-500">{row.subtitle}</p>
            </div>
            <svg
              className={`h-4 w-4 ${row.active ? "text-[#25d366]" : "text-gray-300"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5 border-t border-gray-100 bg-[#f0fdf4] py-2.5 text-xs font-semibold text-[#075e54]">
        {buttonLabel}
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
