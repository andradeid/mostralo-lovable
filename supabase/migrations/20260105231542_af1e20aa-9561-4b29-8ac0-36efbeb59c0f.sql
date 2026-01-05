-- Adicionar novas colunas em booking_settings para configurações de avaliação
ALTER TABLE public.booking_settings
ADD COLUMN IF NOT EXISTS review_message_template TEXT 
  DEFAULT 'Olá {cliente}! Como foi seu atendimento com {profissional}? Avalie em: {link}',
ADD COLUMN IF NOT EXISTS review_delay_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS review_expiry_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS show_public_reviews BOOLEAN DEFAULT true;

-- Adicionar coluna review_sent em bookings para controle de envio
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS review_sent BOOLEAN DEFAULT false;

-- Comentários para documentação
COMMENT ON COLUMN public.booking_settings.review_message_template IS 'Template da mensagem de solicitação de avaliação';
COMMENT ON COLUMN public.booking_settings.review_delay_minutes IS 'Minutos de espera após marcar como concluído para enviar solicitação de avaliação';
COMMENT ON COLUMN public.booking_settings.review_expiry_days IS 'Dias até o link de avaliação expirar';
COMMENT ON COLUMN public.booking_settings.show_public_reviews IS 'Exibir avaliações públicas no cartão digital do profissional';
COMMENT ON COLUMN public.bookings.review_sent IS 'Indica se a solicitação de avaliação foi enviada';