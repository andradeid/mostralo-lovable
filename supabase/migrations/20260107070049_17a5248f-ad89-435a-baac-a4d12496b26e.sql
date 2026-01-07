-- Adicionar coluna proposal_id na tabela payment_approvals
ALTER TABLE payment_approvals 
ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES commercial_proposals(id) ON DELETE SET NULL;

-- Criar tabela para configurações da empresa (dados da contratada)
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Master admins can read company_settings"
  ON company_settings FOR SELECT
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admins can insert company_settings"
  ON company_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admins can update company_settings"
  ON company_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'master_admin'));

-- Política pública para leitura dos dados da contratada (necessário para contratos)
CREATE POLICY "Anyone can read contractor_info"
  ON company_settings FOR SELECT
  USING (key = 'contractor_info');

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_settings_updated_at();

-- Inserir dados iniciais da MOSTRALO
INSERT INTO company_settings (key, value) VALUES 
('contractor_info', '{
  "company_name": "MOSTRALO TECNOLOGIA LTDA",
  "cnpj": "51.691.995/0001-15",
  "address": "SGCV LOTE 11, 121",
  "city": "BRASILIA",
  "state": "DF",
  "cep": "70714-900",
  "full_address": "SGCV LOTE 11, 121, BRASILIA - DF, CEP 70714-900"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;