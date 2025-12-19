-- Tabela para histórico de mensagens de teste do Master Admin
CREATE TABLE public.master_test_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT '+55',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  evolution_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.master_test_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Master admin pode gerenciar mensagens de teste
CREATE POLICY "Master admin can manage test messages"
ON public.master_test_messages FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'master_admin'
  )
);

-- Index para ordenação por data
CREATE INDEX idx_master_test_messages_sent_at ON public.master_test_messages(sent_at DESC);