-- Taxa de entrega configurável no estabelecimento
ALTER TABLE zapcomanda.establishments
  ADD COLUMN IF NOT EXISTS delivery_fee_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0
    CHECK (delivery_fee_amount >= 0);

ALTER TABLE zapcomanda.orders
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0
    CHECK (delivery_fee >= 0);

COMMENT ON COLUMN zapcomanda.establishments.delivery_fee_enabled IS
  'Se true, cobra taxa de entrega em cada pedido';

COMMENT ON COLUMN zapcomanda.establishments.delivery_fee_amount IS
  'Valor fixo da taxa de entrega em R$';

COMMENT ON COLUMN zapcomanda.orders.delivery_fee IS
  'Taxa de entrega cobrada neste pedido (snapshot)';
