export type EstablishmentCategory = "lanchonete" | "quentinha" | "doces";
export type PlanType = "basic" | "pro";
export type MemberRole = "admin" | "caixa";

export interface EstablishmentMember {
  id: string;
  establishment_id: string;
  user_id: string;
  role: MemberRole;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}
export type OrderStatus =
  | "awaiting_payment"
  | "paid"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "pending" | "confirmed" | "expired" | "refunded";

export type CouponDiscountType = "fixed" | "percent";

export type PaymentMethod =
  | "pix"
  | "credit_card"
  | "debit_card"
  | "cash"
  | "meal_voucher";

export type PixKeyType =
  | "cpf"
  | "cnpj"
  | "email"
  | "phone"
  | "random";

export type WhatsAppSessionStep =
  | "idle"
  | "browsing_categories"
  | "selecting_item"
  | "setting_quantity"
  | "selecting_addons"
  | "adding_notes"
  | "asking_more_items"
  | "selecting_payment_method"
  | "confirming_order"
  | "awaiting_payment";

export interface CartAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
  addons?: CartAddon[];
}

export interface PendingCartItem {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  addons?: CartAddon[];
}

export interface MenuItemAddon {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Establishment {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  whatsapp_number: string;
  category: EstablishmentCategory;
  logo_url: string | null;
  cover_url: string | null;
  tagline: string | null;
  wait_time_text: string | null;
  is_manually_closed: boolean;
  primary_color: string;
  plan: PlanType;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
  whatsapp_instance_id: string | null;
  order_cutoff_time: string | null;
  accepted_payment_methods: PaymentMethod[];
  delivery_fee_enabled: boolean;
  delivery_fee_amount: number;
  delivery_radius_km: number | null;
  pix_key_type: PixKeyType | null;
  pix_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  establishment_id: string;
  name: string;
  description: string | null;
  price: number;
  photo_url: string | null;
  category: string;
  is_active: boolean;
  is_daily: boolean;
  is_combo: boolean;
  combo_partner_id: string | null;
  combo_price: number | null;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  establishment_id: string;
  phone: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscountCoupon {
  id: string;
  establishment_id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  establishment_id: string;
  customer_id: string;
  status: OrderStatus;
  total_amount: number;
  notes: string | null;
  payment_method: PaymentMethod | null;
  payment_collected: boolean;
  delivery_fee: number;
  coupon_id: string | null;
  discount_amount: number;
  delivered_at: string | null;
  delivery_token: string | null;
  delivery_photo_url: string | null;
  delivery_confirmed_by: string | null;
  cash_tender_amount: number | null;
  change_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemAddon {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes: string | null;
  addons: OrderItemAddon[];
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  establishment_id: string;
  asaas_payment_id: string;
  amount: number;
  status: PaymentStatus;
  pix_copy_paste: string | null;
  pix_qr_code: string | null;
  expires_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppInstance {
  id: string;
  establishment_id: string;
  instance_id: string;
  label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppSession {
  id: string;
  establishment_id: string;
  phone: string;
  step: WhatsAppSessionStep;
  cart: CartItem[];
  pending_order_id: string | null;
  metadata: Record<string, unknown>;
  updated_at: string;
}

export interface OnboardingPayload {
  name: string;
  whatsapp_number: string;
  category: EstablishmentCategory;
  primary_color: string;
  logo_url?: string;
  menu_items: Array<{
    name: string;
    description?: string;
    price: number;
    category: string;
    photo_url?: string;
  }>;
}
