-- =====================================================
-- MÓDULO DE AGENDAMENTO - TABELAS PRINCIPAIS
-- =====================================================

-- 1. PROFESSIONALS (Profissionais/Prestadores)
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  photo_url TEXT,
  specialty TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  commission_type TEXT DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PROFESSIONAL_SCHEDULES (Horários de trabalho)
CREATE TABLE public.professional_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(professional_id, day_of_week)
);

-- 3. PROFESSIONAL_BLOCKS (Bloqueios/Férias/Folgas)
CREATE TABLE public.professional_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_all_day BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. BOOKING_SERVICES (Serviços agendáveis)
CREATE TABLE public.booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_minutes INTEGER DEFAULT 0,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'from')),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  requires_deposit BOOLEAN DEFAULT false,
  deposit_amount NUMERIC(10,2),
  deposit_percentage NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. PROFESSIONAL_SERVICES (Vínculo profissional-serviço)
CREATE TABLE public.professional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.booking_services(id) ON DELETE CASCADE,
  custom_price NUMERIC(10,2),
  custom_duration INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(professional_id, service_id)
);

-- 6. BOOKINGS (Agendamentos)
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id),
  service_id UUID NOT NULL REFERENCES public.booking_services(id),
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'no_show', 'cancelled')),
  price NUMERIC(10,2) NOT NULL,
  deposit_amount NUMERIC(10,2) DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT false,
  deposit_paid_at TIMESTAMPTZ,
  comanda_id UUID REFERENCES public.comandas(id),
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  reminder_sent BOOLEAN DEFAULT false,
  confirmation_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. BOOKING_SETTINGS (Configurações do módulo por loja)
CREATE TABLE public.booking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  min_advance_hours INTEGER DEFAULT 2,
  max_advance_days INTEGER DEFAULT 30,
  slot_interval_minutes INTEGER DEFAULT 30,
  allow_any_professional BOOLEAN DEFAULT true,
  send_confirmation_message BOOLEAN DEFAULT true,
  confirmation_message_template TEXT,
  send_reminder_message BOOLEAN DEFAULT true,
  reminder_hours_before INTEGER DEFAULT 2,
  reminder_message_template TEXT,
  send_satisfaction_survey BOOLEAN DEFAULT false,
  satisfaction_message_template TEXT,
  require_deposit BOOLEAN DEFAULT false,
  default_deposit_percentage NUMERIC(5,2) DEFAULT 0,
  cancellation_hours_limit INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX idx_professionals_store ON public.professionals(store_id);
CREATE INDEX idx_professionals_active ON public.professionals(store_id, is_active);
CREATE INDEX idx_professional_schedules_prof ON public.professional_schedules(professional_id);
CREATE INDEX idx_professional_blocks_prof_date ON public.professional_blocks(professional_id, block_date);
CREATE INDEX idx_booking_services_store ON public.booking_services(store_id);
CREATE INDEX idx_booking_services_active ON public.booking_services(store_id, is_active);
CREATE INDEX idx_professional_services_prof ON public.professional_services(professional_id);
CREATE INDEX idx_professional_services_service ON public.professional_services(service_id);
CREATE INDEX idx_bookings_store_date ON public.bookings(store_id, booking_date);
CREATE INDEX idx_bookings_professional_date ON public.bookings(professional_id, booking_date);
CREATE INDEX idx_bookings_status ON public.bookings(store_id, status);
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);

-- =====================================================
-- TRIGGERS PARA updated_at
-- =====================================================
CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professional_schedules_updated_at
  BEFORE UPDATE ON public.professional_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_services_updated_at
  BEFORE UPDATE ON public.booking_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_settings_updated_at
  BEFORE UPDATE ON public.booking_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FUNÇÃO PARA VALIDAR CONFLITO DE HORÁRIO
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_booking_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se existe conflito de horário para o mesmo profissional
  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE professional_id = NEW.professional_id
      AND booking_date = NEW.booking_date
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status NOT IN ('cancelled', 'no_show')
      AND (
        (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
        (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
        (NEW.start_time <= start_time AND NEW.end_time >= end_time)
      )
  ) THEN
    RAISE EXCEPTION 'Conflito de horário: já existe um agendamento para este profissional neste horário.';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_booking_conflict_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_booking_conflict();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;

-- PROFESSIONALS policies
CREATE POLICY "Master admin full access to professionals"
  ON public.professionals FOR ALL
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Store owner full access to professionals"
  ON public.professionals FOR ALL
  USING (public.is_store_owner_direct(store_id, auth.uid()));

CREATE POLICY "Attendant can manage professionals"
  ON public.professionals FOR ALL
  USING (public.is_attendant_of_store_direct(store_id, auth.uid()));

CREATE POLICY "Public can view active professionals"
  ON public.professionals FOR SELECT
  USING (is_active = true);

-- PROFESSIONAL_SCHEDULES policies
CREATE POLICY "Master admin full access to schedules"
  ON public.professional_schedules FOR ALL
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Store owner full access to schedules"
  ON public.professional_schedules FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = professional_id
    AND public.is_store_owner_direct(p.store_id, auth.uid())
  ));

CREATE POLICY "Attendant can manage schedules"
  ON public.professional_schedules FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = professional_id
    AND public.is_attendant_of_store_direct(p.store_id, auth.uid())
  ));

CREATE POLICY "Public can view schedules"
  ON public.professional_schedules FOR SELECT
  USING (is_available = true);

-- PROFESSIONAL_BLOCKS policies
CREATE POLICY "Master admin full access to blocks"
  ON public.professional_blocks FOR ALL
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Store owner full access to blocks"
  ON public.professional_blocks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = professional_id
    AND public.is_store_owner_direct(p.store_id, auth.uid())
  ));

CREATE POLICY "Attendant can manage blocks"
  ON public.professional_blocks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = professional_id
    AND public.is_attendant_of_store_direct(p.store_id, auth.uid())
  ));

-- BOOKING_SERVICES policies
CREATE POLICY "Master admin full access to booking_services"
  ON public.booking_services FOR ALL
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Store owner full access to booking_services"
  ON public.booking_services FOR ALL
  USING (public.is_store_owner_direct(store_id, auth.uid()));

CREATE POLICY "Attendant can manage booking_services"
  ON public.booking_services FOR ALL
  USING (public.is_attendant_of_store_direct(store_id, auth.uid()));

CREATE POLICY "Public can view active booking_services"
  ON public.booking_services FOR SELECT
  USING (is_active = true);

-- PROFESSIONAL_SERVICES policies
CREATE POLICY "Master admin full access to professional_services"
  ON public.professional_services FOR ALL
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Store owner full access to professional_services"
  ON public.professional_services FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = professional_id
    AND public.is_store_owner_direct(p.store_id, auth.uid())
  ));

CREATE POLICY "Attendant can manage professional_services"
  ON public.professional_services FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = professional_id
    AND public.is_attendant_of_store_direct(p.store_id, auth.uid())
  ));

CREATE POLICY "Public can view active professional_services"
  ON public.professional_services FOR SELECT
  USING (is_active = true);

-- BOOKINGS policies
CREATE POLICY "Master admin full access to bookings"
  ON public.bookings FOR ALL
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Store owner full access to bookings"
  ON public.bookings FOR ALL
  USING (public.is_store_owner_direct(store_id, auth.uid()));

CREATE POLICY "Attendant can manage bookings"
  ON public.bookings FOR ALL
  USING (public.is_attendant_of_store_direct(store_id, auth.uid()));

CREATE POLICY "Customer can view own bookings"
  ON public.bookings FOR SELECT
  USING (customer_id IN (
    SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
  ));

-- BOOKING_SETTINGS policies
CREATE POLICY "Master admin full access to booking_settings"
  ON public.booking_settings FOR ALL
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Store owner full access to booking_settings"
  ON public.booking_settings FOR ALL
  USING (public.is_store_owner_direct(store_id, auth.uid()));

CREATE POLICY "Attendant can view booking_settings"
  ON public.booking_settings FOR SELECT
  USING (public.is_attendant_of_store_direct(store_id, auth.uid()));

CREATE POLICY "Public can view booking_settings"
  ON public.booking_settings FOR SELECT
  USING (true);