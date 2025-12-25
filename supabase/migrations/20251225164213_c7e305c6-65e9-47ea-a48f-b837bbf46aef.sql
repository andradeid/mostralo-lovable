-- Adicionar suporte a enquetes (poll) e botões (buttons) nas campanhas WhatsApp

-- Adicionar colunas de tipo de interação e campos relacionados
ALTER TABLE public.whatsapp_campaigns
ADD COLUMN IF NOT EXISTS interaction_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS button_1_text TEXT,
ADD COLUMN IF NOT EXISTS button_1_url TEXT,
ADD COLUMN IF NOT EXISTS button_2_text TEXT,
ADD COLUMN IF NOT EXISTS button_2_url TEXT,
ADD COLUMN IF NOT EXISTS button_3_text TEXT,
ADD COLUMN IF NOT EXISTS button_3_url TEXT,
ADD COLUMN IF NOT EXISTS poll_question TEXT,
ADD COLUMN IF NOT EXISTS poll_options TEXT[],
ADD COLUMN IF NOT EXISTS poll_selectable_count INTEGER DEFAULT 1;

-- Adicionar colunas também na tabela de mensagens para registro
ALTER TABLE public.whatsapp_messages
ADD COLUMN IF NOT EXISTS interaction_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS poll_question TEXT,
ADD COLUMN IF NOT EXISTS poll_options TEXT[],
ADD COLUMN IF NOT EXISTS poll_selectable_count INTEGER,
ADD COLUMN IF NOT EXISTS buttons JSONB;

-- Comentários para documentação
COMMENT ON COLUMN public.whatsapp_campaigns.interaction_type IS 'Tipo de interação: text, poll, buttons';
COMMENT ON COLUMN public.whatsapp_campaigns.poll_question IS 'Pergunta da enquete';
COMMENT ON COLUMN public.whatsapp_campaigns.poll_options IS 'Opções da enquete (array de strings)';
COMMENT ON COLUMN public.whatsapp_campaigns.poll_selectable_count IS 'Quantas opções podem ser selecionadas na enquete';
COMMENT ON COLUMN public.whatsapp_campaigns.button_1_text IS 'Texto do botão 1';
COMMENT ON COLUMN public.whatsapp_campaigns.button_1_url IS 'URL do botão 1';
COMMENT ON COLUMN public.whatsapp_messages.interaction_type IS 'Tipo de interação da mensagem';