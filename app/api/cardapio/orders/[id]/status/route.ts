import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("orders")
      .select("status, payment_collected")
      .eq("id", params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      status: data.status,
      payment_collected: data.payment_collected,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
