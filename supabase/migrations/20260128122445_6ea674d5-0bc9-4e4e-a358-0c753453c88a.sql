-- Tabela para armazenar links de navegação encurtados
CREATE TABLE public.short_links (
  id TEXT PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  store_slug TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  clicks INTEGER DEFAULT 0
);

-- RLS habilitado mas permitindo leitura pública (para resolver o link)
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (qualquer um pode acessar para navegar)
CREATE POLICY "Short links são públicos para leitura"
ON public.short_links
FOR SELECT
USING (true);

-- Política para inserção (sistema/authenticated users)
CREATE POLICY "Sistema pode criar short links"
ON public.short_links
FOR INSERT
WITH CHECK (true);

-- Política para update de clicks
CREATE POLICY "Sistema pode atualizar clicks"
ON public.short_links
FOR UPDATE
USING (true);

-- Índice para busca rápida por store_slug e coordenadas
CREATE INDEX idx_short_links_lookup ON public.short_links(store_slug, lat, lng);