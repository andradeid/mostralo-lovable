-- Adicionar novos valores ao enum whatsapp_message_type
ALTER TYPE public.whatsapp_message_type ADD VALUE IF NOT EXISTS 'poll';
ALTER TYPE public.whatsapp_message_type ADD VALUE IF NOT EXISTS 'list';

-- Adicionar campos para enquete (poll) na tabela whatsapp_templates
ALTER TABLE public.whatsapp_templates 
ADD COLUMN IF NOT EXISTS poll_question TEXT,
ADD COLUMN IF NOT EXISTS poll_options JSONB,
ADD COLUMN IF NOT EXISTS poll_selectable_count INTEGER DEFAULT 1;

-- Adicionar campos para lista (list) na tabela whatsapp_templates
ALTER TABLE public.whatsapp_templates 
ADD COLUMN IF NOT EXISTS list_title TEXT,
ADD COLUMN IF NOT EXISTS list_button_text TEXT,
ADD COLUMN IF NOT EXISTS list_sections JSONB;

-- Comentários para documentação
COMMENT ON COLUMN public.whatsapp_templates.poll_question IS 'Pergunta da enquete';
COMMENT ON COLUMN public.whatsapp_templates.poll_options IS 'Opções da enquete em JSON array';
COMMENT ON COLUMN public.whatsapp_templates.poll_selectable_count IS 'Número de opções selecionáveis';
COMMENT ON COLUMN public.whatsapp_templates.list_title IS 'Título principal da lista';
COMMENT ON COLUMN public.whatsapp_templates.list_button_text IS 'Texto do botão para abrir a lista';
COMMENT ON COLUMN public.whatsapp_templates.list_sections IS 'Seções da lista com itens em JSON';