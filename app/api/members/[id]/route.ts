import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEstablishmentForApi } from "@/lib/api/establishment-access";
import { createAdminClient } from "@/lib/supabase/admin";

const updateMemberSchema = z.object({
  role: z.enum(["admin", "caixa"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getEstablishmentForApi();
  if (!access) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (access.userRole !== "admin") return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = updateMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("establishment_members")
    .update({ role: parsed.data.role })
    .eq("id", id)
    .eq("establishment_id", access.establishment.id)
    .select("id, user_id, role, name, email, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getEstablishmentForApi();
  if (!access) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (access.userRole !== "admin") return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();

  // Fetch the member first to get their user_id
  const { data: member, error: fetchError } = await admin
    .from("establishment_members")
    .select("user_id")
    .eq("id", id)
    .eq("establishment_id", access.establishment.id)
    .single();

  if (fetchError || !member) {
    return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
  }

  // Delete from establishment_members
  await admin
    .from("establishment_members")
    .delete()
    .eq("id", id)
    .eq("establishment_id", access.establishment.id);

  // Delete the Supabase auth user
  await admin.auth.admin.deleteUser(member.user_id);

  return NextResponse.json({ success: true });
}
