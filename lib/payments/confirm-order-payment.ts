import { createAdminClient } from "@/lib/supabase/admin";
import { sendText } from "@/lib/whatsapp/client";

export async function confirmOrderPayment(orderId: string): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from("payments")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)
    .eq("status", "pending");

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_collected: true,
    })
    .eq("id", orderId)
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
}
