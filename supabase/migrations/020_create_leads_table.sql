CREATE TABLE IF NOT EXISTS zapcomanda.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  local_endereco text,
  avaliacao text,
  canal_origem text NOT NULL DEFAULT 'Google Maps',
  status text NOT NULL DEFAULT 'novo',
  tipo_contato text,
  tem_interesse boolean,
  contatado_em timestamptz,
  respondeu boolean,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE zapcomanda.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_auth_all" ON zapcomanda.leads
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
