import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { applyCouponToOrder, normalizeCouponCode } from "@/lib/coupons/apply";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DiscountCoupon } from "@/types/database";

const schema = z.object({
  establishment_id: z.string().uuid(),
  code: z.string().min(1),
  subtotal: z.coerce.number().min(0),
  delivery_fee: z.coerce.number().min(0).optional().default(0),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const code = normalizeCouponCode(parsed.data.code);
    const admin = createAdminClient();

    const { data: coupon, error } = await admin
      .from("discount_coupons")
      .select("*")
      .eq("establishment_id", parsed.data.establishment_id)
      .eq("code", code)
      .maybeSingle();

    if (error) throw error;
    if (!coupon) {
      return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 });
    }

    const result = applyCouponToOrder(
      parsed.data.subtotal,
      parsed.data.delivery_fee,
      coupon as DiscountCoupon
    );

    return NextResponse.json({
      coupon_id: result.coupon.id,
      code: result.coupon.code,
      discount_type: result.coupon.discount_type,
      discount_value: Number(result.coupon.discount_value),
      discount_amount: result.discountAmount,
      total: result.totalAfterDiscount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cupom inválido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
