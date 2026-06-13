import { getDashboardContext } from "@/lib/dashboard/context";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import SettingsForm from "@/components/dashboard/SettingsForm";

export const metadata = {
  title: "Configurações — ZapComanda",
};

export default async function SettingsPage() {
  const { devMock, establishment } = await getDashboardContext();

  return (
    <>
      <DashboardPageHeader
        title="Configurações"
        description="Dados do negócio, plano, pagamentos e integrações."
      />

      <SettingsForm establishment={establishment} devMock={devMock} />
    </>
  );
}
