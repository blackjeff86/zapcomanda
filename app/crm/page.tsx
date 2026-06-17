import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCrmUser } from "@/lib/crm/auth";
import CrmClient from "@/components/crm/CrmClient";

export const metadata = { title: "Pipeline — ZapComanda" };

export default async function CrmPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isCrmUser(user.email)) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { data: leads } = await admin
    .schema("zapcomanda")
    .from("leads")
    .select("*")
    .order("created_at", { ascending: true });

  return <CrmClient leads={leads ?? []} userName={user.email ?? ""} />;
}
