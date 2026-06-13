import { NextRequest, NextResponse } from "next/server";
import {
  completeOrderDelivery,
  getOrderByDeliveryToken,
  uploadDeliveryPhoto,
} from "@/lib/orders/complete-delivery";
import { isPayOnDelivery } from "@/lib/payments/methods";

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const order = await getOrderByDeliveryToken(params.token);

  if (!order) {
    return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const order = await getOrderByDeliveryToken(params.token);

    if (!order) {
      return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 404 });
    }

    if (order.status === "delivered") {
      return NextResponse.json({ ok: true, alreadyDelivered: true });
    }

    if (order.status !== "out_for_delivery") {
      return NextResponse.json(
        { error: "Este pedido ainda não saiu para entrega" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const paymentCollectedRaw = formData.get("payment_collected");
    const photo = formData.get("photo");

    const needsPayment =
      order.payment_method && isPayOnDelivery(order.payment_method);

    let paymentCollected = true;
    if (needsPayment) {
      paymentCollected =
        paymentCollectedRaw === "true" || paymentCollectedRaw === "1";
    }

    let photoUrl: string | null = null;
    if (photo instanceof File && photo.size > 0) {
      photoUrl = await uploadDeliveryPhoto(order.id, photo);
    }

    await completeOrderDelivery(order.id, {
      paymentCollected,
      deliveryPhotoUrl: photoUrl,
      confirmedBy: "delivery_link",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delivery confirm error:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao confirmar entrega";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
