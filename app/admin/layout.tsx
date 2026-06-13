import Link from "next/link";
import { requireInternalAdmin } from "@/lib/admin/auth";

export const metadata = {
  title: "Admin Interno — ZapComanda",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireInternalAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-900">ZapComanda</span>
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-violet-700">
              Admin Interno
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/admin/clientes"
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
            >
              Clientes
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
