-- Adicionar coluna booking_enabled à tabela store_sales_channels
ALTER TABLE public.store_sales_channels 
ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT true;

-- Comentário explicativo
COMMENT ON COLUMN public.store_sales_channels.booking_enabled IS 'Controla se o agendamento online está ativo para a loja';