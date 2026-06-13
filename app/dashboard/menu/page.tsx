import { getDevMockMenuItems } from "@/lib/dev-mock";
import { getDashboardContext } from "@/lib/dashboard/context";
import { loadMenuItems } from "@/lib/dashboard/load-menu";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import MenuManager from "@/components/dashboard/MenuManager";

export const metadata = {
  title: "Cardápio — ZapComanda",
};

export default async function MenuPage() {
  const { bypassAuth, devMock, establishment } = await getDashboardContext();

  const items = devMock
    ? getDevMockMenuItems()
    : await loadMenuItems(establishment.id, bypassAuth);

  return (
    <>
      <DashboardPageHeader
        title="Cardápio"
        description="Itens que o cliente vê e escolhe no WhatsApp."
      />

      <MenuManager
        initialItems={items}
        devMock={devMock}
        establishmentCategory={establishment.category}
        plan={establishment.plan}
      />
    </>
  );
}
