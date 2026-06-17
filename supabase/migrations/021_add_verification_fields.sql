ALTER TABLE zapcomanda.leads
  ADD COLUMN IF NOT EXISTS place_id       text,
  ADD COLUMN IF NOT EXISTS status_google  text,
  ADD COLUMN IF NOT EXISTS website_url    text,
  ADD COLUMN IF NOT EXISTS instagram_url  text,
  ADD COLUMN IF NOT EXISTS verificado_em  timestamptz;
