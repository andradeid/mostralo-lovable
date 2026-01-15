-- Adicionar 'professional' ao enum user_type
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'professional';

-- Corrigir a role do usuário hulkpro@email.com para 'professional'
UPDATE public.user_roles 
SET role = 'professional' 
WHERE user_id = '29f590b9-a619-446e-b0e3-d4974db023b0';