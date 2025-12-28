
-- Registrar módulo "booking" na tabela modules (sem display_order e route que não existem)
INSERT INTO public.modules (key, name, description, icon, is_active)
VALUES (
  'booking',
  'Agendamento',
  'Sistema de agendamento de serviços com gestão de profissionais, horários e automações',
  'Calendar',
  true
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active;
