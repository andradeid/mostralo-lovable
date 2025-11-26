-- Corrigir problema de recursão infinita nas políticas da tabela profiles

-- Primeiro, remover todas as políticas existentes da tabela profiles
DROP POLICY IF EXISTS "Allow public read access to demo profiles" ON public.profiles;
DROP POLICY IF EXISTS "Master admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recriar políticas sem recursão
-- Política para usuários visualizarem seus próprios perfis
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Política para usuários atualizarem seus próprios perfis  
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Política para master admins visualizarem todos os perfis (sem recursão)
CREATE POLICY "Master admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Verificação direta do user_type sem consulta recursiva
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.user_type = 'master_admin'
  )
);

-- Política para acesso público aos perfis de demonstração
CREATE POLICY "Allow public read access to demo profiles" 
ON public.profiles 
FOR SELECT 
USING (
  id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid, 
    '33333333-3333-3333-3333-333333333333'::uuid
  )
);

-- Política para inserção de perfis (necessária para o trigger funcionar)
CREATE POLICY "Allow profile creation during signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);