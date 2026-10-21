-- Aviso de cancelamento de agendamento: editável pelo lojista e registrado no histórico
ALTER TABLE public.booking_settings
  ADD COLUMN IF NOT EXISTS send_cancellation_message boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cancellation_message_template text;

ALTER TABLE public.booking_notification_logs
  DROP CONSTRAINT IF EXISTS booking_notification_logs_notification_type_check;
ALTER TABLE public.booking_notification_logs
  ADD CONSTRAINT booking_notification_logs_notification_type_check
  CHECK (notification_type IN ('confirmation', 'reminder', 'review', 'cancellation'));
