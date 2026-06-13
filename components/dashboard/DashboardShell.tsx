import Link from "next/link";
import Logo from "@/components/brand/Logo";
import PlanBadge from "@/components/dashboard/PlanBadge";
import {
  DashboardMobileNav,
  DashboardSidebarNav,
} from "@/components/dashboard/DashboardNav";
import {
  DashboardSearchBar,
  DashboardSearchProvider,
} from "@/components/dashboard/DashboardSearch";
import DashboardQuickActions from "@/components/dashboard/DashboardQuickActions";
import type { PlanType } from "@/types/database";

export default function DashboardShell({
  establishmentId,
  establishmentName,
  whatsappNumber,
  plan,
  isManuallyClose = false,
  devMode = false,
  children,
}: {
  establishmentId: string;
  establishmentName: string;
  whatsappNumber?: string;
  plan: PlanType;
  isManuallyClose?: boolean;
  devMode?: boolean;
  children: React.ReactNode;
}) {
  const formattedPhone = whatsappNumber
    ? whatsappNumber.replace(/^55(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")
    : null;

  return (
    <DashboardSearchProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="lg:flex">
          <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
            <div className="border-b border-gray-100 px-5 py-5">
              <Link href="/dashboard">
                <Logo size={34} />
              </Link>
              <p className="mt-3 font-semibold text-gray-900">{establishmentName}</p>
              {formattedPhone && (
                <p className="mt-0.5 text-xs text-gray-500">{formattedPhone}</p>
              )}
              <div className="mt-3">
                <Link href="/dashboard/settings#plano">
                  <PlanBadge plan={plan} compact />
                </Link>
              </div>
            </div>

            <div className="relative border-b border-gray-100">
              <DashboardSearchBar establishmentId={establishmentId} variant="sidebar" />
            </div>

            <DashboardSidebarNav />

            <div className="mt-auto">
              {devMode && (
                <div className="border-t border-gray-100 px-4 pt-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Modo desenvolvimento
                  </span>
                </div>
              )}
              <DashboardQuickActions
                initialIsClosed={isManuallyClose}
                devMode={devMode}
              />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <header className="border-b border-gray-200 bg-white px-4 py-4 lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <Link href="/dashboard">
                  <Logo size={30} />
                </Link>
                {devMode && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                    Dev
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-gray-900">{establishmentName}</p>
              <Link href="/dashboard/settings#plano" className="mt-1 inline-block">
                <PlanBadge plan={plan} compact />
              </Link>
              <div className="relative border-b border-gray-100 pb-3">
                <DashboardSearchBar establishmentId={establishmentId} variant="mobile" />
              </div>
              <DashboardMobileNav />
              <DashboardQuickActions
                initialIsClosed={isManuallyClose}
                devMode={devMode}
              />
            </header>

            <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </div>
        </div>
      </div>
    </DashboardSearchProvider>
  );
}
