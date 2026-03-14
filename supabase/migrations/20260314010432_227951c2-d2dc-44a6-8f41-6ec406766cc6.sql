-- Permitir bloqueio permanente de IA na tabela de contatos pausados
ALTER TABLE public.whatsapp_paused_contacts
DROP CONSTRAINT IF EXISTS whatsapp_paused_contacts_status_check;

ALTER TABLE public.whatsapp_paused_contacts
ADD CONSTRAINT whatsapp_paused_contacts_status_check
CHECK (status = ANY (ARRAY['paused'::text, 'reactivated'::text, 'expired'::text, 'permanently_paused'::text]));