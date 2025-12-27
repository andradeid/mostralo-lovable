-- Criar função para verificar se cliente pode acessar sua própria comanda de mesa
CREATE OR REPLACE FUNCTION public.can_customer_access_comanda(_comanda_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.comandas c
    JOIN public.customers cu ON cu.id = c.customer_id
    WHERE c.id = _comanda_id
      AND c.type = 'mesa'
      AND c.status = 'open'
      AND cu.auth_user_id = auth.uid()
      AND cu.deleted_at IS NULL
  );
$$;

-- Policies para clientes da mesa adicionarem/verem seus próprios itens
DROP POLICY IF EXISTS "comanda_items_customer_insert_policy" ON public.comanda_items;
DROP POLICY IF EXISTS "comanda_items_customer_select_policy" ON public.comanda_items;

CREATE POLICY "comanda_items_customer_insert_policy"
ON public.comanda_items
FOR INSERT
TO authenticated
WITH CHECK (public.can_customer_access_comanda(comanda_id));

CREATE POLICY "comanda_items_customer_select_policy"
ON public.comanda_items
FOR SELECT
TO authenticated
USING (public.can_customer_access_comanda(comanda_id));