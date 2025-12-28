-- Registrar módulo booking (estrutura correta)
INSERT INTO public.modules (key, name, description, icon, is_active)
VALUES (
  'booking',
  'Agendamento de Serviços',
  'Sistema completo de agendamento para barbearias, clínicas, pet shops e estúdios. Inclui calendário profissional, gestão de horários, lembretes automáticos via WhatsApp e integração com comandas.',
  'Calendar',
  true
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;