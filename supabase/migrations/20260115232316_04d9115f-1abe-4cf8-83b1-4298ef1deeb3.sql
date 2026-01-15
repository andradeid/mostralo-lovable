
-- Corrigir approval_status de todos os profissionais para 'approved'
-- Profissionais são aprovados automaticamente pelo lojista, não precisam de aprovação de assinatura

UPDATE profiles p
SET approval_status = 'approved'
FROM user_roles ur
WHERE ur.user_id = p.id 
  AND ur.role = 'professional'
  AND (p.approval_status != 'approved' OR p.approval_status IS NULL);

-- Garantir que o trigger de criação de profissionais sempre defina approved
-- Criar função para garantir que profissionais sempre tenham approval_status = 'approved'
CREATE OR REPLACE FUNCTION public.ensure_professional_approved()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um profissional é inserido, garantir que o profile está aprovado
  UPDATE profiles
  SET approval_status = 'approved',
      user_type = 'professional'
  WHERE id = NEW.user_id
    AND (approval_status != 'approved' OR user_type != 'professional');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar quando um profissional é criado
DROP TRIGGER IF EXISTS ensure_professional_approved_trigger ON professionals;

CREATE TRIGGER ensure_professional_approved_trigger
  AFTER INSERT ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_professional_approved();
