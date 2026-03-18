
-- Adicionar flag para indicar que a conversa precisa de atendente humano
-- Usado pelo modo Triagem para notificar atendentes
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN IF NOT EXISTS needs_human BOOLEAN DEFAULT false;

-- Adicionar campo para armazenar o motivo/interesse do cliente
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN IF NOT EXISTS needs_human_reason TEXT;

-- Índice para consultas rápidas de conversas pendentes
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_needs_human 
ON public.whatsapp_conversations (store_id, needs_human) 
WHERE needs_human = true;
