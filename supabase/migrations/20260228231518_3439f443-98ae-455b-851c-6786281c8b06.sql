
-- Adicionar colunas de upsell na tabela de configurações conversacionais
ALTER TABLE public.store_bot_conversational_settings
ADD COLUMN IF NOT EXISTS upsell_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS upsell_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS upsell_custom_price numeric,
ADD COLUMN IF NOT EXISTS upsell_message text NOT NULL DEFAULT 'Estamos com uma promoção especial! Quer aproveitar e levar também?';
