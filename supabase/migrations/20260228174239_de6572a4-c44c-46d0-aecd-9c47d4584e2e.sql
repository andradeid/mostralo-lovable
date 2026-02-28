-- Remover constraint que impede mesma role em lojas diferentes
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Agora inserir as roles faltantes
INSERT INTO user_roles (user_id, role, store_id) VALUES 
('c9e7e489-a297-4b67-8aaa-a9b16efffd6d', 'store_admin', '05bf1934-39b8-440a-8621-640666f60cd4'),
('c9e7e489-a297-4b67-8aaa-a9b16efffd6d', 'store_admin', 'e36e65e7-0a81-48f8-9e1c-998ee37db0a7')
ON CONFLICT (user_id, role, store_id) DO NOTHING;