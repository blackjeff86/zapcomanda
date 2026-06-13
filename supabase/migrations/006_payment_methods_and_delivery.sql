-- Formas de pagamento aceitas e confirmação de entrega
ALTER TABLE zapcomanda.establishments
  ADD COLUMN IF NOT EXISTS accepted_payment_methods JSONB NOT NULL DEFAULT '["pix"]'::jsonb;

ALTER TABLE zapcomanda.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_collected BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

COMMENT ON COLUMN zapcomanda.establishments.accepted_payment_methods IS
  'Lista: pix, credit_card, debit_card, cash, meal_voucher';

COMMENT ON COLUMN zapcomanda.orders.payment_method IS
  'Forma escolhida pelo cliente no WhatsApp';

COMMENT ON COLUMN zapcomanda.orders.payment_collected IS
  'true quando Pix confirmado ou pagamento na entrega recebido';

COMMENT ON COLUMN zapcomanda.orders.delivered_at IS
  'Momento em que o estabelecimento confirmou a entrega';
