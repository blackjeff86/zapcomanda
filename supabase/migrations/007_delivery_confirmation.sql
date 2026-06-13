-- Link de confirmação para entregador e foto da entrega
ALTER TABLE zapcomanda.orders
  ADD COLUMN IF NOT EXISTS delivery_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS delivery_confirmed_by TEXT;

COMMENT ON COLUMN zapcomanda.orders.delivery_token IS
  'Token público para o entregador confirmar entrega via link';

COMMENT ON COLUMN zapcomanda.orders.delivery_photo_url IS
  'URL da foto opcional tirada na entrega';

COMMENT ON COLUMN zapcomanda.orders.delivery_confirmed_by IS
  'owner = painel; delivery_link = link do entregador';

CREATE INDEX IF NOT EXISTS idx_orders_delivery_token
  ON zapcomanda.orders (delivery_token)
  WHERE delivery_token IS NOT NULL;

-- Bucket para fotos de entrega e logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('zapcomanda', 'zapcomanda', true)
ON CONFLICT (id) DO NOTHING;
