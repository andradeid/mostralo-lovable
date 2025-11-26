-- Verificar e corrigir políticas RLS para permitir visualização dos perfis de exemplo

-- Adicionar uma política que permite visualização pública dos perfis de exemplo
-- (apenas para demonstração - em produção isso seria mais restritivo)
CREATE POLICY "Allow public read access to demo profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Permitir acesso público aos perfis de exemplo específicos
  id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222', 
    '33333333-3333-3333-3333-333333333333'
  )
);