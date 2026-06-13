import { getDashboardContext } from "@/lib/dashboard/context";
import { isProPlan } from "@/lib/plans/features";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import ProFeatureUpsell from "@/components/dashboard/ProFeatureUpsell";
import WeeklyReport from "@/components/dashboard/WeeklyReport";

export const metadata = {
  title: "Relatório Semanal — ZapComanda",
};

export default async function RelatorioPage() {
  const { establishment } = await getDashboardContext();
  const isPro = isProPlan(establishment.plan);

  return (
    <>
      <DashboardPageHeader
        title="Relatório Semanal"
        description="Faturamento, pedidos e itens mais vendidos dos últimos 7 dias."
      />

      {!isPro ? (
        <ProFeatureUpsell
          title="Relatório Semanal é exclusivo do plano Pro"
          description="Acompanhe faturamento diário, ticket médio, itens mais vendidos e formas de pagamento em uma visão semanal completa."
        />
      ) : (
        <WeeklyReport />
      )}
    </>
  );
}
