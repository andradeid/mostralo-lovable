-- Tabela para configurações de chamada de senha por loja
CREATE TABLE public.password_call_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  call_type TEXT NOT NULL DEFAULT 'password' CHECK (call_type IN ('password', 'order', 'table')),
  template TEXT NOT NULL DEFAULT 'classic' CHECK (template IN ('classic', 'modern', 'minimalist', 'festive', 'corporate')),
  show_history BOOLEAN NOT NULL DEFAULT true,
  history_count INTEGER NOT NULL DEFAULT 7 CHECK (history_count >= 1 AND history_count <= 10),
  highlight_duration_ms INTEGER NOT NULL DEFAULT 5000,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  primary_color TEXT DEFAULT '#f97316',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

-- Tabela para chamadas de senha (efêmera)
CREATE TABLE public.password_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  call_number TEXT NOT NULL,
  call_type TEXT NOT NULL DEFAULT 'password' CHECK (call_type IN ('password', 'order', 'table')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para buscar chamadas recentes por loja
CREATE INDEX idx_password_calls_store_created ON public.password_calls(store_id, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.password_call_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_calls ENABLE ROW LEVEL SECURITY;

-- Policies para password_call_config
CREATE POLICY "Store owners can manage their password call config"
ON public.password_call_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = store_id AND s.owner_id = auth.uid()
  )
);

-- Policies para password_calls (insert/delete para owners)
CREATE POLICY "Store owners can manage password calls"
ON public.password_calls
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = store_id AND s.owner_id = auth.uid()
  )
);

-- Policy para leitura pública das chamadas (para o painel público)
CREATE POLICY "Anyone can view password calls"
ON public.password_calls
FOR SELECT
USING (true);

-- Policy para leitura pública das configurações (para o painel público)
CREATE POLICY "Anyone can view password call config"
ON public.password_call_config
FOR SELECT
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_password_call_config_updated_at
BEFORE UPDATE ON public.password_call_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Realtime para password_calls
ALTER TABLE public.password_calls REPLICA IDENTITY FULL;

-- Adicionar à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.password_calls;