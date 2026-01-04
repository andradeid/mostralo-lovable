-- Add auto_send_whatsapp column to external_invoices table
ALTER TABLE public.external_invoices 
ADD COLUMN IF NOT EXISTS auto_send_whatsapp BOOLEAN DEFAULT false;

-- Add auto_send_invoices column to external_clients table
ALTER TABLE public.external_clients 
ADD COLUMN IF NOT EXISTS auto_send_invoices BOOLEAN DEFAULT true;

-- Add index for processing recurring invoices efficiently
CREATE INDEX IF NOT EXISTS idx_external_invoices_recurring_process 
ON public.external_invoices (is_recurring, payment_status, next_due_date) 
WHERE is_recurring = true AND payment_status = 'paid';

-- Comment explaining the columns
COMMENT ON COLUMN public.external_invoices.auto_send_whatsapp IS 'Se true, envia automaticamente WhatsApp quando a fatura recorrente for gerada';
COMMENT ON COLUMN public.external_clients.auto_send_invoices IS 'Se true, cliente recebe faturas automaticamente por WhatsApp';