
CREATE TABLE public.whatsapp_conversation_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL UNIQUE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  remote_jid TEXT NOT NULL,
  phone_number TEXT,
  contact_name TEXT,
  houve_intencao_compra BOOLEAN DEFAULT false,
  houve_fechamento BOOLEAN DEFAULT false,
  valor_estimado NUMERIC DEFAULT 0,
  canal_fechamento TEXT DEFAULT 'indefinido',
  atendimento_predominante TEXT DEFAULT 'ia',
  precisou_humano BOOLEAN DEFAULT false,
  motivo_sem_fechamento TEXT,
  resumo_comercial TEXT,
  confidence_score INTEGER DEFAULT 0,
  confidence_reason TEXT,
  analysis_status TEXT NOT NULL DEFAULT 'pending',
  analysis_error TEXT,
  retry_count INTEGER DEFAULT 0,
  prompt_version TEXT DEFAULT 'v1',
  model_used TEXT,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_messages_analyzed INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wca_store_id ON public.whatsapp_conversation_analysis(store_id);
CREATE INDEX idx_wca_status ON public.whatsapp_conversation_analysis(analysis_status);
CREATE INDEX idx_wca_intencao ON public.whatsapp_conversation_analysis(houve_intencao_compra);
CREATE INDEX idx_wca_fechamento ON public.whatsapp_conversation_analysis(houve_fechamento);
CREATE INDEX idx_wca_last_message ON public.whatsapp_conversation_analysis(last_message_at DESC);

ALTER TABLE public.whatsapp_conversation_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view analyses"
  ON public.whatsapp_conversation_analysis FOR SELECT
  USING (
    public.is_store_owner_direct(store_id, auth.uid())
    OR public.has_role(auth.uid(), 'master_admin')
    OR store_id IN (SELECT public.get_user_store_ids_direct(auth.uid()))
  );

CREATE POLICY "Service role can manage analyses"
  ON public.whatsapp_conversation_analysis FOR ALL
  USING (true)
  WITH CHECK (true);
