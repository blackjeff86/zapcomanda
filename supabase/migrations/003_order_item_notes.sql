-- Observações por item do pedido (ex: sem cebola, extra bacon)
ALTER TABLE zapcomanda.order_items
  ADD COLUMN IF NOT EXISTS notes TEXT;
