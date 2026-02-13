
-- Adicionar políticas RLS para atendentes na tabela category_addon_categories
CREATE POLICY "attendant_insert_category_addon_links"
ON public.category_addon_categories
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'attendant'
    AND user_roles.store_id = category_addon_categories.store_id
  )
);

CREATE POLICY "attendant_update_category_addon_links"
ON public.category_addon_categories
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'attendant'
    AND user_roles.store_id = category_addon_categories.store_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'attendant'
    AND user_roles.store_id = category_addon_categories.store_id
  )
);

CREATE POLICY "attendant_delete_category_addon_links"
ON public.category_addon_categories
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'attendant'
    AND user_roles.store_id = category_addon_categories.store_id
  )
);
