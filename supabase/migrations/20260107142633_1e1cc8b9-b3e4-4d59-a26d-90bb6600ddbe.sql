-- ============================================
-- MÓDULO ODONTOLÓGICO COMPLETO
-- ============================================

-- TABELA BASE: PACIENTES ODONTOLÓGICOS
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14),
  rg VARCHAR(20),
  birth_date DATE,
  gender VARCHAR(20),
  phone VARCHAR(20),
  phone_secondary VARCHAR(20),
  email VARCHAR(255),
  photo_url TEXT,
  address_street VARCHAR(255),
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  health_insurance VARCHAR(100),
  health_insurance_number VARCHAR(50),
  health_insurance_validity DATE,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relationship VARCHAR(50),
  occupation VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  referred_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PRONTUÁRIO DO PACIENTE
CREATE TABLE public.patient_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE UNIQUE,
  blood_type VARCHAR(5),
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  allergies TEXT,
  allergy_latex BOOLEAN DEFAULT false,
  allergy_anesthesia BOOLEAN DEFAULT false,
  allergy_penicillin BOOLEAN DEFAULT false,
  current_medications TEXT,
  medical_conditions TEXT,
  previous_surgeries TEXT,
  is_pregnant BOOLEAN DEFAULT false,
  is_breastfeeding BOOLEAN DEFAULT false,
  has_pacemaker BOOLEAN DEFAULT false,
  has_heart_condition BOOLEAN DEFAULT false,
  has_diabetes BOOLEAN DEFAULT false,
  has_hypertension BOOLEAN DEFAULT false,
  has_bleeding_disorder BOOLEAN DEFAULT false,
  has_hepatitis BOOLEAN DEFAULT false,
  has_hiv BOOLEAN DEFAULT false,
  is_smoker BOOLEAN DEFAULT false,
  smoking_frequency VARCHAR(50),
  alcohol_consumption VARCHAR(50),
  bruxism BOOLEAN DEFAULT false,
  clinical_observations TEXT,
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NOTAS CLÍNICAS / EVOLUÇÕES
CREATE TABLE public.clinical_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'evolution',
  attachments JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ODONTOGRAMA VISUAL
CREATE TABLE public.tooth_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  tooth_number INT NOT NULL CHECK (tooth_number >= 11 AND tooth_number <= 85),
  face VARCHAR(20),
  condition VARCHAR(100) NOT NULL,
  treatment_done TEXT,
  material VARCHAR(100),
  color VARCHAR(50),
  notes TEXT,
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROCEDIMENTOS ODONTOLÓGICOS
CREATE TABLE public.dental_procedures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  default_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  estimated_duration_minutes INT DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PLANOS DE TRATAMENTO
CREATE TABLE public.treatment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  plan_number VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  total_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_value DECIMAL(10,2) DEFAULT 0,
  final_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ITENS DO PLANO DE TRATAMENTO
CREATE TABLE public.treatment_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.dental_procedures(id),
  procedure_name VARCHAR(255) NOT NULL,
  procedure_code VARCHAR(50),
  tooth_number INT,
  face VARCHAR(20),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority INT DEFAULT 0,
  notes TEXT,
  scheduled_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ORÇAMENTOS
CREATE TABLE public.dental_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  treatment_plan_id UUID REFERENCES public.treatment_plans(id) ON DELETE SET NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  quote_number VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  subtotal DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_value DECIMAL(10,2) DEFAULT 0,
  total_value DECIMAL(10,2) NOT NULL,
  valid_until DATE,
  payment_conditions TEXT,
  installments INT DEFAULT 1,
  notes TEXT,
  internal_notes TEXT,
  sent_at TIMESTAMPTZ,
  sent_via VARCHAR(50),
  viewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  signature_data TEXT,
  signed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dental_quotes_quote_number_store_unique UNIQUE (quote_number, store_id)
);

-- ITENS DO ORÇAMENTO
CREATE TABLE public.dental_quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.dental_quotes(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.dental_procedures(id),
  description VARCHAR(255) NOT NULL,
  procedure_code VARCHAR(50),
  tooth_number INT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TEMPLATES DE DOCUMENTOS
CREATE TABLE public.dental_document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DOCUMENTOS EMITIDOS
CREATE TABLE public.dental_patient_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.dental_document_templates(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  document_number VARCHAR(50),
  medications JSONB,
  generated_by UUID REFERENCES auth.users(id),
  professional_name VARCHAR(255),
  professional_registration VARCHAR(100),
  signature_data TEXT,
  patient_signature_data TEXT,
  signed_at TIMESTAMPTZ,
  patient_signed_at TIMESTAMPTZ,
  pdf_url TEXT,
  sent_at TIMESTAMPTZ,
  sent_via VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AUDITORIA
CREATE TABLE public.dental_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CONSENTIMENTOS
CREATE TABLE public.dental_consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  consent_type VARCHAR(100) NOT NULL,
  version VARCHAR(50),
  accepted BOOLEAN NOT NULL DEFAULT false,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  signature_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ROW LEVEL SECURITY
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tooth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dental_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dental_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dental_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dental_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dental_patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dental_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dental_consent_records ENABLE ROW LEVEL SECURITY;

-- POLICIES (usando user_roles)
CREATE POLICY "dental_patients_select" ON public.patients FOR SELECT USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_patients_insert" ON public.patients FOR INSERT WITH CHECK (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_patients_update" ON public.patients FOR UPDATE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_patients_delete" ON public.patients FOR DELETE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));

CREATE POLICY "dental_patient_records_select" ON public.patient_records FOR SELECT USING (patient_id IN (SELECT id FROM public.patients WHERE store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL)));
CREATE POLICY "dental_patient_records_insert" ON public.patient_records FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL)));
CREATE POLICY "dental_patient_records_update" ON public.patient_records FOR UPDATE USING (patient_id IN (SELECT id FROM public.patients WHERE store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL)));
CREATE POLICY "dental_patient_records_delete" ON public.patient_records FOR DELETE USING (patient_id IN (SELECT id FROM public.patients WHERE store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL)));

CREATE POLICY "dental_clinical_notes_select" ON public.clinical_notes FOR SELECT USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_clinical_notes_insert" ON public.clinical_notes FOR INSERT WITH CHECK (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_clinical_notes_update" ON public.clinical_notes FOR UPDATE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_clinical_notes_delete" ON public.clinical_notes FOR DELETE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));

CREATE POLICY "dental_tooth_records_select" ON public.tooth_records FOR SELECT USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_tooth_records_insert" ON public.tooth_records FOR INSERT WITH CHECK (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_tooth_records_update" ON public.tooth_records FOR UPDATE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_tooth_records_delete" ON public.tooth_records FOR DELETE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));

CREATE POLICY "dental_procedures_select" ON public.dental_procedures FOR SELECT USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_procedures_insert" ON public.dental_procedures FOR INSERT WITH CHECK (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_procedures_update" ON public.dental_procedures FOR UPDATE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_procedures_delete" ON public.dental_procedures FOR DELETE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));

CREATE POLICY "dental_treatment_plans_select" ON public.treatment_plans FOR SELECT USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_treatment_plans_insert" ON public.treatment_plans FOR INSERT WITH CHECK (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_treatment_plans_update" ON public.treatment_plans FOR UPDATE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_treatment_plans_delete" ON public.treatment_plans FOR DELETE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));

CREATE POLICY "dental_treatment_plan_items_select" ON public.treatment_plan_items FOR SELECT USING (plan_id IN (SELECT id FROM public.treatment_plans WHERE store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL)));
CREATE POLICY "dental_treatment_plan_items_insert" ON public.treatment_plan_items FOR INSERT WITH CHECK (plan_id IN (SELECT id FROM public.treatment_plans WHERE store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL)));
CREATE POLICY "dental_treatment_plan_items_update" ON public.treatment_plan_items FOR UPDATE USING (plan_id IN (SELECT id FROM public.treatment_plans WHERE store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL)));
CREATE POLICY "dental_treatment_plan_items_delete" ON public.treatment_plan_items FOR DELETE USING (plan_id IN (SELECT id FROM public.treatment_plans WHERE store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL)));

CREATE POLICY "dental_quotes_select" ON public.dental_quotes FOR SELECT USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_quotes_insert" ON public.dental_quotes FOR INSERT WITH CHECK (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_quotes_update" ON public.dental_quotes FOR UPDATE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_quotes_delete" ON public.dental_quotes FOR DELETE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));

CREATE POLICY "dental_quote_items_select" ON public.dental_quote_items FOR SELECT USING (quote_id IN (SELECT id FROM public.dental_quotes WHERE store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL)));
CREATE POLICY "dental_quote_items_insert" ON public.dental_quote_items FOR INSERT WITH CHECK (quote_id IN (SELECT id FROM public.dental_quotes WHERE store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL)));
CREATE POLICY "dental_quote_items_update" ON public.dental_quote_items FOR UPDATE USING (quote_id IN (SELECT id FROM public.dental_quotes WHERE store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL)));
CREATE POLICY "dental_quote_items_delete" ON public.dental_quote_items FOR DELETE USING (quote_id IN (SELECT id FROM public.dental_quotes WHERE store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL)));

CREATE POLICY "dental_document_templates_select" ON public.dental_document_templates FOR SELECT USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_document_templates_insert" ON public.dental_document_templates FOR INSERT WITH CHECK (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_document_templates_update" ON public.dental_document_templates FOR UPDATE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_document_templates_delete" ON public.dental_document_templates FOR DELETE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));

CREATE POLICY "dental_patient_documents_select" ON public.dental_patient_documents FOR SELECT USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_patient_documents_insert" ON public.dental_patient_documents FOR INSERT WITH CHECK (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_patient_documents_update" ON public.dental_patient_documents FOR UPDATE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_patient_documents_delete" ON public.dental_patient_documents FOR DELETE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));

CREATE POLICY "dental_audit_log_select" ON public.dental_audit_log FOR SELECT USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_audit_log_insert" ON public.dental_audit_log FOR INSERT WITH CHECK (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));

CREATE POLICY "dental_consent_records_select" ON public.dental_consent_records FOR SELECT USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_consent_records_insert" ON public.dental_consent_records FOR INSERT WITH CHECK (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));
CREATE POLICY "dental_consent_records_update" ON public.dental_consent_records FOR UPDATE USING (store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND store_id IS NOT NULL));

-- TRIGGERS
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patient_records_updated_at BEFORE UPDATE ON public.patient_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinical_notes_updated_at BEFORE UPDATE ON public.clinical_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tooth_records_updated_at BEFORE UPDATE ON public.tooth_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dental_procedures_updated_at BEFORE UPDATE ON public.dental_procedures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON public.treatment_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_treatment_plan_items_updated_at BEFORE UPDATE ON public.treatment_plan_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dental_quotes_updated_at BEFORE UPDATE ON public.dental_quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dental_document_templates_updated_at BEFORE UPDATE ON public.dental_document_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dental_patient_documents_updated_at BEFORE UPDATE ON public.dental_patient_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ÍNDICES
CREATE INDEX idx_patients_store ON public.patients(store_id);
CREATE INDEX idx_patients_name ON public.patients(name);
CREATE INDEX idx_patients_cpf ON public.patients(cpf);
CREATE INDEX idx_patients_phone ON public.patients(phone);
CREATE INDEX idx_patient_records_patient ON public.patient_records(patient_id);
CREATE INDEX idx_clinical_notes_patient ON public.clinical_notes(patient_id);
CREATE INDEX idx_clinical_notes_store ON public.clinical_notes(store_id);
CREATE INDEX idx_tooth_records_patient ON public.tooth_records(patient_id);
CREATE INDEX idx_tooth_records_store ON public.tooth_records(store_id);
CREATE INDEX idx_dental_procedures_store ON public.dental_procedures(store_id);
CREATE INDEX idx_treatment_plans_patient ON public.treatment_plans(patient_id);
CREATE INDEX idx_treatment_plans_store ON public.treatment_plans(store_id);
CREATE INDEX idx_treatment_plan_items_plan ON public.treatment_plan_items(plan_id);
CREATE INDEX idx_dental_quotes_patient ON public.dental_quotes(patient_id);
CREATE INDEX idx_dental_quotes_store ON public.dental_quotes(store_id);
CREATE INDEX idx_dental_document_templates_store ON public.dental_document_templates(store_id);
CREATE INDEX idx_dental_patient_documents_patient ON public.dental_patient_documents(patient_id);
CREATE INDEX idx_dental_patient_documents_store ON public.dental_patient_documents(store_id);
CREATE INDEX idx_dental_audit_log_patient ON public.dental_audit_log(patient_id);
CREATE INDEX idx_dental_audit_log_store ON public.dental_audit_log(store_id);
CREATE INDEX idx_dental_consent_records_patient ON public.dental_consent_records(patient_id);
CREATE INDEX idx_dental_consent_records_store ON public.dental_consent_records(store_id);