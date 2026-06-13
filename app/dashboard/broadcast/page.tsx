import { getDashboardContext } from "@/lib/dashboard/context";
import { isProPlan } from "@/lib/plans/features";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import ProFeatureUpsell from "@/components/dashboard/ProFeatureUpsell";
import BroadcastForm from "@/components/dashboard/BroadcastForm";

export const metadata = {
  title: "Broadcast — ZapComanda",
};

export default async function BroadcastPage() {
  const { establishment } = await getDashboardContext();
  const isPro = isProPlan(establishment.plan);

  return (
    <>
      <DashboardPageHeader
        title="Broadcast"
        description="Envie uma mensagem para todos os seus clientes via WhatsApp."
      />

      {!isPro ? (
        <ProFeatureUpsell
          title="Broadcast é exclusivo do plano Pro"
          description="Envie mensagens em massa para todos os clientes cadastrados. Perfeito para avisar promoções, cardápio do dia e novidades."
        />
      ) : (
        <BroadcastForm />
      )}
    </>
  );
}
