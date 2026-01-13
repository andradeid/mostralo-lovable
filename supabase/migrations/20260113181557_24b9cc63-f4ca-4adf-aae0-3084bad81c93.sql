INSERT INTO public.modules (
  name,
  key,
  description,
  icon,
  is_active,
  suggested_price,
  price_reference,
  dependencies
)
VALUES (
  'Google Calendar',
  'google_calendar',
  'Sincronização automática de agendamentos com o Google Agenda dos profissionais. Eventos criados, atualizados e removidos em tempo real.',
  'Calendar',
  true,
  29.90,
  'Calendly R$ 40-80/mês, Cal.com R$ 15-30/mês',
  '["booking"]'
);