-- Adicionar colunas de configuração de comportamento para cada tipo de bot

-- Bot de Vendas
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS sales_bot_delay_message INTEGER DEFAULT 1500;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS sales_bot_expire_minutes INTEGER DEFAULT 60;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS sales_bot_keyword_finish TEXT DEFAULT '#sair';
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS sales_bot_stop_from_me BOOLEAN DEFAULT true;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS sales_bot_listening_from_me BOOLEAN DEFAULT false;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS sales_bot_keep_open BOOLEAN DEFAULT false;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS sales_bot_debounce_time INTEGER DEFAULT 3;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS sales_bot_split_messages BOOLEAN DEFAULT true;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS sales_bot_time_per_char INTEGER DEFAULT 50;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS sales_bot_unknown_message TEXT DEFAULT 'Desculpe, não entendi. Pode reformular?';

-- Bot de Recrutamento
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS recruitment_bot_delay_message INTEGER DEFAULT 1500;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS recruitment_bot_expire_minutes INTEGER DEFAULT 60;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS recruitment_bot_keyword_finish TEXT DEFAULT '#sair';
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS recruitment_bot_stop_from_me BOOLEAN DEFAULT true;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS recruitment_bot_listening_from_me BOOLEAN DEFAULT false;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS recruitment_bot_keep_open BOOLEAN DEFAULT false;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS recruitment_bot_debounce_time INTEGER DEFAULT 3;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS recruitment_bot_split_messages BOOLEAN DEFAULT true;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS recruitment_bot_time_per_char INTEGER DEFAULT 50;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS recruitment_bot_unknown_message TEXT DEFAULT 'Desculpe, não entendi. Pode reformular?';

-- Bot de Suporte
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS support_bot_delay_message INTEGER DEFAULT 1500;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS support_bot_expire_minutes INTEGER DEFAULT 60;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS support_bot_keyword_finish TEXT DEFAULT '#sair';
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS support_bot_stop_from_me BOOLEAN DEFAULT true;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS support_bot_listening_from_me BOOLEAN DEFAULT false;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS support_bot_keep_open BOOLEAN DEFAULT false;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS support_bot_debounce_time INTEGER DEFAULT 3;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS support_bot_split_messages BOOLEAN DEFAULT true;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS support_bot_time_per_char INTEGER DEFAULT 50;
ALTER TABLE public.master_whatsapp_config ADD COLUMN IF NOT EXISTS support_bot_unknown_message TEXT DEFAULT 'Desculpe, não entendi. Pode reformular?';