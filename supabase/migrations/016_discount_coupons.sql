-- Cupons de desconto por estabelecimento
CREATE TYPE zapcomanda.coupon_discount_type AS ENUM ('fixed', 'percent');

CREATE TABLE zapcomanda.discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES zapcomanda.establishments(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type zapcomanda.coupon_discount_type NOT NULL,
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (establishment_id, code)
);

CREATE INDEX idx_discount_coupons_establishment
  ON zapcomanda.discount_coupons (establishment_id);

CREATE INDEX idx_discount_coupons_code
  ON zapcomanda.discount_coupons (establishment_id, code);

ALTER TABLE zapcomanda.orders
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES zapcomanda.discount_coupons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0
    CHECK (discount_amount >= 0);

COMMENT ON TABLE zapcomanda.discount_coupons IS
  'Cupons de desconto criados pelo estabelecimento (valor fixo ou percentual).';

COMMENT ON COLUMN zapcomanda.orders.discount_amount IS
  'Valor do desconto aplicado via cupom neste pedido.';

CREATE TRIGGER discount_coupons_updated_at
  BEFORE UPDATE ON zapcomanda.discount_coupons
  FOR EACH ROW EXECUTE FUNCTION zapcomanda.set_updated_at();

ALTER TABLE zapcomanda.discount_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY discount_coupons_owner ON zapcomanda.discount_coupons
  FOR ALL USING (
    establishment_id IN (
      SELECT id FROM zapcomanda.establishments WHERE user_id = auth.uid()
    )
  );
