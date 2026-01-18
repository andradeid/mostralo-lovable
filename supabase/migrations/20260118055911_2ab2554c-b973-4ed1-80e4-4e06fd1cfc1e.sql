-- Adicionar política para master_admin gerenciar todos os templates de WhatsApp (globais e de lojas)
CREATE POLICY "Master admin can manage all templates"
ON whatsapp_templates
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'master_admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'master_admin')
);