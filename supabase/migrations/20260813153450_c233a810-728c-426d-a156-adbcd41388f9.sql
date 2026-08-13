ALTER TABLE public.booking_settings
ADD COLUMN IF NOT EXISTS reschedule_message_template TEXT
DEFAULT '🔄 *Horário atualizado!*

Olá *{cliente}*, seu agendamento anterior foi cancelado automaticamente e agora vale apenas o novo horário abaixo. 👇';

COMMENT ON COLUMN public.booking_settings.reschedule_message_template IS 'Aviso exibido no topo da mensagem de confirmação quando o agendamento é um reagendamento';