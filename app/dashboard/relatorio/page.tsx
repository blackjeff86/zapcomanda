import { getDashboardContext } from "@/lib/dashboard/context";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import WeeklyReport from "@/components/dashboard/WeeklyReport";

export const metadata = {
  title: "Relatório — ZapComanda",
};

export default async function RelatorioPage() {
  await getDashboardContext();

  return (
    <>
      <DashboardPageHeader
        title="Relatório"
        description="Faturamento, pedidos, ticket médio e principais indicadores do período."
      />
      <WeeklyReport />
    </>
  );
}
