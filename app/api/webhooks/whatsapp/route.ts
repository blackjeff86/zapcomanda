import { NextRequest, NextResponse } from "next/server";
import { parseWebhookPayload } from "@/lib/whatsapp/parser";
import { handleIncomingMessage } from "@/lib/whatsapp/handler";

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get("authorization");
      const apiKey = request.headers.get("apikey");

      if (authHeader !== `Bearer ${webhookSecret}` && apiKey !== webhookSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const message = parseWebhookPayload(body);

    if (!message) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    await handleIncomingMessage(message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "zapcomanda-whatsapp-webhook",
  });
}
