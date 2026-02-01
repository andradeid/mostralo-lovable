-- Tabela de logs de uso da OpenAI
CREATE TABLE public.openai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  
  usage_type VARCHAR(20) NOT NULL DEFAULT 'text',
  model VARCHAR(50) NOT NULL,
  estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
  
  message_type VARCHAR(50),
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_openai_usage_store_date ON public.openai_usage_logs(store_id, created_at DESC);
CREATE INDEX idx_openai_usage_type ON public.openai_usage_logs(usage_type);
CREATE INDEX idx_openai_usage_created ON public.openai_usage_logs(created_at DESC);

-- RLS - apenas service role tem acesso
ALTER TABLE public.openai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on openai_usage_logs" 
ON public.openai_usage_logs 
FOR ALL 
USING (true);

-- Inserir módulo AI Vision na tabela modules (usando coluna correta)
INSERT INTO public.modules (key, name, description, suggested_price, is_active)
VALUES (
  'ai_vision',
  'Visão por IA (Plus)',
  'Permite ao assistente interpretar imagens enviadas pelos clientes (fotos de produtos, receitas, embalagens)',
  99.00,
  true
)
ON CONFLICT (key) DO NOTHING;