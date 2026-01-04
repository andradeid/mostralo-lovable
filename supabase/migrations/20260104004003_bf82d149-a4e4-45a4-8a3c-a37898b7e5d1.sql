-- Adicionar coluna para habilitar/desabilitar avaliações de profissionais
ALTER TABLE booking_settings 
ADD COLUMN IF NOT EXISTS enable_professional_reviews boolean DEFAULT false;

COMMENT ON COLUMN booking_settings.enable_professional_reviews IS 
  'Habilita o sistema de avaliações de profissionais após o atendimento';