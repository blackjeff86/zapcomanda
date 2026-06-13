import { createAdminClient } from "@/lib/supabase/admin";
import type { Establishment } from "@/types/database";

/** Desabilita login temporariamente — só use em desenvolvimento local. */
export function isAuthBypassed(): boolean {
  return (
    process.env.BYPASS_AUTH === "true" ||
    process.env.NEXT_PUBLIC_BYPASS_AUTH === "true"
  );
}

export function getLoginHref(): string {
  return isAuthBypassed() ? "/dashboard" : "/login";
}

export async function getDevEstablishment(): Promise<Establishment | null> {
  const admin = createAdminClient();
  const devId = process.env.DEV_ESTABLISHMENT_ID;

  if (devId) {
    const { data } = await admin
      .from("establishments")
      .select("*")
      .eq("id", devId)
      .maybeSingle();
    return data;
  }

  const { data } = await admin
    .from("establishments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}
