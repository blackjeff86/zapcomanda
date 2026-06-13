import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEstablishmentForApi } from "@/lib/api/establishment-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isProPlan } from "@/lib/plans/features";

const MAX_EXTRA_INSTANCES = 1; // Pro allows 1 extra (total of 2 with primary)

const instanceSchema = z.object({
  instance_id: z.string().min(1, "ID da instância obrigatório").max(100),
  label: z.string().min(1, "Nome obrigatório").max(50).default("Número 2"),
});

export async function GET() {
  const access = await getEstablishmentForApi();
  if (!access) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let instances;
  let err;

  if (access.bypass) {
    const admin = createAdminClient();
    const result = await admin
      .from("whatsapp_instances")
      .select("*")
      .eq("establishment_id", access.establishment.id)
      .order("created_at", { ascending: true });
    instances = result.data;
    err = result.error;
  } else {
    const supabase = await createClient();
    const result = await supabase
      .schema("zapcomanda")
      .from("whatsapp_instances")
      .select("*")
      .eq("establishment_id", access.establishment.id)
      .order("created_at", { ascending: true });
    instances = result.data;
    err = result.error;
  }

  if (err) {
    return NextResponse.json({ error: "Erro ao buscar instâncias" }, { status: 500 });
  }

  return NextResponse.json({
    instances: instances ?? [],
    primary_instance_id: access.establishment.whatsapp_instance_id,
    can_add:
      isProPlan(access.establishment.plan) &&
      (instances ?? []).length < MAX_EXTRA_INSTANCES,
  });
}

export async function POST(request: NextRequest) {
  const access = await getEstablishmentForApi();
  if (!access) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!isProPlan(access.establishment.plan)) {
    return NextResponse.json({ error: "Recurso exclusivo do plano Pro" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = instanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { instance_id, label } = parsed.data;
  const establishmentId = access.establishment.id;

  // Check current count
  let currentCount = 0;
  if (access.bypass) {
    const admin = createAdminClient();
    const { count } = await admin
      .from("whatsapp_instances")
      .select("id", { count: "exact", head: true })
      .eq("establishment_id", establishmentId);
    currentCount = count ?? 0;
  } else {
    const supabase = await createClient();
    const { count } = await supabase
      .schema("zapcomanda")
      .from("whatsapp_instances")
      .select("id", { count: "exact", head: true })
      .eq("establishment_id", establishmentId);
    currentCount = count ?? 0;
  }

  if (currentCount >= MAX_EXTRA_INSTANCES) {
    return NextResponse.json(
      { error: "Limite de instâncias atingido. O plano Pro permite 1 número adicional." },
      { status: 400 }
    );
  }

  let data;
  let insertError;

  if (access.bypass) {
    const admin = createAdminClient();
    const result = await admin
      .from("whatsapp_instances")
      .insert({ establishment_id: establishmentId, instance_id, label })
      .select("*")
      .single();
    data = result.data;
    insertError = result.error;
  } else {
    const supabase = await createClient();
    const result = await supabase
      .schema("zapcomanda")
      .from("whatsapp_instances")
      .insert({ establishment_id: establishmentId, instance_id, label })
      .select("*")
      .single();
    data = result.data;
    insertError = result.error;
  }

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "Essa instância já está cadastrada." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao salvar instância" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, instance: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const access = await getEstablishmentForApi();
  if (!access) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  }

  let deleteError;

  if (access.bypass) {
    const admin = createAdminClient();
    const result = await admin
      .from("whatsapp_instances")
      .delete()
      .eq("id", id)
      .eq("establishment_id", access.establishment.id);
    deleteError = result.error;
  } else {
    const supabase = await createClient();
    const result = await supabase
      .schema("zapcomanda")
      .from("whatsapp_instances")
      .delete()
      .eq("id", id)
      .eq("establishment_id", access.establishment.id);
    deleteError = result.error;
  }

  if (deleteError) {
    return NextResponse.json({ error: "Erro ao remover instância" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
