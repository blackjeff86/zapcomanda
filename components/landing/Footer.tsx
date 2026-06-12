import Link from "next/link";
import Logo from "@/components/brand/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Logo size={34} />

          <p className="text-sm text-gray-500">
            Pedidos automáticos via WhatsApp para lanchonetes e quentinhas.
          </p>

          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/login" className="transition hover:text-gray-900">
              Entrar
            </Link>
            <Link href="/signup" className="transition hover:text-gray-900">
              Cadastrar
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} ZapComanda. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
