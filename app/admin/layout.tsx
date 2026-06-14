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
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-white/10 bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-base font-bold text-white">ZapComanda</span>
            <span className="rounded-full bg-violet-900/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-violet-300 ring-1 ring-violet-700">
              Admin Interno
            </span>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href="/admin/clientes"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              Clientes
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
