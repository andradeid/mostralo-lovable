-- Tabela principal de cartões digitais
CREATE TABLE public.digital_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Proprietário (vendedor ou admin)
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_type TEXT NOT NULL DEFAULT 'salesperson' CHECK (owner_type IN ('salesperson', 'admin')),
  
  -- URL única do cartão
  slug TEXT UNIQUE NOT NULL,
  
  -- Informações do cartão
  photo_url TEXT,
  name TEXT NOT NULL,
  title TEXT,
  company TEXT DEFAULT 'MOSTRALO',
  headline TEXT,
  bio TEXT,
  
  -- Contatos
  whatsapp TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- Redes sociais
  instagram TEXT,
  linkedin TEXT,
  facebook TEXT,
  tiktok TEXT,
  youtube TEXT,
  
  -- CTA Principal
  cta_text TEXT DEFAULT 'Fale Comigo',
  cta_url TEXT,
  
  -- Links extras (botões customizados)
  custom_links JSONB DEFAULT '[]'::jsonb,
  
  -- Estatística destacada
  stats_text TEXT,
  
  -- Tema/Aparência
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'orange', 'gradient')),
  accent_color TEXT DEFAULT '#f97316',
  show_qr_code BOOLEAN DEFAULT true,
  show_mostralo_badge BOOLEAN DEFAULT true,
  
  -- Referência (código do vendedor)
  referral_code TEXT,
  
  -- Estatísticas
  views_count INTEGER DEFAULT 0,
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de rastreamento de cliques
CREATE TABLE public.digital_card_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.digital_cards(id) ON DELETE CASCADE,
  
  -- Tipo de clique
  click_type TEXT NOT NULL,
  link_label TEXT,
  
  -- Metadados
  user_agent TEXT,
  referrer TEXT,
  ip_hash TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_digital_cards_slug ON public.digital_cards(slug);
CREATE INDEX idx_digital_cards_owner ON public.digital_cards(owner_id);
CREATE INDEX idx_digital_cards_active ON public.digital_cards(is_active) WHERE is_active = true;
CREATE INDEX idx_card_clicks_card ON public.digital_card_clicks(card_id);
CREATE INDEX idx_card_clicks_date ON public.digital_card_clicks(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_digital_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_digital_cards_timestamp
BEFORE UPDATE ON public.digital_cards
FOR EACH ROW EXECUTE FUNCTION public.update_digital_cards_updated_at();

-- Função para incrementar views (anonimamente)
CREATE OR REPLACE FUNCTION public.increment_card_views(card_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.digital_cards 
  SET views_count = views_count + 1
  WHERE slug = card_slug AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS Policies
ALTER TABLE public.digital_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_card_clicks ENABLE ROW LEVEL SECURITY;

-- Leitura pública de cartões ativos
CREATE POLICY "digital_cards_public_read" ON public.digital_cards
  FOR SELECT USING (is_active = true);

-- CRUD para proprietário
CREATE POLICY "digital_cards_owner_insert" ON public.digital_cards
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "digital_cards_owner_update" ON public.digital_cards
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "digital_cards_owner_delete" ON public.digital_cards
  FOR DELETE USING (auth.uid() = owner_id);

-- Master admin pode gerenciar todos
CREATE POLICY "digital_cards_admin_all" ON public.digital_cards
  FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));

-- Cliques: insert público
CREATE POLICY "card_clicks_public_insert" ON public.digital_card_clicks
  FOR INSERT WITH CHECK (true);

-- Cliques: leitura para dono do cartão
CREATE POLICY "card_clicks_owner_read" ON public.digital_card_clicks
  FOR SELECT USING (
    card_id IN (SELECT id FROM public.digital_cards WHERE owner_id = auth.uid())
  );

-- Master admin pode ver todos os cliques
CREATE POLICY "card_clicks_admin_read" ON public.digital_card_clicks
  FOR SELECT USING (public.has_role(auth.uid(), 'master_admin'));