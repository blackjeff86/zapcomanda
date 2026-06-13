import { NextRequest, NextResponse } from "next/server";
import { getEstablishmentForApi } from "@/lib/api/establishment-access";
import { couponCreateSchema, couponPayloadFromCreate } from "@/lib/validations/coupon";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { DiscountCoupon } from "@/types/database";

export async function GET() {
  const access = await getEstablishmentForApi();
  if (!access) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (access.devMock) {
    return NextResponse.json([]);
  }

  try {
    if (access.bypass) {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("discount_coupons")
        .select("*")
        .eq("establishment_id", access.establishment.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return NextResponse.json(data as DiscountCoupon[]);
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("zapcomanda")
      .from("discount_coupons")
      .select("*")
      .eq("establishment_id", access.establishment.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data as DiscountCoupon[]);
  } catch (error) {
    console.error("Coupons list error:", error);
    return NextResponse.json({ error: "Erro ao listar cupons" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await getEstablishmentForApi();
  if (!access) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = couponCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const payload = couponPayloadFromCreate(parsed.data);

    if (access.devMock) {
      return NextResponse.json({
        id: `mock-coupon-${Date.now()}`,
        establishment_id: access.establishment.id,
        ...payload,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const row = {
      establishment_id: access.establishment.id,
      ...payload,
    };

    if (access.bypass) {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("discount_coupons")
        .insert(row)
        .select("*")
        .single();

      if (error) {
        if (error.code === "23505") {
          return NextResponse.json(
            { error: "Já existe um cupom com este código" },
            { status: 409 }
          );
        }
        throw error;
      }
      return NextResponse.json(data, { status: 201 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("zapcomanda")
      .from("discount_coupons")
      .insert(row)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Já existe um cupom com este código" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Coupon create error:", error);
    return NextResponse.json({ error: "Erro ao criar cupom" }, { status: 500 });
  }
}
