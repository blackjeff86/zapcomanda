import Link from "next/link";
import { getLoginHref } from "@/lib/dev-auth";

export default function CTA() {
  const loginHref = getLoginHref();

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-brand px-8 py-16 text-center sm:px-16">
          <div className="pointer-events-none absolute inset-0 -z-0">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          </div>

          <h2 className="relative text-3xl font-bold text-white sm:text-4xl">
            Seu cardápio online pronto em 10 minutos
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/80">
            Configure, compartilhe o link e receba o primeiro pedido ainda hoje.
          </p>

          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex rounded-full bg-white px-8 py-4 text-base font-semibold text-brand shadow-lg transition hover:bg-gray-50"
            >
              Criar minha conta grátis
            </Link>
            <Link
              href={loginHref}
              className="inline-flex rounded-full border border-white/30 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
