import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import OrderTrackingClient from "@/components/cardapio/OrderTrackingClient";

type Props = { params: Promise<{ slug: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Acompanhar pedido — ${slug}` };
}

export default async function OrderTrackingPage({ params }: Props) {
  const { slug, id } = await params;
  const admin = createAdminClient();

  const { data: establishment } = await admin
    .schema("zapcomanda")
    .from("establishments")
    .select("id, slug, name, logo_url, primary_color")
    .eq("slug", slug)
    .maybeSingle();

  if (!establishment) notFound();

  const { data: order } = await admin
    .from("orders")
    .select(
      "id, status, total_amount, delivery_fee, payment_method, cash_tender_amount, change_amount, created_at, order_items(item_name, quantity, unit_price, notes, addons)"
    )
    .eq("id", id)
    .eq("establishment_id", establishment.id)
    .maybeSingle();

  if (!order) notFound();

  let pixCopyPaste: string | null = null;
  if (order.payment_method === "pix" && order.status === "awaiting_payment") {
    const { data: payment } = await admin
      .schema("zapcomanda")
      .from("payments")
      .select("pix_copy_paste")
      .eq("order_id", id)
      .maybeSingle();
    pixCopyPaste = payment?.pix_copy_paste ?? null;
  }

  return (
    <OrderTrackingClient
      establishment={establishment}
      order={order}
      pixCopyPaste={pixCopyPaste}
    />
  );
}
