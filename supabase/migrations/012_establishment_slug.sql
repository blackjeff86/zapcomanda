-- Adiciona slug único por estabelecimento (usado na URL do cardápio digital)
ALTER TABLE zapcomanda.establishments
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Gera slug para estabelecimentos existentes a partir do nome
UPDATE zapcomanda.establishments
SET slug = lower(regexp_replace(
  regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g'),
  '\s+', '-', 'g'
))
WHERE slug IS NULL;

-- Garante slug único — resolve colisões adicionando sufixo numérico
DO $$
DECLARE
  r RECORD;
  base TEXT;
  candidate TEXT;
  counter INT;
BEGIN
  FOR r IN SELECT id, slug FROM zapcomanda.establishments ORDER BY created_at LOOP
    base := r.slug;
    candidate := base;
    counter := 1;
    WHILE EXISTS (
      SELECT 1 FROM zapcomanda.establishments
      WHERE slug = candidate AND id <> r.id
    ) LOOP
      candidate := base || '-' || counter;
      counter := counter + 1;
    END LOOP;
    IF candidate <> r.slug THEN
      UPDATE zapcomanda.establishments SET slug = candidate WHERE id = r.id;
    END IF;
  END LOOP;
END;
$$;

ALTER TABLE zapcomanda.establishments
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS establishments_slug_unique
  ON zapcomanda.establishments (slug);
