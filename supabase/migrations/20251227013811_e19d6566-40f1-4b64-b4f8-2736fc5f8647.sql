-- Adicionar campo whatsapp_valid na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_valid boolean DEFAULT false;