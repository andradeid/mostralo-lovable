
-- Tabela de histórico de resets mensais de afiliados
CREATE TABLE affiliate_earnings_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  affiliates_count INTEGER NOT NULL DEFAULT 0,
  total_reset_amount NUMERIC NOT NULL DEFAULT 0,
  reset_details JSONB DEFAULT '[]'::jsonb,
  executed_by TEXT DEFAULT 'system',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna de controle na tabela salespeople
ALTER TABLE salespeople 
ADD COLUMN IF NOT EXISTS last_earnings_reset_at TIMESTAMPTZ;

-- RLS para affiliate_earnings_resets
ALTER TABLE affiliate_earnings_resets ENABLE ROW LEVEL SECURITY;

-- Master admins podem ver e gerenciar
CREATE POLICY "Master admins can manage affiliate earnings resets"
ON affiliate_earnings_resets
FOR ALL
USING (has_role(auth.uid(), 'master_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'master_admin'::app_role));

-- Índice para consultas por data
CREATE INDEX idx_affiliate_earnings_resets_reset_at ON affiliate_earnings_resets(reset_at DESC);
