-- Inserir módulo "Integrações" na tabela modules
INSERT INTO public.modules (name, description, icon, key, is_active)
VALUES (
  'Integrações',
  'Gerenciar integrações e menus customizados via iframe',
  'ExternalLink',
  'integrations',
  true
);