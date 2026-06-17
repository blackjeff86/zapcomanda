import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verificarToken, findCrmUser } from "@/lib/crm/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import CrmClient from "@/components/crm/CrmClient";

export const metadata = { title: "Pipeline — ZapComanda" };

export default async function CrmPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("crm_session")?.value;

  if (!token) redirect("/crm/login");

  const telefone = verificarToken(token);
  if (!telefone) redirect("/crm/login");

  const user = findCrmUser(telefone);
  if (!user) redirect("/crm/login");

  const admin = createAdminClient();
  const { data: leads } = await admin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: true });

  return <CrmClient leads={leads ?? []} userName={user.nome} />;
}
