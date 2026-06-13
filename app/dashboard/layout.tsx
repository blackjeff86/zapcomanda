import DashboardShell from "@/components/dashboard/DashboardShell";
import { getDashboardContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BillingNotification } from "@/types/database";

export const metadata = {
  title: "Painel — ZapComanda",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { bypassAuth, establishment, userRole } = await getDashboardContext();

  let pendingNotification: BillingNotification | null = null;

  if (!bypassAuth && userRole !== "caixa") {
    const admin = createAdminClient();
    const { data } = await admin
      .from("billing_notifications")
      .select("*")
      .eq("establishment_id", establishment.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    pendingNotification = data as BillingNotification | null;
  }

  return (
    <DashboardShell
      establishmentId={establishment.id}
      establishmentName={establishment.name}
      whatsappNumber={establishment.whatsapp_number}
      plan={establishment.plan}
      isManuallyClose={establishment.is_manually_closed}
      devMode={bypassAuth}
      userRole={userRole}
      billingNotification={pendingNotification}
    >
      {children}
    </DashboardShell>
  );
}
