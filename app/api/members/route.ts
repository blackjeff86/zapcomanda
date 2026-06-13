import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEstablishmentForApi } from "@/lib/api/establishment-access";
import { createAdminClient } from "@/lib/supabase/admin";

const createMemberSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z
    .string()
    .min(6, "Senha deve ter ao menos 6 caracteres"),
  role: z.enum(["admin", "caixa"]),
});

export async function GET() {
  const access = await getEstablishmentForApi();
  if (!access) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (access.userRole !== "admin") return NextResponse.json({ error: "Apenas administradores podem gerenciar membros" }, { status: 403 });

  const admin = createAdminClient();

  const { data: members, error } = await admin
    .from("establishment_members")
    .select("id, user_id, role, name, email, created_at")
    .eq("establishment_id", access.establishment.id)
    .order("created_at");

  if (error) {
    console.error("Members fetch error:", error);
    return NextResponse.json({ error: "Erro ao buscar membros" }, { status: 500 });
  }

  // Also return the owner's info from auth
  let ownerEmail: string | null = null;
  try {
    const { data: ownerUser } = await admin.auth.admin.getUserById(access.establishment.user_id);
    ownerEmail = ownerUser?.user?.email ?? null;
  } catch {
    // non-critical
  }

  return NextResponse.json({
    owner: { user_id: access.establishment.user_id, email: ownerEmail },
    members: members ?? [],
  });
}

export async function POST(request: NextRequest) {
  const access = await getEstablishmentForApi();
  if (!access) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (access.userRole !== "admin") return NextResponse.json({ error: "Apenas administradores podem criar membros" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = createMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { name, email, password, role } = parsed.data;
  const admin = createAdminClient();

  // Create the Supabase auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (authError || !authData.user) {
    const message = authError?.message ?? "Erro ao criar usuário";
    if (message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: "Já existe uma conta com este e-mail" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Create the establishment_members record
  const { data: member, error: memberError } = await admin
    .from("establishment_members")
    .insert({
      establishment_id: access.establishment.id,
      user_id: authData.user.id,
      role,
      name,
      email,
    })
    .select("id, user_id, role, name, email, created_at")
    .single();

  if (memberError) {
    // Rollback: delete the auth user
    await admin.auth.admin.deleteUser(authData.user.id);
    console.error("Member insert error:", memberError);
    return NextResponse.json({ error: "Erro ao vincular membro ao estabelecimento" }, { status: 500 });
  }

  return NextResponse.json(member, { status: 201 });
}
