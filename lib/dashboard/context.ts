import { redirect } from "next/navigation";
import { getDevEstablishment, isAuthBypassed } from "@/lib/dev-auth";
import { getDevMockEstablishment } from "@/lib/dev-mock";
import { createClient } from "@/lib/supabase/server";
import type { Establishment } from "@/types/database";

export interface DashboardContext {
  bypassAuth: boolean;
  devMock: boolean;
  establishment: Establishment;
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

    return { bypassAuth, devMock, establishment };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: establishment } = await supabase
    .schema("zapcomanda")
    .from("establishments")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!establishment) redirect("/onboarding");

  return { bypassAuth: false, devMock: false, establishment };
}
