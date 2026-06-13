-- Campos da vitrine do cardápio público
ALTER TABLE zapcomanda.establishments
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS wait_time_text TEXT,
  ADD COLUMN IF NOT EXISTS is_manually_closed BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN zapcomanda.establishments.cover_url IS
  'Imagem de capa do cardápio digital (banner).';

COMMENT ON COLUMN zapcomanda.establishments.tagline IS
  'Frase curta exibida abaixo do nome no cardápio (ex.: slogan).';

COMMENT ON COLUMN zapcomanda.establishments.wait_time_text IS
  'Texto de tempo de espera no cardápio (ex.: 30-40 min).';

COMMENT ON COLUMN zapcomanda.establishments.is_manually_closed IS
  'Quando true, cardápio exibe status FECHADO.';
