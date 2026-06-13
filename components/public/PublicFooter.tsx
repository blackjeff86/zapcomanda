import Link from "next/link";
import Logo from "@/components/brand/Logo";

export default function PublicFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white py-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs text-gray-500">Desenvolvido por</p>
        <Link
          href="/"
          className="transition-opacity hover:opacity-80"
          aria-label="ZapComanda — voltar ao site"
        >
          <Logo size={30} />
        </Link>
      </div>
    </footer>
  );
}
