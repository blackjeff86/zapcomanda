import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEstablishmentForApi } from "@/lib/api/establishment-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendText } from "@/lib/whatsapp/client";
import { isProPlan } from "@/lib/plans/features";

const broadcastSchema = z.object({
  message: z.string().min(1, "Mensagem obrigatória").max(1000, "Máximo 1000 caracteres"),
});

export async function GET() {
  const access = await getEstablishmentForApi();
  if (!access) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!isProPlan(access.establishment.plan)) {
    return NextResponse.json({ error: "Recurso exclusivo do plano Pro" }, { status: 403 });
  }

  const customersQuery = access.bypass
    ? createAdminClient()
        .from("customers")
        .select("id, phone, name")
        .eq("establishment_id", access.establishment.id)
        .order("created_at", { ascending: false })
    : (await createClient())
        .schema("zapcomanda")
        .from("customers")
        .select("id, phone, name")
        .eq("establishment_id", access.establishment.id)
        .order("created_at", { ascending: false });

  const { data: customers, error } = await customersQuery;

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 });
  }

  return NextResponse.json({ customers: customers ?? [], total: (customers ?? []).length });
}

export async function POST(request: NextRequest) {
  try {
    const access = await getEstablishmentForApi();
    if (!access) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!isProPlan(access.establishment.plan)) {
      return NextResponse.json({ error: "Recurso exclusivo do plano Pro" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = broadcastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const { message } = parsed.data;
    const { establishment } = access;

    const customersQuery = access.bypass
      ? createAdminClient()
          .from("customers")
          .select("phone")
          .eq("establishment_id", establishment.id)
      : (await createClient())
          .schema("zapcomanda")
          .from("customers")
          .select("phone")
          .eq("establishment_id", establishment.id);

    const { data: customers, error } = await customersQuery;

    if (error) {
      return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 });
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, errors: 0, total: 0 });
    }

    const instanceId = establishment.whatsapp_instance_id ?? undefined;
    let sent = 0;
    let errors = 0;

    // Send in batches to avoid overwhelming the WhatsApp API
    for (const customer of customers) {
      try {
        await sendText({ phone: customer.phone, message, instanceId });
        sent++;
        // Small delay between messages to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch {
        errors++;
      }
    }

    return NextResponse.json({ ok: true, sent, errors, total: customers.length });
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ error: "Erro ao enviar broadcast" }, { status: 500 });
  }
}
