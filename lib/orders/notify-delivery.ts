import { sendText } from "@/lib/whatsapp/client";

export async function notifyCustomerOrderDelivered(options: {
  customerPhone: string;
  establishmentName: string;
  instanceId?: string | null;
  customerName?: string | null;
}): Promise<void> {
  const greeting = options.customerName
    ? `Olá, ${options.customerName.split(" ")[0]}!`
    : "Olá!";

  try {
    await sendText({
      phone: options.customerPhone,
      message:
        `✅ *Pedido entregue!*\n\n` +
        `${greeting} Confirmamos que seu pedido do *${options.establishmentName}* foi entregue.\n\n` +
        `Obrigado pela preferência! Volte sempre. 🍽️`,
      instanceId: options.instanceId || undefined,
    });
  } catch (error) {
    console.error("Delivery WhatsApp notification error:", error);
  }
}
