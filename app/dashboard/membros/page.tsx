import { redirect } from "next/navigation";
import { getDashboardContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import MembrosClient from "@/components/dashboard/MembrosClient";
import type { EstablishmentMember } from "@/types/database";

export const metadata = {
  title: "Membros — ZapComanda",
};

export default async function MembrosPage() {
  const { establishment, userRole } = await getDashboardContext();

  if (userRole !== "admin") redirect("/dashboard");

  const admin = createAdminClient();

  const [ownerRes, membersRes] = await Promise.all([
    admin.auth.admin.getUserById(establishment.user_id),
    admin
      .from("establishment_members")
      .select("id, user_id, role, name, email, created_at")
      .eq("establishment_id", establishment.id)
      .order("created_at"),
  ]);

  const ownerEmail = ownerRes.data?.user?.email ?? null;
  const members = (membersRes.data ?? []) as EstablishmentMember[];

  return (
    <>
      <DashboardPageHeader
        title="Membros"
        description="Gerencie quem tem acesso ao painel do seu estabelecimento."
      />
      <MembrosClient
        owner={{ user_id: establishment.user_id, email: ownerEmail }}
        initialMembers={members}
      />
    </>
  );
}
