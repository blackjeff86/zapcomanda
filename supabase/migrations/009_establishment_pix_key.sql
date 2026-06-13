-- Chave Pix do estabelecimento para receber pedidos
ALTER TABLE zapcomanda.establishments
  ADD COLUMN IF NOT EXISTS pix_key_type TEXT,
  ADD COLUMN IF NOT EXISTS pix_key TEXT;

COMMENT ON COLUMN zapcomanda.establishments.pix_key_type IS
  'cpf, cnpj, email, phone ou random';

COMMENT ON COLUMN zapcomanda.establishments.pix_key IS
  'Chave Pix onde o estabelecimento recebe pagamentos de pedidos';
