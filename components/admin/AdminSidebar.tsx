"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/admin/clientes", label: "Gestão de Clientes", icon: "group", exact: false },
  { href: "/admin/financeiro", label: "Financeiro", icon: "payments", exact: false },
  { href: "/admin/configuracoes", label: "Configurações", icon: "settings", exact: false },
];

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials = userEmail.charAt(0).toUpperCase();

  return (
    <aside className="w-[280px] h-screen fixed left-0 top-0 hidden lg:flex flex-col bg-surface-container-lowest border-r border-outline-variant z-[60]">
      <div className="flex flex-col h-full py-6 px-4">
        {/* Logo */}
        <div className="mb-8 px-2">
          <h1 className="text-headline-md text-primary font-bold">ZapComanda</h1>
          <p className="text-body-sm text-on-surface-variant">Painel Administrativo</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-3 py-2 rounded-lg text-body-md transition-all active:scale-95 ${
                  active
                    ? "text-primary font-bold bg-surface-container-high"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="mt-auto pt-4 border-t border-outline-variant space-y-1">
          <Link
            href="#"
            className="flex items-center gap-4 px-3 py-2 rounded-lg text-body-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">help</span>
            <span>Suporte</span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 px-3 py-2 rounded-lg text-body-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            <span>Sair</span>
          </button>
          <div className="flex items-center gap-4 px-3 py-4 mt-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary text-sm font-bold shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-body-md font-bold truncate text-on-surface">Admin ZapComanda</p>
              <p className="text-label-md text-on-surface-variant truncate">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
