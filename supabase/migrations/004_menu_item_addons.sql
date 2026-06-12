-- Adicionais com preço por item do cardápio
CREATE TABLE zapcomanda.menu_item_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES zapcomanda.menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_item_addons_item ON zapcomanda.menu_item_addons(menu_item_id);

CREATE TRIGGER menu_item_addons_updated_at
  BEFORE UPDATE ON zapcomanda.menu_item_addons
  FOR EACH ROW EXECUTE FUNCTION zapcomanda.set_updated_at();

-- Snapshot dos adicionais no pedido
ALTER TABLE zapcomanda.order_items
  ADD COLUMN IF NOT EXISTS addons JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE zapcomanda.menu_item_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY menu_item_addons_owner ON zapcomanda.menu_item_addons
  FOR ALL USING (
    menu_item_id IN (
      SELECT m.id FROM zapcomanda.menu_items m
      JOIN zapcomanda.establishments e ON e.id = m.establishment_id
      WHERE e.user_id = auth.uid()
    )
  );
