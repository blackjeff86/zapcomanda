-- ZapComanda schema (shared Supabase project, isolated schema)
CREATE SCHEMA IF NOT EXISTS zapcomanda;

-- Enums
CREATE TYPE zapcomanda.establishment_category AS ENUM ('lanchonete', 'quentinha');
CREATE TYPE zapcomanda.plan_type AS ENUM ('basic', 'pro');
CREATE TYPE zapcomanda.order_status AS ENUM (
  'awaiting_payment',
  'paid',
  'preparing',
  'delivered',
  'cancelled'
);
CREATE TYPE zapcomanda.payment_status AS ENUM (
  'pending',
  'confirmed',
  'expired',
  'refunded'
);

-- Establishments
CREATE TABLE zapcomanda.establishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  category zapcomanda.establishment_category NOT NULL,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#16a34a',
  plan zapcomanda.plan_type NOT NULL DEFAULT 'basic',
  asaas_customer_id TEXT,
  asaas_subscription_id TEXT,
  whatsapp_instance_id TEXT,
  order_cutoff_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (whatsapp_number)
);

-- Menu items
CREATE TABLE zapcomanda.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES zapcomanda.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  photo_url TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_daily BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customers (auto-created on first order)
CREATE TABLE zapcomanda.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES zapcomanda.establishments(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (establishment_id, phone)
);

-- Orders
CREATE TABLE zapcomanda.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES zapcomanda.establishments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES zapcomanda.customers(id) ON DELETE RESTRICT,
  status zapcomanda.order_status NOT NULL DEFAULT 'awaiting_payment',
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order items (snapshot at time of order)
CREATE TABLE zapcomanda.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES zapcomanda.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES zapcomanda.menu_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments (Asaas)
CREATE TABLE zapcomanda.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES zapcomanda.orders(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES zapcomanda.establishments(id) ON DELETE CASCADE,
  asaas_payment_id TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  status zapcomanda.payment_status NOT NULL DEFAULT 'pending',
  pix_copy_paste TEXT,
  pix_qr_code TEXT,
  expires_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (asaas_payment_id)
);

-- WhatsApp bot conversation state
CREATE TABLE zapcomanda.whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES zapcomanda.establishments(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  step TEXT NOT NULL DEFAULT 'idle',
  cart JSONB NOT NULL DEFAULT '[]'::jsonb,
  pending_order_id UUID REFERENCES zapcomanda.orders(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (establishment_id, phone)
);

-- Indexes
CREATE INDEX idx_menu_items_establishment ON zapcomanda.menu_items(establishment_id);
CREATE INDEX idx_orders_establishment_status ON zapcomanda.orders(establishment_id, status);
CREATE INDEX idx_orders_created_at ON zapcomanda.orders(created_at DESC);
CREATE INDEX idx_customers_establishment ON zapcomanda.customers(establishment_id);
CREATE INDEX idx_payments_order ON zapcomanda.payments(order_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION zapcomanda.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER establishments_updated_at
  BEFORE UPDATE ON zapcomanda.establishments
  FOR EACH ROW EXECUTE FUNCTION zapcomanda.set_updated_at();

CREATE TRIGGER menu_items_updated_at
  BEFORE UPDATE ON zapcomanda.menu_items
  FOR EACH ROW EXECUTE FUNCTION zapcomanda.set_updated_at();

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON zapcomanda.customers
  FOR EACH ROW EXECUTE FUNCTION zapcomanda.set_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON zapcomanda.orders
  FOR EACH ROW EXECUTE FUNCTION zapcomanda.set_updated_at();

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON zapcomanda.payments
  FOR EACH ROW EXECUTE FUNCTION zapcomanda.set_updated_at();

CREATE TRIGGER whatsapp_sessions_updated_at
  BEFORE UPDATE ON zapcomanda.whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION zapcomanda.set_updated_at();

-- RLS
ALTER TABLE zapcomanda.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapcomanda.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapcomanda.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapcomanda.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapcomanda.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapcomanda.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapcomanda.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Owners can manage their establishments
CREATE POLICY establishments_owner ON zapcomanda.establishments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY menu_items_owner ON zapcomanda.menu_items
  FOR ALL USING (
    establishment_id IN (
      SELECT id FROM zapcomanda.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY customers_owner ON zapcomanda.customers
  FOR ALL USING (
    establishment_id IN (
      SELECT id FROM zapcomanda.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY orders_owner ON zapcomanda.orders
  FOR ALL USING (
    establishment_id IN (
      SELECT id FROM zapcomanda.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY order_items_owner ON zapcomanda.order_items
  FOR ALL USING (
    order_id IN (
      SELECT o.id FROM zapcomanda.orders o
      JOIN zapcomanda.establishments e ON e.id = o.establishment_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY payments_owner ON zapcomanda.payments
  FOR ALL USING (
    establishment_id IN (
      SELECT id FROM zapcomanda.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY whatsapp_sessions_owner ON zapcomanda.whatsapp_sessions
  FOR ALL USING (
    establishment_id IN (
      SELECT id FROM zapcomanda.establishments WHERE user_id = auth.uid()
    )
  );

-- Service role bypasses RLS; webhooks use service role client

-- Storage bucket for logos and menu photos (run in Supabase dashboard or separate migration)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('zapcomanda', 'zapcomanda', true);
