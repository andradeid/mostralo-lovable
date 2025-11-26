-- ========================================
-- DIAGNÓSTICO COMPLETO: Atendentes
-- ========================================
-- Execute no Supabase SQL Editor

-- 1️⃣ Verificar se existem atendentes criados (profiles com user_type = 'attendant')
SELECT 
  '1️⃣ ATENDENTES NA TABELA PROFILES' as diagnostico,
  p.id,
  p.email,
  p.full_name,
  p.user_type,
  p.created_at
FROM profiles p
WHERE p.user_type = 'attendant'
ORDER BY p.created_at DESC;

-- 2️⃣ Verificar roles de atendentes na user_roles
SELECT 
  '2️⃣ ROLES DE ATENDENTES NA USER_ROLES' as diagnostico,
  ur.id,
  ur.user_id,
  ur.role,
  ur.store_id,
  s.name as store_name,
  p.email as attendant_email,
  p.full_name as attendant_name
FROM user_roles ur
LEFT JOIN stores s ON ur.store_id = s.id
LEFT JOIN profiles p ON ur.user_id = p.id
WHERE ur.role = 'attendant'
ORDER BY ur.created_at DESC;

-- 3️⃣ Verificar a loja do ingabeachsports@gmail.com
SELECT 
  '3️⃣ LOJA DO STORE ADMIN' as diagnostico,
  s.id as store_id,
  s.name as store_name,
  s.owner_id,
  p.email as owner_email,
  p.full_name as owner_name
FROM stores s
INNER JOIN profiles p ON s.owner_id = p.id
WHERE p.email = 'ingabeachsports@gmail.com';

-- 4️⃣ Verificar se o store_admin tem role na user_roles
SELECT 
  '4️⃣ ROLE DO STORE ADMIN' as diagnostico,
  ur.id,
  ur.user_id,
  ur.role,
  ur.store_id,
  s.name as store_name,
  p.email,
  p.full_name
FROM user_roles ur
INNER JOIN profiles p ON ur.user_id = p.id
LEFT JOIN stores s ON ur.store_id = s.id
WHERE p.email = 'ingabeachsports@gmail.com';

-- 5️⃣ Listar TODOS os usuários e suas roles
SELECT 
  '5️⃣ TODOS OS USUÁRIOS E ROLES' as diagnostico,
  p.email,
  p.full_name,
  p.user_type,
  ur.role as user_role,
  s.name as store_name
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN stores s ON ur.store_id = s.id
ORDER BY p.created_at DESC;
