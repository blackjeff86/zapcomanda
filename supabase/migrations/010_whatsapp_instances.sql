-- Migration 010: Suporte a múltiplas instâncias WhatsApp (plano Pro)
-- Cria tabela whatsapp_instances para suportar até 2 números por estabelecimento.
-- O campo whatsapp_instance_id em establishments continua como instância primária
-- para retrocompatibilidade com o webhook handler existente.

CREATE TABLE IF NOT EXISTS zapcomanda.whatsapp_instances (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES zapcomanda.establishments(id) ON DELETE CASCADE,
  instance_id  text NOT NULL,
  label        text NOT NULL DEFAULT 'Número 2',
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_instance_per_establishment UNIQUE (establishment_id, instance_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_establishment
  ON zapcomanda.whatsapp_instances (establishment_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_id
  ON zapcomanda.whatsapp_instances (instance_id);

-- RLS: só o dono do estabelecimento pode gerenciar suas instâncias
ALTER TABLE zapcomanda.whatsapp_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_manage_instances"
  ON zapcomanda.whatsapp_instances
  FOR ALL
  USING (
    establishment_id IN (
      SELECT id FROM zapcomanda.establishments WHERE user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION zapcomanda.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER whatsapp_instances_updated_at
  BEFORE UPDATE ON zapcomanda.whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION zapcomanda.set_updated_at();
