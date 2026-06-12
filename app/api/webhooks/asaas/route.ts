import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendText } from "@/lib/whatsapp/client";

const CONFIRMED_EVENTS = [
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
];

export async function POST(request: NextRequest) {
  try {
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (webhookToken) {
      const token = request.headers.get("asaas-access-token");
      if (token !== webhookToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const event = body.event as string;
    const payment = body.payment as Record<string, unknown> | undefined;

    if (!payment || !CONFIRMED_EVENTS.includes(event)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const asaasPaymentId = String(payment.id);
    const supabase = createAdminClient();

    const { data: dbPayment, error: paymentError } = await supabase
      .from("payments")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("asaas_payment_id", asaasPaymentId)
      .select("*")
      .maybeSingle();

    if (paymentError) throw paymentError;
    if (!dbPayment) {
      return NextResponse.json({ ok: true, not_found: true });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", dbPayment.order_id)
      .select("*, customers(phone), establishments(name, whatsapp_instance_id)")
      .single();

    if (orderError) throw orderError;

    const customer = order.customers as { phone: string };
    const establishment = order.establishments as {
      name: string;
      whatsapp_instance_id: string | null;
    };

    await sendText({
      phone: customer.phone,
      message:
        `🎉 Pagamento confirmado!\n\n` +
        `Seu pedido no *${establishment.name}* foi recebido e já está em preparo. ` +
        `Obrigado pela preferência!`,
      instanceId: establishment.whatsapp_instance_id || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Asaas webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
