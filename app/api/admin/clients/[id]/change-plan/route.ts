import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isInternalAdminEmail } from "@/lib/admin/auth";
import { planAmount } from "@/lib/admin/plans";

const bodySchema = z.object({
  plan: z.enum(["basic", "pro"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isInternalAdminEmail(user.email)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }

  const { plan } = parsed.data;
  const admin = createAdminClient();

  const { error: estError } = await admin
    .schema("zapcomanda")
    .from("establishments")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", params.id);

  if (estError) {
    return NextResponse.json({ error: estError.message }, { status: 500 });
  }

  await admin
    .from("subscriptions")
    .update({
      plan_amount: planAmount(plan),
      updated_at: new Date().toISOString(),
    })
    .eq("establishment_id", params.id);

  return NextResponse.json({ ok: true, plan });
}
