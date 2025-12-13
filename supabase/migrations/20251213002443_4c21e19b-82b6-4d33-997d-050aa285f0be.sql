-- Adicionar coluna coupon_id para rastrear cupons usados no cadastro
ALTER TABLE public.payment_approvals 
ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES public.coupons(id),
ADD COLUMN IF NOT EXISTS coupon_discount numeric DEFAULT 0;