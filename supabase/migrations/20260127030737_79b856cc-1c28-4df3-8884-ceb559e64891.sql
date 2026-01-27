-- Tabela para armazenar configurações da API de busca de imagens
CREATE TABLE public.image_search_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'google',
  api_key text NOT NULL,
  search_engine_id text,
  is_active boolean DEFAULT true,
  daily_limit integer DEFAULT 100,
  searches_today integer DEFAULT 0,
  last_reset_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Apenas uma configuração deve existir
CREATE UNIQUE INDEX image_search_config_singleton ON public.image_search_config ((true));

-- Habilitar RLS
ALTER TABLE public.image_search_config ENABLE ROW LEVEL SECURITY;

-- Política: apenas master_admin pode ler/escrever
CREATE POLICY "master_admin_full_access" ON public.image_search_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'master_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'master_admin'
    )
  );

-- Função para resetar contador diário
CREATE OR REPLACE FUNCTION public.reset_image_search_daily_counter()
RETURNS trigger AS $$
BEGIN
  -- Se a data mudou, resetar contador
  IF NEW.last_reset_date < CURRENT_DATE THEN
    NEW.searches_today := 0;
    NEW.last_reset_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para resetar contador automaticamente
CREATE TRIGGER reset_daily_counter_trigger
  BEFORE UPDATE ON public.image_search_config
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_image_search_daily_counter();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_image_search_config_updated_at
  BEFORE UPDATE ON public.image_search_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();