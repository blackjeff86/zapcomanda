-- Adiciona campo de documento fiscal (CPF ou CNPJ) ao estabelecimento
ALTER TABLE zapcomanda.establishments
  ADD COLUMN IF NOT EXISTS tax_id text;
