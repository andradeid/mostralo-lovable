
ALTER TABLE public.booking_settings
  ADD COLUMN IF NOT EXISTS send_pix_payment boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pix_key text DEFAULT '',
  ADD COLUMN IF NOT EXISTS pix_key_type text DEFAULT 'random',
  ADD COLUMN IF NOT EXISTS pix_recipient_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS pix_payment_message text DEFAULT 'Pagamento referente ao agendamento de {servico} com {profissional} em {data} às {horario}.';
