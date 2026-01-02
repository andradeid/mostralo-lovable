-- Tabela para analytics do popup de diagnóstico com teste A/B
CREATE TABLE popup_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Dados do popup
  variation VARCHAR(10) NOT NULL,
  action VARCHAR(20) NOT NULL,
  session_id VARCHAR(100) NOT NULL,
  
  -- UTM Parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Contexto adicional
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type VARCHAR(20),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX idx_popup_variation ON popup_analytics(variation);
CREATE INDEX idx_popup_action ON popup_analytics(action);
CREATE INDEX idx_popup_created_at ON popup_analytics(created_at);
CREATE INDEX idx_popup_utm_source ON popup_analytics(utm_source);
CREATE INDEX idx_popup_utm_campaign ON popup_analytics(utm_campaign);
CREATE INDEX idx_popup_device_type ON popup_analytics(device_type);

-- RLS: Visitantes podem inserir, admins podem ler
ALTER TABLE popup_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON popup_analytics 
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated inserts" ON popup_analytics 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated reads" ON popup_analytics 
  FOR SELECT TO authenticated USING (true);