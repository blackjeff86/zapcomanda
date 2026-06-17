import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCrmUser } from "@/lib/crm/auth";

const bodySchema = z.object({
  status: z
    .enum(["novo", "contatado", "respondeu", "demo", "fechado", "sem_interesse", "follow_up"])
    .optional(),
  tipo_contato: z
    .enum(["whatsapp", "ligacao", "instagram", "presencial", "email"])
    .nullable()
    .optional(),
  tem_interesse: z.boolean().nullable().optional(),
  respondeu: z.boolean().nullable().optional(),
  contatado_em: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isCrmUser(user.email)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .schema("zapcomanda")
    .from("leads")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
