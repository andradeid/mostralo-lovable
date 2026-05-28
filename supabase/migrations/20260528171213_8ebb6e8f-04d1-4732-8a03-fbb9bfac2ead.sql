-- Adicionar colunas para suporte a novas promoções
ALTER TABLE public.promotions ADD COLUMN bogo_discount_percentage NUMERIC;
ALTER TABLE public.promotions ADD COLUMN include_free_gift BOOLEAN DEFAULT FALSE;
ALTER TABLE public.promotions ADD COLUMN free_gift_products UUID[] DEFAULT '{}';

-- Adicionar 'free_gift' ao enum de tipos de promoção
-- Nota: O Supabase não permite ALTER TYPE ADD VALUE em transações em alguns casos, 
-- mas aqui estamos em uma migração direta.
ALTER TYPE public.promotion_type ADD VALUE IF NOT EXISTS 'free_gift';
