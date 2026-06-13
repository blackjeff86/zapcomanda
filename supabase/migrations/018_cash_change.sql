-- Troco para pagamento em dinheiro na entrega
ALTER TABLE zapcomanda.orders
  ADD COLUMN IF NOT EXISTS cash_tender_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS change_amount NUMERIC(10, 2);

COMMENT ON COLUMN zapcomanda.orders.cash_tender_amount IS
  'Valor em dinheiro que o cliente informou que vai pagar na entrega';
COMMENT ON COLUMN zapcomanda.orders.change_amount IS
  'Troco a devolver (cash_tender_amount - total_amount)';
