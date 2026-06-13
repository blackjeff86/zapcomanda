import { NextRequest, NextResponse } from "next/server";
import { getEstablishmentForApi } from "@/lib/api/establishment-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  is_manually_closed: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  try {
    const access = await getEstablishmentForApi();
    if (!access) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    if (access.devMock) {
      return NextResponse.json({
        ...access.establishment,
        is_manually_closed: parsed.data.is_manually_closed,
      });
    }

    const table = { is_manually_closed: parsed.data.is_manually_closed };

    if (access.bypass) {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("establishments")
        .update(table)
        .eq("id", access.establishment.id)
        .select("id, is_manually_closed")
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("zapcomanda")
      .from("establishments")
      .update(table)
      .eq("id", access.establishment.id)
      .select("id, is_manually_closed")
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
