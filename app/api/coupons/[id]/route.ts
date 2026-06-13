import { NextRequest, NextResponse } from "next/server";
import { getEstablishmentForApi } from "@/lib/api/establishment-access";
import { parseCouponExpiryDate } from "@/lib/coupons/apply";
import { couponUpdateSchema } from "@/lib/validations/coupon";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await getEstablishmentForApi();
  if (!access) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = couponUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.is_active !== undefined) {
      updates.is_active = parsed.data.is_active;
    }
    if (parsed.data.expires_at) {
      updates.expires_at = parseCouponExpiryDate(parsed.data.expires_at).toISOString();
    }

    if (access.devMock) {
      return NextResponse.json({ ok: true, ...updates });
    }

    if (access.bypass) {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("discount_coupons")
        .update(updates)
        .eq("id", params.id)
        .eq("establishment_id", access.establishment.id)
        .select("*")
        .single();

      if (error) throw error;
      if (!data) {
        return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 });
      }
      return NextResponse.json(data);
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("zapcomanda")
      .from("discount_coupons")
      .update(updates)
      .eq("id", params.id)
      .eq("establishment_id", access.establishment.id)
      .select("*")
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Coupon update error:", error);
    return NextResponse.json({ error: "Erro ao atualizar cupom" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await getEstablishmentForApi();
  if (!access) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (access.devMock) {
    return NextResponse.json({ ok: true });
  }

  try {
    if (access.bypass) {
      const admin = createAdminClient();
      const { error } = await admin
        .from("discount_coupons")
        .delete()
        .eq("id", params.id)
        .eq("establishment_id", access.establishment.id);

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .schema("zapcomanda")
      .from("discount_coupons")
      .delete()
      .eq("id", params.id)
      .eq("establishment_id", access.establishment.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Coupon delete error:", error);
    return NextResponse.json({ error: "Erro ao remover cupom" }, { status: 500 });
  }
}
