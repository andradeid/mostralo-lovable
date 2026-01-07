-- Adicionar coluna marital_status que está faltando na tabela patients
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);