-- Criar tabela de notificações para entregadores
CREATE TABLE IF NOT EXISTS driver_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  store_name TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE driver_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Entregadores podem ver apenas suas próprias notificações
CREATE POLICY "Entregadores podem ver suas notificações"
  ON driver_notifications
  FOR SELECT
  USING (driver_id = auth.uid());

-- Policy: Entregadores podem marcar suas notificações como lidas
CREATE POLICY "Entregadores podem atualizar suas notificações"
  ON driver_notifications
  FOR UPDATE
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

-- Policy: Sistema pode inserir notificações
CREATE POLICY "Sistema pode inserir notificações"
  ON driver_notifications
  FOR INSERT
  WITH CHECK (true);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_driver_notifications_driver_unread 
  ON driver_notifications(driver_id, read_at) 
  WHERE read_at IS NULL;