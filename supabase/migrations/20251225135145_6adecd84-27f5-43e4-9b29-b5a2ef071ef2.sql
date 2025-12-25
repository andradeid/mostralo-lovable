-- Tabela de permissões granulares para atendentes
CREATE TABLE public.attendant_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  permission_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, store_id, permission_key)
);

-- Tabela de preferências de notificações para atendentes
CREATE TABLE public.attendant_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  notification_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, store_id, notification_key)
);

-- Habilitar RLS
ALTER TABLE public.attendant_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendant_notifications ENABLE ROW LEVEL SECURITY;

-- Função para verificar se user é store_admin de uma loja
CREATE OR REPLACE FUNCTION public.is_store_admin_of(_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = _store_id AND owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
      AND store_id = _store_id 
      AND role = 'store_admin'
  )
  OR
  public.has_role(auth.uid(), 'master_admin')
$$;

-- Função para verificar permissão de atendente
CREATE OR REPLACE FUNCTION public.attendant_has_permission(_user_id UUID, _store_id UUID, _permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_enabled FROM public.attendant_permissions 
     WHERE user_id = _user_id AND store_id = _store_id AND permission_key = _permission_key),
    true -- Default: tudo liberado se não há registro
  )
$$;

-- Policies para attendant_permissions

-- Store admin pode gerenciar permissões dos atendentes da sua loja
CREATE POLICY "store_admin_manage_attendant_permissions"
ON public.attendant_permissions
FOR ALL
USING (public.is_store_admin_of(store_id))
WITH CHECK (public.is_store_admin_of(store_id));

-- Atendente pode ver suas próprias permissões
CREATE POLICY "attendant_view_own_permissions"
ON public.attendant_permissions
FOR SELECT
USING (user_id = auth.uid());

-- Policies para attendant_notifications

-- Store admin pode gerenciar notificações dos atendentes
CREATE POLICY "store_admin_manage_attendant_notifications"
ON public.attendant_notifications
FOR ALL
USING (public.is_store_admin_of(store_id))
WITH CHECK (public.is_store_admin_of(store_id));

-- Atendente pode ver/gerenciar suas próprias notificações
CREATE POLICY "attendant_manage_own_notifications"
ON public.attendant_notifications
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_attendant_permissions_updated_at
BEFORE UPDATE ON public.attendant_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE public.attendant_permissions IS 'Permissões granulares de acesso para atendentes';
COMMENT ON TABLE public.attendant_notifications IS 'Preferências de notificação para atendentes';
COMMENT ON COLUMN public.attendant_permissions.permission_key IS 'Chave da permissão: comandas, kds, pedidos_delivery, pedidos_balcao, produtos, clientes, relatorios';
COMMENT ON COLUMN public.attendant_notifications.notification_key IS 'Chave da notificação: novo_pedido, pedido_pronto, mesa_chamou, pedido_cancelado';