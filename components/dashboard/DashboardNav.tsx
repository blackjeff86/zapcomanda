"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Pedidos", icon: "orders", pro: false },
  { href: "/dashboard/caixa", label: "Caixa", icon: "pos", pro: false },
  { href: "/dashboard/menu", label: "Cardápio", icon: "menu", pro: false },
  { href: "/dashboard/clientes", label: "Clientes", icon: "customers", pro: false },
  { href: "/dashboard/relatorio", label: "Relatório", icon: "report", pro: true },
  { href: "/dashboard/broadcast", label: "Broadcast", icon: "broadcast", pro: true },
  { href: "/dashboard/settings", label: "Configurações", icon: "settings", pro: false },
] as const;

function NavIcon({ icon }: { icon: string }) {
  if (icon === "orders") {
    return (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    );
  }
  if (icon === "menu") {
    return (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    );
  }
  if (icon === "pos") {
    return (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12M3 3h18a1.5 1.5 0 011.5 1.5v15A1.5 1.5 0 0121 21H3a1.5 1.5 0 01-1.5-1.5v-15A1.5 1.5 0 013 3z" />
      </svg>
    );
  }
  if (icon === "customers") {
    return (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    );
  }
  if (icon === "report") {
    return (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
  }
  if (icon === "broadcast") {
    return (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function isNavActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function DashboardSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-3">
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-brand-50 text-brand"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <NavIcon icon={item.icon} />
            <span className="flex-1">{item.label}</span>
            {item.pro && (
              <span className="shrink-0 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                Pro
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition ${
              active
                ? "bg-brand text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {item.label}
            {item.pro && !active && (
              <span className="rounded-full bg-violet-100 px-1 py-0.5 text-[9px] font-bold uppercase text-violet-700">
                Pro
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
