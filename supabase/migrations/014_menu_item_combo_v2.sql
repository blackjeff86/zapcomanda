-- Remove o campo booleano simples e adiciona estrutura de combo completa
ALTER TABLE zapcomanda.menu_items
  DROP COLUMN IF EXISTS is_combo;

ALTER TABLE zapcomanda.menu_items
  ADD COLUMN IF NOT EXISTS combo_partner_id uuid REFERENCES zapcomanda.menu_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS combo_price numeric(10,2);
