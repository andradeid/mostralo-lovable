-- Corrigir email e foto em todas as tabelas do vendedor

-- 1. Atualizar profiles com email correto e avatar_url
UPDATE profiles
SET 
  email = 'solucoesobjetiva@gmail.com',
  avatar_url = 'https://noshwvwpjtnvndokbfjx.supabase.co/storage/v1/object/public/salesperson-photos/salesperson-photos/e70a2a1e-e5fa-43d4-981b-f68fd197719c-1770231033087.jpg',
  updated_at = now()
WHERE id = '4e3f56ba-d976-43d5-b45a-daeccc31395e';

-- 2. Atualizar salespeople com email correto
UPDATE salespeople
SET 
  email = 'solucoesobjetiva@gmail.com',
  updated_at = now()
WHERE user_id = '4e3f56ba-d976-43d5-b45a-daeccc31395e';