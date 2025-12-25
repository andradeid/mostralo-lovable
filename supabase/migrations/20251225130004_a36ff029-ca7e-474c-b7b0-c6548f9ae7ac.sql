-- Adicionar campos de status de preparo na tabela comanda_items
ALTER TABLE public.comanda_items 
ADD COLUMN IF NOT EXISTS preparation_status TEXT DEFAULT 'pending' CHECK (preparation_status IN ('pending', 'preparing', 'ready')),
ADD COLUMN IF NOT EXISTS prepared_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS preparation_started_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para consultas de status
CREATE INDEX IF NOT EXISTS idx_comanda_items_preparation_status ON public.comanda_items(preparation_status);

-- Habilitar Realtime para comanda_items
ALTER TABLE public.comanda_items REPLICA IDENTITY FULL;

-- Adicionar tabela ao supabase_realtime publication se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'comanda_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comanda_items;
  END IF;
END $$;