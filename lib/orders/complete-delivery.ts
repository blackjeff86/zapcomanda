import { createAdminClient } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { notifyCustomerOrderDelivered } from "@/lib/orders/notify-delivery";
import type { PaymentMethod } from "@/types/database";
import { isPayOnDelivery } from "@/lib/payments/methods";

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export async function uploadDeliveryPhoto(
  orderId: string,
  file: File
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Envie uma imagem (JPG, PNG ou WebP)");
  }

  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("A foto deve ter no máximo 5 MB");
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `delivery-photos/${orderId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const storage = createServiceRoleClient();
  const { error } = await storage.storage.from("zapcomanda").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw error;

  const { data } = storage.storage.from("zapcomanda").getPublicUrl(path);
  return data.publicUrl;
}

export async function completeOrderDelivery(
  orderId: string,
  options: {
    paymentCollected?: boolean;
    deliveryPhotoUrl?: string | null;
    confirmedBy: "owner" | "delivery_link";
  }
): Promise<{ ok: boolean; alreadyDelivered?: boolean }> {
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, status, payment_method, payment_collected, customers(phone, name), establishments(name, whatsapp_instance_id)"
    )
    .eq("id", orderId)
    .single();

  if (error || !order) throw new Error("Pedido não encontrado");

  if (order.status === "delivered") {
    return { ok: true, alreadyDelivered: true };
  }

  const paymentMethod = order.payment_method as PaymentMethod | null;
  const payOnDelivery = paymentMethod && isPayOnDelivery(paymentMethod);

  const paymentCollected =
    options.paymentCollected ??
    (!payOnDelivery || Boolean(order.payment_collected));

  const updates: Record<string, unknown> = {
    status: "delivered",
    delivered_at: new Date().toISOString(),
    payment_collected: paymentCollected,
    delivery_confirmed_by: options.confirmedBy,
  };

  if (options.deliveryPhotoUrl) {
    updates.delivery_photo_url = options.deliveryPhotoUrl;
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);

  if (updateError) throw updateError;

  const customer = unwrapRelation(
    order.customers as { phone: string; name: string | null } | { phone: string; name: string | null }[]
  );
  const establishment = unwrapRelation(
    order.establishments as
      | { name: string; whatsapp_instance_id: string | null }
      | { name: string; whatsapp_instance_id: string | null }[]
  );

  if (!customer || !establishment) {
    throw new Error("Dados do pedido incompletos");
  }

  await notifyCustomerOrderDelivered({
    customerPhone: customer.phone,
    establishmentName: establishment.name,
    instanceId: establishment.whatsapp_instance_id,
    customerName: customer.name,
  });

  return { ok: true };
}

export interface PublicDeliveryOrder {
  id: string;
  status: string;
  total_amount: number;
  payment_method: PaymentMethod | null;
  payment_collected: boolean;
  customer_name: string | null;
  establishment_name: string;
  items: Array<{ item_name: string; quantity: number }>;
  notes: string | null;
}

export async function getOrderByDeliveryToken(
  token: string
): Promise<PublicDeliveryOrder | null> {
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, status, total_amount, payment_method, payment_collected, notes, customers(name), establishments(name), order_items(item_name, quantity)"
    )
    .eq("delivery_token", token)
    .maybeSingle();

  if (error || !order) return null;

  const customer = unwrapRelation(
    order.customers as { name: string | null } | { name: string | null }[]
  );
  const establishment = unwrapRelation(
    order.establishments as { name: string } | { name: string }[]
  );
  const items = (order.order_items as Array<{ item_name: string; quantity: number }>) || [];

  return {
    id: order.id,
    status: order.status,
    total_amount: Number(order.total_amount),
    payment_method: order.payment_method as PaymentMethod | null,
    payment_collected: Boolean(order.payment_collected),
    customer_name: customer?.name ?? null,
    establishment_name: establishment?.name ?? "Estabelecimento",
    items,
    notes: order.notes as string | null,
  };
}

export async function ensureDeliveryToken(orderId: string): Promise<string> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("orders")
    .select("delivery_token")
    .eq("id", orderId)
    .single();

  if (existing?.delivery_token) return existing.delivery_token;

  const { generateDeliveryToken } = await import("@/lib/orders/delivery-token");
  const token = generateDeliveryToken();

  const { error } = await supabase
    .from("orders")
    .update({ delivery_token: token })
    .eq("id", orderId);

  if (error) throw error;
  return token;
}
