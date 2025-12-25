-- Adicionar colunas de preparação em order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS preparation_status TEXT DEFAULT 'pending';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS preparation_started_at TIMESTAMPTZ;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS prepared_at TIMESTAMPTZ;

-- Habilitar realtime para order_items
ALTER TABLE order_items REPLICA IDENTITY FULL;

-- Adicionar order_items à publicação realtime (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
  END IF;
END $$;