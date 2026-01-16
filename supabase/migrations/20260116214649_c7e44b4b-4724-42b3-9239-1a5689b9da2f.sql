-- Adicionar policy de DELETE para admin_menu_preferences
CREATE POLICY "Admins can delete their own menu preferences"
ON public.admin_menu_preferences
FOR DELETE
USING (auth.uid() = admin_id);