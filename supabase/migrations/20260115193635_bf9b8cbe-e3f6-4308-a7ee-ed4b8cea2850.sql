
-- Corrigir usuário aranhapro@email.com
-- 1. Deletar a role store_admin incorreta (sem store_id)
DELETE FROM public.user_roles 
WHERE id = 'a9cf73fe-4181-4631-90a0-be7ec4cfb6d1';

-- 2. Inserir a role professional correta com a loja Stark Pizzaria
INSERT INTO public.user_roles (user_id, role, store_id)
VALUES (
  '45335aec-2d5b-43af-b935-94969c718bbb', 
  'professional', 
  '79fedd36-6e19-42d6-b331-79f9ad777180'
);
