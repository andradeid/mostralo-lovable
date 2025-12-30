-- =============================================
-- SISTEMA DE UPSELL E CROSS-SELL
-- =============================================

-- 1. Tabela de Upsells por Produto
CREATE TABLE public.product_upsells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  upsell_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  upsell_price NUMERIC(10,2),
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_product_upsell UNIQUE(product_id, upsell_product_id),
  CONSTRAINT different_products CHECK (product_id <> upsell_product_id)
);

-- 2. Tabela de Estatísticas de Upsell
CREATE TABLE public.upsell_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_upsell_id UUID NOT NULL REFERENCES public.product_upsells(id) ON DELETE CASCADE,
  shown_count INTEGER DEFAULT 0,
  accepted_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  revenue_generated NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_upsell_stats UNIQUE(product_upsell_id)
);

-- 3. Tabela de Regras de Cross-sell por Categoria
CREATE TABLE public.category_crosssell_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  trigger_category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  suggest_category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 1,
  max_suggestions INTEGER DEFAULT 3,
  discount_percentage NUMERIC(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_crosssell_rule UNIQUE(trigger_category_id, suggest_category_id),
  CONSTRAINT different_categories CHECK (trigger_category_id <> suggest_category_id)
);

-- 4. Tabela de Estatísticas de Cross-sell
CREATE TABLE public.crosssell_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.category_crosssell_rules(id) ON DELETE CASCADE,
  shown_count INTEGER DEFAULT 0,
  accepted_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  revenue_generated NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_crosssell_stats UNIQUE(rule_id)
);

-- 5. Índices para performance
CREATE INDEX idx_product_upsells_product ON public.product_upsells(product_id) WHERE is_active = true;
CREATE INDEX idx_product_upsells_store ON public.product_upsells(store_id);
CREATE INDEX idx_crosssell_rules_trigger ON public.category_crosssell_rules(trigger_category_id) WHERE is_active = true;
CREATE INDEX idx_crosssell_rules_store ON public.category_crosssell_rules(store_id);

-- 6. Trigger para updated_at
CREATE TRIGGER update_product_upsells_updated_at
  BEFORE UPDATE ON public.product_upsells
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crosssell_rules_updated_at
  BEFORE UPDATE ON public.category_crosssell_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. RLS Policies para product_upsells
ALTER TABLE public.product_upsells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lojas acessam seus upsells"
  ON public.product_upsells FOR ALL
  USING (store_id IN (
    SELECT store_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT id FROM public.stores WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Leitura pública de upsells ativos"
  ON public.product_upsells FOR SELECT
  USING (is_active = true);

-- 8. RLS Policies para upsell_statistics
ALTER TABLE public.upsell_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lojas acessam suas estatísticas de upsell"
  ON public.upsell_statistics FOR ALL
  USING (store_id IN (
    SELECT store_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT id FROM public.stores WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Atualização pública de estatísticas upsell"
  ON public.upsell_statistics FOR UPDATE
  USING (true);

-- 9. RLS Policies para category_crosssell_rules
ALTER TABLE public.category_crosssell_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lojas acessam suas regras de crosssell"
  ON public.category_crosssell_rules FOR ALL
  USING (store_id IN (
    SELECT store_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT id FROM public.stores WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Leitura pública de regras ativas"
  ON public.category_crosssell_rules FOR SELECT
  USING (is_active = true);

-- 10. RLS Policies para crosssell_statistics
ALTER TABLE public.crosssell_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lojas acessam suas estatísticas de crosssell"
  ON public.crosssell_statistics FOR ALL
  USING (store_id IN (
    SELECT store_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT id FROM public.stores WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Atualização pública de estatísticas crosssell"
  ON public.crosssell_statistics FOR UPDATE
  USING (true);

-- 11. Inserir módulo de Upsell
INSERT INTO public.modules (key, name, description, icon, is_active) 
VALUES ('upsell', 'Vendas Sugeridas', 'Sistema de upsell e cross-sell para aumentar o ticket médio', 'TrendingUp', true)
ON CONFLICT (key) DO NOTHING;