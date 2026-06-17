import { type NextRequest, NextResponse } from "next/server";
import { findCrmUser, criarToken } from "@/lib/crm/auth";

export async function POST(req: NextRequest) {
  const { telefone } = await req.json();

  if (!telefone || typeof telefone !== "string") {
    return NextResponse.json({ error: "Número inválido" }, { status: 400 });
  }

  const user = findCrmUser(telefone);
  if (!user) {
    return NextResponse.json({ error: "Número não autorizado" }, { status: 401 });
  }

  const token = criarToken(user.telefone);
  const res = NextResponse.json({ ok: true, nome: user.nome });

  res.cookies.set("crm_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: "/",
  });

  return res;
}
