import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verificarToken, findCrmUser } from "@/lib/crm/auth";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const cookieStore = await cookies();
  const token = cookieStore.get("crm_session")?.value;
  const telefone = token ? verificarToken(token) : null;
  const user = telefone ? findCrmUser(telefone) : null;

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
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
