import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const externalReference = payment.externalReference;
    const { tryActivatePlanFromPayment } = await import("@/lib/plans/activate");

    if (await tryActivatePlanFromPayment(externalReference)) {
      return NextResponse.json({ ok: true, plan_activated: true });
    }

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

    const { confirmOrderPayment } = await import("@/lib/payments/confirm-order-payment");
    await confirmOrderPayment(dbPayment.order_id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Asaas webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
