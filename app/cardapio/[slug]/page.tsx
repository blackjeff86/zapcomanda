import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import CardapioClient from "@/components/cardapio/CardapioClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .schema("zapcomanda")
    .from("establishments")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();

  return {
    title: data ? `${data.name} — Cardápio` : "Cardápio",
  };
}

export default async function CardapioPage({ params }: Props) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: establishment } = await admin
    .schema("zapcomanda")
    .from("establishments")
    .select(
      "id, slug, name, category, logo_url, cover_url, tagline, wait_time_text, is_manually_closed, whatsapp_number, primary_color, accepted_payment_methods, delivery_fee_enabled, delivery_fee_amount, pix_key, order_cutoff_time, delivery_radius_km"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!establishment) notFound();

  const { data: menuItems } = await admin
    .schema("zapcomanda")
    .from("menu_items")
    .select(
      "id, name, description, price, photo_url, category, combo_partner_id, combo_price, stock_quantity, low_stock_threshold, sort_order, menu_item_addons(id, name, price, is_active, sort_order)"
    )
    .eq("establishment_id", establishment.id)
    .eq("is_active", true)
    .order("sort_order");

  return (
    <CardapioClient
      establishment={establishment}
      menuItems={menuItems ?? []}
    />
  );
}
