import { redirect } from "next/navigation";
import { getDevEstablishment, isAuthBypassed } from "@/lib/dev-auth";
import { getDevMockEstablishment } from "@/lib/dev-mock";
import { createClient } from "@/lib/supabase/server";
import type { Establishment, MemberRole } from "@/types/database";

export interface DashboardContext {
  bypassAuth: boolean;
  devMock: boolean;
  establishment: Establishment;
  userRole: MemberRole;
}

export async function getDashboardContext(): Promise<DashboardContext> {
  const bypassAuth = isAuthBypassed();

  if (bypassAuth) {
    let establishment = await getDevEstablishment();
    let devMock = false;

    if (!establishment) {
      establishment = getDevMockEstablishment();
      devMock = true;
    }

    return { bypassAuth, devMock, establishment, userRole: "admin" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if this user owns an establishment
  const { data: owned } = await supabase
    .schema("zapcomanda")
    .from("establishments")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (owned) {
    return { bypassAuth: false, devMock: false, establishment: owned, userRole: "admin" };
  }

  // Check if this user is a staff member
  const { data: membership } = await supabase
    .schema("zapcomanda")
    .from("establishment_members")
    .select("establishment_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) redirect("/onboarding");

  const { data: establishment } = await supabase
    .schema("zapcomanda")
    .from("establishments")
    .select("*")
    .eq("id", membership.establishment_id)
    .maybeSingle();

  if (!establishment) redirect("/onboarding");

  return {
    bypassAuth: false,
    devMock: false,
    establishment,
    userRole: membership.role as MemberRole,
  };
}
