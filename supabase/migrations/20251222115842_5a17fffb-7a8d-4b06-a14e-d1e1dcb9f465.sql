-- Adicionar campos de texto personalizado na tabela password_call_config
ALTER TABLE public.password_call_config
ADD COLUMN IF NOT EXISTS custom_text_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_text_template text DEFAULT 'Atenção! {tipo} {numero} está pronto!',
ADD COLUMN IF NOT EXISTS custom_prefix text,
ADD COLUMN IF NOT EXISTS custom_suffix text,
ADD COLUMN IF NOT EXISTS use_greeting boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS store_name_in_call text;