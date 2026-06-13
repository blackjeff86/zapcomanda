import { getDashboardContext } from "@/lib/dashboard/context";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import SettingsForm from "@/components/dashboard/SettingsForm";

export const metadata = {
  title: "Configurações — ZapComanda",
};

export default async function SettingsPage() {
  const { devMock, establishment, userRole } = await getDashboardContext();

  const safeEstablishment =
    userRole === "caixa"
      ? { ...establishment, pix_key: null, pix_key_type: null }
      : establishment;

  return (
    <>
      <DashboardPageHeader
        title="Configurações"
        description="Dados do negócio, plano, pagamentos e integrações."
      />

      <SettingsForm establishment={safeEstablishment} devMock={devMock} userRole={userRole} />
    </>
  );
}
