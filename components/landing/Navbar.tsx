import Link from "next/link";
import Logo from "@/components/brand/Logo";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="transition opacity-100 hover:opacity-90">
          <Logo size={38} />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
          <a href="#como-funciona" className="transition hover:text-gray-900">
            Como funciona
          </a>
          <a href="#recursos" className="transition hover:text-gray-900">
            Recursos
          </a>
          <a href="#planos" className="transition hover:text-gray-900">
            Planos
          </a>
          <a href="#faq" className="transition hover:text-gray-900">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-gray-600 transition hover:text-gray-900 sm:inline"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/25 transition hover:bg-brand-dark"
          >
            Testar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}
