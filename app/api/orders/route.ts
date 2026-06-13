import { NextRequest, NextResponse } from "next/server";
import { ORDER_LIST_SELECT } from "@/lib/orders/select";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthBypassed } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/server";

const ORDER_SELECT = ORDER_LIST_SELECT;

export async function GET(request: NextRequest) {
  const establishmentId = request.nextUrl.searchParams.get("establishment_id");

  if (!establishmentId) {
    return NextResponse.json(
      { error: "establishment_id é obrigatório" },
      { status: 400 }
    );
  }

  try {
    if (isAuthBypassed()) {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("orders")
        .select(ORDER_SELECT)
        .eq("establishment_id", establishmentId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return NextResponse.json(data ?? []);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: establishment, error: establishmentError } = await supabase
      .schema("zapcomanda")
      .from("establishments")
      .select("id")
      .eq("id", establishmentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (establishmentError || !establishment) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { data, error } = await supabase
      .schema("zapcomanda")
      .from("orders")
      .select(ORDER_SELECT)
      .eq("establishment_id", establishmentId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("Orders list error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
