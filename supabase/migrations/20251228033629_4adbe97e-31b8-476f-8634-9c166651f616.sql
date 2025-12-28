-- Habilitar módulo de Agendamento (booking) para Stark Pizzaria
INSERT INTO store_modules (store_id, module_id, is_enabled)
VALUES (
  '79fedd36-6e19-42d6-b331-79f9ad777180',  -- Stark Pizzaria
  '75e1167b-7c3c-45ce-9ad2-6fbced82086f',  -- Módulo Booking
  true
)
ON CONFLICT (store_id, module_id) DO UPDATE SET is_enabled = true;