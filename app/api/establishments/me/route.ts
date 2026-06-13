import { NextRequest, NextResponse } from "next/server";
import { getEstablishmentForApi } from "@/lib/api/establishment-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripProEstablishmentFields } from "@/lib/plans/features";
import { establishmentSettingsSchema } from "@/lib/validations/establishment";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const access = await getEstablishmentForApi();

  if (!access) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  return NextResponse.json(access.establishment);
}

export async function PATCH(request: NextRequest) {
  try {
    const access = await getEstablishmentForApi();

    if (!access) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = establishmentSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const proFields = stripProEstablishmentFields(access.establishment.plan, {
      order_cutoff_time: parsed.data.order_cutoff_time || null,
    });

    if (access.devMock) {
      return NextResponse.json({
        ...access.establishment,
        ...parsed.data,
        logo_url: parsed.data.logo_url || null,
        order_cutoff_time: proFields.order_cutoff_time ?? null,
        accepted_payment_methods:
          parsed.data.accepted_payment_methods ??
          access.establishment.accepted_payment_methods,
        delivery_fee_enabled:
          parsed.data.delivery_fee_enabled ??
          access.establishment.delivery_fee_enabled,
        delivery_fee_amount:
          parsed.data.delivery_fee_enabled
            ? parsed.data.delivery_fee_amount ?? access.establishment.delivery_fee_amount
            : 0,
        pix_key_type: parsed.data.pix_key?.trim()
          ? parsed.data.pix_key_type ?? access.establishment.pix_key_type
          : null,
        pix_key: parsed.data.pix_key?.trim()
          ? parsed.data.pix_key
          : null,
      });
    }

    const updates: Record<string, unknown> = {
      name: parsed.data.name,
      whatsapp_number: parsed.data.whatsapp_number.replace(/\D/g, ""),
      primary_color: parsed.data.primary_color,
      logo_url: parsed.data.logo_url || null,
      order_cutoff_time: proFields.order_cutoff_time ?? null,
    };

    if (parsed.data.slug) {
      updates.slug = parsed.data.slug;
    }

    if (parsed.data.accepted_payment_methods) {
      updates.accepted_payment_methods = parsed.data.accepted_payment_methods;
    }

    if (parsed.data.delivery_fee_enabled !== undefined) {
      updates.delivery_fee_enabled = parsed.data.delivery_fee_enabled;
      updates.delivery_fee_amount = parsed.data.delivery_fee_enabled
        ? parsed.data.delivery_fee_amount ?? 0
        : 0;
    }

    if (parsed.data.pix_key !== undefined || parsed.data.pix_key_type !== undefined) {
      const pixKey = parsed.data.pix_key?.trim() ?? "";
      if (pixKey && parsed.data.pix_key_type) {
        const { normalizePixKey } = await import("@/lib/payments/pix-key");
        updates.pix_key_type = parsed.data.pix_key_type;
        updates.pix_key = normalizePixKey(parsed.data.pix_key_type, pixKey);
      } else {
        updates.pix_key_type = null;
        updates.pix_key = null;
      }
    }

    if (access.bypass) {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("establishments")
        .update(updates)
        .eq("id", access.establishment.id)
        .select("*")
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("zapcomanda")
      .from("establishments")
      .update(updates)
      .eq("id", access.establishment.id)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Establishment update error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
