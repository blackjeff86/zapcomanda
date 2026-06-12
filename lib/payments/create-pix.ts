import { createAdminClient } from "@/lib/supabase/admin";
import { ensureAsaasCustomer } from "@/lib/asaas/customers";
import { createPixPayment, getPixQrCode } from "@/lib/asaas/client";

interface CreateOrderPixInput {
  orderId: string;
  establishmentId: string;
  customerPhone: string;
  amount: number;
  establishmentName: string;
}

export async function createOrderPixPayment(
  input: CreateOrderPixInput
): Promise<{ pixCopyPaste: string; paymentId: string }> {
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

  const supabase = createAdminClient();

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

  return { pixCopyPaste: qrCode.payload, paymentId: payment.id };
}
