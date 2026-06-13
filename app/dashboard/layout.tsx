import DashboardShell from "@/components/dashboard/DashboardShell";
import { getDashboardContext } from "@/lib/dashboard/context";

export const metadata = {
  title: "Painel — ZapComanda",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { bypassAuth, establishment } = await getDashboardContext();

  return (
    <DashboardShell
      establishmentId={establishment.id}
      establishmentName={establishment.name}
      whatsappNumber={establishment.whatsapp_number}
      plan={establishment.plan}
      isManuallyClose={establishment.is_manually_closed}
      devMode={bypassAuth}
    >
      {children}
    </DashboardShell>
  );
}
