import { getDevEstablishment, isAuthBypassed } from "@/lib/dev-auth";
import { getDevMockEstablishment } from "@/lib/dev-mock";
import { createClient } from "@/lib/supabase/server";
import type { Establishment, MemberRole } from "@/types/database";

export interface EstablishmentAccess {
  establishment: Establishment;
  userRole: MemberRole;
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

    return { establishment, userRole: "admin", bypass: true, devMock };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Check if the user is the establishment owner
  const { data: owned } = await supabase
    .schema("zapcomanda")
    .from("establishments")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (owned) {
    return { establishment: owned, userRole: "admin", bypass: false, devMock: false };
  }

  // Check if the user is a staff member of any establishment
  const { data: membership } = await supabase
    .schema("zapcomanda")
    .from("establishment_members")
    .select("establishment_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return null;

  const { data: establishment } = await supabase
    .schema("zapcomanda")
    .from("establishments")
    .select("*")
    .eq("id", membership.establishment_id)
    .maybeSingle();

  if (!establishment) return null;

  return {
    establishment,
    userRole: membership.role as MemberRole,
    bypass: false,
    devMock: false,
  };
}
