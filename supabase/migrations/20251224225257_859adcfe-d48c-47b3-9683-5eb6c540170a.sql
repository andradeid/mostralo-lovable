-- =============================================
-- SISTEMA DE COMANDAS + PDV
-- Tabelas para vendas presenciais (balcão e mesa)
-- =============================================

-- Tabela principal de comandas
CREATE TABLE public.comandas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'balcao' CHECK (type IN ('balcao', 'mesa')),
  table_number TEXT,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opened_by UUID REFERENCES auth.users(id),
  closed_by UUID REFERENCES auth.users(id),
  payment_method TEXT,
  payment_details JSONB DEFAULT '{}',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de itens da comanda
CREATE TABLE public.comanda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id UUID NOT NULL REFERENCES public.comandas(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  addons JSONB DEFAULT '[]',
  notes TEXT,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_comandas_store_id ON public.comandas(store_id);
CREATE INDEX idx_comandas_status ON public.comandas(status);
CREATE INDEX idx_comandas_store_status ON public.comandas(store_id, status);
CREATE INDEX idx_comandas_opened_at ON public.comandas(opened_at DESC);
CREATE INDEX idx_comanda_items_comanda_id ON public.comanda_items(comanda_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_comandas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_comandas_updated_at
  BEFORE UPDATE ON public.comandas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comandas_updated_at();

-- Trigger para recalcular totais da comanda
CREATE OR REPLACE FUNCTION public.recalculate_comanda_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal NUMERIC(10,2);
  v_comanda_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_comanda_id := OLD.comanda_id;
  ELSE
    v_comanda_id := NEW.comanda_id;
  END IF;
  
  SELECT COALESCE(SUM(total_price), 0) INTO v_subtotal
  FROM public.comanda_items
  WHERE comanda_id = v_comanda_id;
  
  UPDATE public.comandas
  SET 
    subtotal = v_subtotal,
    total = v_subtotal - COALESCE(discount, 0),
    updated_at = NOW()
  WHERE id = v_comanda_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_recalculate_comanda_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.comanda_items
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_comanda_totals();

-- Função auxiliar para verificar acesso (usando plpgsql corretamente)
CREATE OR REPLACE FUNCTION public.can_access_store_comandas(check_store_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND store_id = check_store_id
    AND role IN ('store_admin', 'attendant')
  ) OR EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = check_store_id
    AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'master_admin'
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Habilitar RLS
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanda_items ENABLE ROW LEVEL SECURITY;

-- Policies para comandas
CREATE POLICY "comandas_select_policy" ON public.comandas
  FOR SELECT USING (public.can_access_store_comandas(store_id));

CREATE POLICY "comandas_insert_policy" ON public.comandas
  FOR INSERT WITH CHECK (public.can_access_store_comandas(store_id));

CREATE POLICY "comandas_update_policy" ON public.comandas
  FOR UPDATE USING (public.can_access_store_comandas(store_id));

CREATE POLICY "comandas_delete_policy" ON public.comandas
  FOR DELETE USING (public.can_access_store_comandas(store_id));

-- Policies para comanda_items
CREATE POLICY "comanda_items_select_policy" ON public.comanda_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.comandas c WHERE c.id = comanda_id AND public.can_access_store_comandas(c.store_id))
  );

CREATE POLICY "comanda_items_insert_policy" ON public.comanda_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.comandas c WHERE c.id = comanda_id AND public.can_access_store_comandas(c.store_id))
  );

CREATE POLICY "comanda_items_update_policy" ON public.comanda_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.comandas c WHERE c.id = comanda_id AND public.can_access_store_comandas(c.store_id))
  );

CREATE POLICY "comanda_items_delete_policy" ON public.comanda_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.comandas c WHERE c.id = comanda_id AND public.can_access_store_comandas(c.store_id))
  );

-- Função para gerar próximo número de comanda
CREATE OR REPLACE FUNCTION public.get_next_comanda_number(p_store_id UUID, p_type TEXT DEFAULT 'balcao')
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_next_num INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  v_prefix := CASE p_type
    WHEN 'mesa' THEN 'M'
    WHEN 'balcao' THEN 'B'
    ELSE 'C'
  END;
  
  SELECT COUNT(*) + 1 INTO v_next_num
  FROM public.comandas
  WHERE store_id = p_store_id
  AND type = p_type
  AND DATE(opened_at) = v_today;
  
  RETURN v_prefix || LPAD(v_next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;