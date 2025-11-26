-- Fase 1: Criar tabela de convites de entregadores
CREATE TABLE IF NOT EXISTS public.driver_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(store_id, driver_id)
);

-- Adicionar campo para indicar que entregador está disponível para convites
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS driver_available_for_invites BOOLEAN DEFAULT false;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_driver_invitations_token ON driver_invitations(token);
CREATE INDEX IF NOT EXISTS idx_driver_invitations_driver_id ON driver_invitations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_invitations_store_id ON driver_invitations(store_id);
CREATE INDEX IF NOT EXISTS idx_driver_invitations_status ON driver_invitations(status);
CREATE INDEX IF NOT EXISTS idx_profiles_driver_available ON profiles(driver_available_for_invites) WHERE driver_available_for_invites = true;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_driver_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_driver_invitations_updated_at
BEFORE UPDATE ON driver_invitations
FOR EACH ROW
EXECUTE FUNCTION update_driver_invitations_updated_at();

-- RLS Policies
ALTER TABLE public.driver_invitations ENABLE ROW LEVEL SECURITY;

-- Lojistas podem ver e gerenciar convites da sua loja
CREATE POLICY "Store owners can manage their invitations"
ON driver_invitations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = driver_invitations.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Entregadores podem ver convites enviados para eles
CREATE POLICY "Drivers can view their invitations"
ON driver_invitations
FOR SELECT
USING (driver_id = auth.uid());

-- Entregadores podem atualizar status dos seus convites
CREATE POLICY "Drivers can update their invitation status"
ON driver_invitations
FOR UPDATE
USING (driver_id = auth.uid())
WITH CHECK (driver_id = auth.uid());

-- Master admins podem ver todos os convites
CREATE POLICY "Master admins can view all invitations"
ON driver_invitations
FOR SELECT
USING (has_role(auth.uid(), 'master_admin'));

-- Comentários para documentação
COMMENT ON TABLE driver_invitations IS 'Gerencia convites de lojas para entregadores';
COMMENT ON COLUMN profiles.driver_available_for_invites IS 'Indica se o entregador está disponível para receber convites de lojas';