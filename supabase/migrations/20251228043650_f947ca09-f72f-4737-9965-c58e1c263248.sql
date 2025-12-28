-- ===========================================
-- PORTAL DO PROFISSIONAL - Infraestrutura CORRIGIDA
-- ===========================================

-- 1. Adicionar role 'professional' ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'professional';

-- 2. Criar tabela de comissões dos profissionais
CREATE TABLE IF NOT EXISTS public.professional_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  service_price NUMERIC(10,2) NOT NULL,
  commission_type TEXT NOT NULL DEFAULT 'percentage',
  commission_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id)
);

-- 3. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_professional_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_professional_commissions_updated_at ON public.professional_commissions;
CREATE TRIGGER trg_professional_commissions_updated_at
BEFORE UPDATE ON public.professional_commissions
FOR EACH ROW EXECUTE FUNCTION public.update_professional_commissions_updated_at();

-- 4. Trigger para calcular comissão automaticamente quando booking é concluído
CREATE OR REPLACE FUNCTION public.calculate_professional_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_prof RECORD;
  v_calc_amount NUMERIC;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    SELECT id, commission_type, commission_value 
    INTO v_prof
    FROM public.professionals 
    WHERE id = NEW.professional_id;
    
    IF v_prof.commission_value IS NOT NULL AND v_prof.commission_value > 0 THEN
      IF v_prof.commission_type = 'percentage' THEN
        v_calc_amount := (NEW.price * v_prof.commission_value / 100);
      ELSE
        v_calc_amount := v_prof.commission_value;
      END IF;
      
      INSERT INTO public.professional_commissions (
        professional_id, booking_id, store_id, service_price, 
        commission_type, commission_value, commission_amount
      ) VALUES (
        NEW.professional_id, NEW.id, NEW.store_id, NEW.price,
        COALESCE(v_prof.commission_type, 'percentage'), 
        COALESCE(v_prof.commission_value, 0), 
        COALESCE(v_calc_amount, 0)
      )
      ON CONFLICT (booking_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_booking_professional_commission ON public.bookings;
CREATE TRIGGER trg_booking_professional_commission
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.calculate_professional_commission();

-- 5. Função helper para verificar se usuário é professional
CREATE OR REPLACE FUNCTION public.is_professional_self(_professional_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.professionals
    WHERE id = _professional_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 6. Função para buscar store_id através do professional_id
CREATE OR REPLACE FUNCTION public.get_professional_store_id(_professional_id UUID)
RETURNS UUID AS $$
  SELECT store_id FROM public.professionals WHERE id = _professional_id LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 7. Habilitar RLS
ALTER TABLE public.professional_commissions ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies para professional_commissions
DROP POLICY IF EXISTS "professionals_view_own_commissions" ON public.professional_commissions;
CREATE POLICY "professionals_view_own_commissions" ON public.professional_commissions
FOR SELECT TO authenticated
USING (
  public.is_professional_self(professional_id)
  OR public.is_store_admin_of(store_id)
  OR public.has_role(auth.uid(), 'master_admin')
);

DROP POLICY IF EXISTS "store_admins_manage_commissions" ON public.professional_commissions;
CREATE POLICY "store_admins_manage_commissions" ON public.professional_commissions
FOR ALL TO authenticated
USING (
  public.is_store_admin_of(store_id)
  OR public.has_role(auth.uid(), 'master_admin')
);

-- 9. RLS Policies para bookings (adicionar acesso para profissionais)
DROP POLICY IF EXISTS "professionals_view_own_bookings" ON public.bookings;
CREATE POLICY "professionals_view_own_bookings" ON public.bookings
FOR SELECT TO authenticated
USING (
  professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "professionals_update_own_bookings" ON public.bookings;
CREATE POLICY "professionals_update_own_bookings" ON public.bookings
FOR UPDATE TO authenticated
USING (
  professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
)
WITH CHECK (
  professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
);

-- 10. RLS Policies para professional_schedules (buscar store via professional)
DROP POLICY IF EXISTS "professionals_view_own_schedules" ON public.professional_schedules;
CREATE POLICY "professionals_view_own_schedules" ON public.professional_schedules
FOR SELECT TO authenticated
USING (
  public.is_professional_self(professional_id)
  OR public.is_store_admin_of(public.get_professional_store_id(professional_id))
  OR public.has_role(auth.uid(), 'master_admin')
);

DROP POLICY IF EXISTS "professionals_manage_own_schedules" ON public.professional_schedules;
CREATE POLICY "professionals_manage_own_schedules" ON public.professional_schedules
FOR ALL TO authenticated
USING (public.is_professional_self(professional_id))
WITH CHECK (public.is_professional_self(professional_id));

-- 11. RLS Policies para professional_blocks (buscar store via professional)
DROP POLICY IF EXISTS "professionals_view_own_blocks" ON public.professional_blocks;
CREATE POLICY "professionals_view_own_blocks" ON public.professional_blocks
FOR SELECT TO authenticated
USING (
  public.is_professional_self(professional_id)
  OR public.is_store_admin_of(public.get_professional_store_id(professional_id))
  OR public.has_role(auth.uid(), 'master_admin')
);

DROP POLICY IF EXISTS "professionals_manage_own_blocks" ON public.professional_blocks;
CREATE POLICY "professionals_manage_own_blocks" ON public.professional_blocks
FOR ALL TO authenticated
USING (public.is_professional_self(professional_id))
WITH CHECK (public.is_professional_self(professional_id));

-- 12. Policy para profissionais verem seus próprios dados
DROP POLICY IF EXISTS "professionals_view_own_profile" ON public.professionals;
CREATE POLICY "professionals_view_own_profile" ON public.professionals
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_store_admin_of(store_id)
  OR public.has_role(auth.uid(), 'master_admin')
);

DROP POLICY IF EXISTS "professionals_update_own_profile" ON public.professionals;
CREATE POLICY "professionals_update_own_profile" ON public.professionals
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 13. Índices para performance
CREATE INDEX IF NOT EXISTS idx_professional_commissions_professional_id ON public.professional_commissions(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_commissions_store_id ON public.professional_commissions(store_id);
CREATE INDEX IF NOT EXISTS idx_professional_commissions_status ON public.professional_commissions(status);
CREATE INDEX IF NOT EXISTS idx_professional_commissions_created_at ON public.professional_commissions(created_at);
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON public.professionals(user_id);