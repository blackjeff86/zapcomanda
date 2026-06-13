import { getDevEstablishment, isAuthBypassed } from "@/lib/dev-auth";
import { getDevMockEstablishment } from "@/lib/dev-mock";
import { createClient } from "@/lib/supabase/server";
import type { Establishment } from "@/types/database";

export interface EstablishmentAccess {
  establishment: Establishment;
  bypass: boolean;
  devMock: boolean;
}

export async function getEstablishmentForApi(): Promise<EstablishmentAccess | null> {
  if (isAuthBypassed()) {
    let establishment = await getDevEstablishment();
    let devMock = false;

    if (!establishment) {
      establishment = getDevMockEstablishment();
      devMock = true;
    }

    return { establishment, bypass: true, devMock };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .schema("zapcomanda")
    .from("establishments")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;

  return { establishment: data, bypass: false, devMock: false };
}
