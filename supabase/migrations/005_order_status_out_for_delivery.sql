-- Novo status: pedido saiu para entrega (entre em preparo e entregue)
ALTER TYPE zapcomanda.order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';
