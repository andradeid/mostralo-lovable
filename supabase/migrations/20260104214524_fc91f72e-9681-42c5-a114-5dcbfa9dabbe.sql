-- Create table to log recurring invoice processing executions
CREATE TABLE public.recurring_invoice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_processed INTEGER NOT NULL DEFAULT 0,
  invoices_created INTEGER NOT NULL DEFAULT 0,
  whatsapp_sent INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  execution_details JSONB,
  execution_source TEXT NOT NULL DEFAULT 'cron',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster queries by date
CREATE INDEX idx_recurring_invoice_logs_executed_at ON public.recurring_invoice_logs(executed_at DESC);

-- Enable RLS
ALTER TABLE public.recurring_invoice_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view logs
CREATE POLICY "Admins can view recurring invoice logs"
  ON public.recurring_invoice_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'master_admin'
    )
  );

-- Create policy for service role to insert logs (edge functions use service role)
CREATE POLICY "Service role can insert logs"
  ON public.recurring_invoice_logs
  FOR INSERT
  WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE public.recurring_invoice_logs IS 'Logs de execução do processamento de faturas recorrentes (CRON e manual)';