import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAsaasCustomer } from "@/lib/asaas/customers";
import { createPixPayment, getPixQrCode } from "@/lib/asaas/client";
import { type PixKeyType } from "@/lib/payments/pix-key";
import { generateDirectPixBrCode } from "@/lib/payments/pix-br-code";

interface CreateOrderPixInput {
  orderId: string;
  establishmentId: string;
  customerPhone: string;
  amount: number;
  establishmentName: string;
  orderRef?: string;
}

export async function createOrderPixPayment(
  input: CreateOrderPixInput
): Promise<{ pixCopyPaste: string; paymentId: string; isDirectPix: boolean }> {
  const supabase = createAdminClient();

  const { data: establishment, error: establishmentError } = await supabase
    .from("establishments")
    .select("pix_key, pix_key_type, name")
    .eq("id", input.establishmentId)
    .single();

  if (establishmentError) throw establishmentError;

  const pixKey = establishment?.pix_key as string | null;
  const pixKeyType = establishment?.pix_key_type as PixKeyType | null;

  if (pixKey && pixKeyType) {
    const establishmentName = establishment?.name ?? input.establishmentName;
    const orderRef = input.orderRef ?? input.orderId.slice(0, 8);
    const brCode = generateDirectPixBrCode(
      pixKeyType,
      pixKey,
      input.amount,
      establishmentName,
      orderRef
    );

    const directId = `direct-pix:${input.orderId}`;

    const { error } = await supabase.from("payments").insert({
      order_id: input.orderId,
      establishment_id: input.establishmentId,
      asaas_payment_id: directId,
      amount: input.amount,
      status: "pending",
      pix_copy_paste: brCode,
    });

    if (error) throw error;

    return { pixCopyPaste: brCode, paymentId: directId, isDirectPix: true };
  }

  const asaasCustomerId = await ensureAsaasCustomer({
    name: `Cliente ${input.customerPhone}`,
    phone: input.customerPhone,
    externalReference: `zapcomanda:${input.establishmentId}:${input.customerPhone}`,
  });

  const payment = await createPixPayment({
    customerId: asaasCustomerId,
    value: input.amount,
    description: `Pedido ZapComanda — ${input.establishmentName}`,
    externalReference: input.orderId,
  });

  const qrCode = await getPixQrCode(payment.id);

  const { error } = await supabase.from("payments").insert({
    order_id: input.orderId,
    establishment_id: input.establishmentId,
    asaas_payment_id: payment.id,
    amount: input.amount,
    status: "pending",
    pix_copy_paste: qrCode.payload,
    pix_qr_code: qrCode.encodedImage,
    expires_at: qrCode.expirationDate,
  });

  if (error) throw error;

  return { pixCopyPaste: qrCode.payload, paymentId: payment.id, isDirectPix: false };
}
