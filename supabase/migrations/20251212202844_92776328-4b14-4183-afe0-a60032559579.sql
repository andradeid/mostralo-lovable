-- Faixas de benefícios editáveis
CREATE TABLE public.qualification_benefit_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_order INT NOT NULL,
  tier_name VARCHAR(50) NOT NULL,
  min_points INT NOT NULL,
  max_points INT NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  benefit_description TEXT NOT NULL,
  free_days INT DEFAULT 0,
  include_consulting BOOLEAN DEFAULT false,
  include_followup BOOLEAN DEFAULT false,
  followup_days INT DEFAULT 0,
  promotion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Templates pré-definidos (Agressivo, Moderado, Conservador)
CREATE TABLE public.qualification_tier_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL,
  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('agressivo', 'moderado', 'conservador')),
  description TEXT,
  tier_configs JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Histórico de edições para auditoria
CREATE TABLE public.qualification_tier_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id UUID REFERENCES public.qualification_benefit_tiers(id) ON DELETE CASCADE,
  edited_by UUID NOT NULL,
  edited_at TIMESTAMPTZ DEFAULT now(),
  change_type VARCHAR(30) NOT NULL,
  previous_values JSONB,
  new_values JSONB,
  promotion_changed BOOLEAN DEFAULT false,
  template_applied VARCHAR(100)
);

-- RLS
ALTER TABLE public.qualification_benefit_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualification_tier_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualification_tier_edit_history ENABLE ROW LEVEL SECURITY;

-- Políticas para master_admin
CREATE POLICY "master_admin_manage_tiers" ON public.qualification_benefit_tiers
  FOR ALL USING (has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "master_admin_view_templates" ON public.qualification_tier_templates
  FOR SELECT USING (has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "master_admin_manage_history" ON public.qualification_tier_edit_history
  FOR ALL USING (has_role(auth.uid(), 'master_admin'::app_role));

-- Seed com as 5 faixas atuais
INSERT INTO public.qualification_benefit_tiers (tier_order, tier_name, min_points, max_points, emoji, benefit_description, free_days, include_consulting, include_followup, followup_days) VALUES
(1, 'LEAD PREMIUM', 80, 100, '🏆', '1 mês GRÁTIS + Consultoria de Setup + Acompanhamento', 30, true, true, 30),
(2, 'LEAD QUENTE', 60, 79, '🔥', '15 dias GRÁTIS + Consultoria de Setup', 15, true, false, 0),
(3, 'LEAD MORNO', 40, 59, '🌡️', 'Consultoria GRATUITA + 7 dias de Teste', 7, true, false, 0),
(4, 'LEAD FRIO', 20, 39, '❄️', 'Análise de Taxas Comparativa (PDF)', 0, false, false, 0),
(5, 'DESQUALIFICADO', 0, 19, '⛔', 'Agradecimento + Porta Aberta para o Futuro', 0, false, false, 0);

-- Seed com os 3 templates
INSERT INTO public.qualification_tier_templates (template_name, template_type, description, tier_configs, is_default) VALUES
('Agressivo', 'agressivo', 'Benefícios máximos para conversão rápida. Ideal para campanhas promocionais.', 
 '[
   {"tier_order": 1, "tier_name": "LEAD PREMIUM", "min_points": 75, "max_points": 100, "free_days": 45, "include_consulting": true, "include_followup": true, "followup_days": 60, "emoji": "🏆", "benefit_description": "45 dias GRÁTIS + Consultoria + 60 dias Acompanhamento"},
   {"tier_order": 2, "tier_name": "LEAD QUENTE", "min_points": 55, "max_points": 74, "free_days": 30, "include_consulting": true, "include_followup": true, "followup_days": 30, "emoji": "🔥", "benefit_description": "30 dias GRÁTIS + Consultoria + 30 dias Acompanhamento"},
   {"tier_order": 3, "tier_name": "LEAD MORNO", "min_points": 35, "max_points": 54, "free_days": 15, "include_consulting": true, "include_followup": false, "followup_days": 0, "emoji": "🌡️", "benefit_description": "15 dias GRÁTIS + Consultoria"},
   {"tier_order": 4, "tier_name": "LEAD FRIO", "min_points": 15, "max_points": 34, "free_days": 7, "include_consulting": true, "include_followup": false, "followup_days": 0, "emoji": "❄️", "benefit_description": "7 dias GRÁTIS + Consultoria"},
   {"tier_order": 5, "tier_name": "DESQUALIFICADO", "min_points": 0, "max_points": 14, "free_days": 3, "include_consulting": false, "include_followup": false, "followup_days": 0, "emoji": "⛔", "benefit_description": "3 dias de teste + Porta Aberta"}
 ]'::jsonb, false),
 
('Moderado', 'moderado', 'Equilíbrio entre conversão e custo. Padrão recomendado.', 
 '[
   {"tier_order": 1, "tier_name": "LEAD PREMIUM", "min_points": 80, "max_points": 100, "free_days": 30, "include_consulting": true, "include_followup": true, "followup_days": 30, "emoji": "🏆", "benefit_description": "1 mês GRÁTIS + Consultoria de Setup + Acompanhamento"},
   {"tier_order": 2, "tier_name": "LEAD QUENTE", "min_points": 60, "max_points": 79, "free_days": 15, "include_consulting": true, "include_followup": false, "followup_days": 0, "emoji": "🔥", "benefit_description": "15 dias GRÁTIS + Consultoria de Setup"},
   {"tier_order": 3, "tier_name": "LEAD MORNO", "min_points": 40, "max_points": 59, "free_days": 7, "include_consulting": true, "include_followup": false, "followup_days": 0, "emoji": "🌡️", "benefit_description": "Consultoria GRATUITA + 7 dias de Teste"},
   {"tier_order": 4, "tier_name": "LEAD FRIO", "min_points": 20, "max_points": 39, "free_days": 0, "include_consulting": false, "include_followup": false, "followup_days": 0, "emoji": "❄️", "benefit_description": "Análise de Taxas Comparativa (PDF)"},
   {"tier_order": 5, "tier_name": "DESQUALIFICADO", "min_points": 0, "max_points": 19, "free_days": 0, "include_consulting": false, "include_followup": false, "followup_days": 0, "emoji": "⛔", "benefit_description": "Agradecimento + Porta Aberta para o Futuro"}
 ]'::jsonb, true),

('Conservador', 'conservador', 'Benefícios enxutos para leads altamente qualificados. Menor custo operacional.', 
 '[
   {"tier_order": 1, "tier_name": "LEAD PREMIUM", "min_points": 85, "max_points": 100, "free_days": 15, "include_consulting": true, "include_followup": true, "followup_days": 15, "emoji": "🏆", "benefit_description": "15 dias GRÁTIS + Consultoria + 15 dias Acompanhamento"},
   {"tier_order": 2, "tier_name": "LEAD QUENTE", "min_points": 70, "max_points": 84, "free_days": 7, "include_consulting": true, "include_followup": false, "followup_days": 0, "emoji": "🔥", "benefit_description": "7 dias GRÁTIS + Consultoria de Setup"},
   {"tier_order": 3, "tier_name": "LEAD MORNO", "min_points": 50, "max_points": 69, "free_days": 3, "include_consulting": false, "include_followup": false, "followup_days": 0, "emoji": "🌡️", "benefit_description": "3 dias de Teste"},
   {"tier_order": 4, "tier_name": "LEAD FRIO", "min_points": 25, "max_points": 49, "free_days": 0, "include_consulting": false, "include_followup": false, "followup_days": 0, "emoji": "❄️", "benefit_description": "Material Educativo"},
   {"tier_order": 5, "tier_name": "DESQUALIFICADO", "min_points": 0, "max_points": 24, "free_days": 0, "include_consulting": false, "include_followup": false, "followup_days": 0, "emoji": "⛔", "benefit_description": "Agradecimento"}
 ]'::jsonb, false);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_qualification_tier_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_qualification_tier_timestamp
  BEFORE UPDATE ON public.qualification_benefit_tiers
  FOR EACH ROW EXECUTE FUNCTION update_qualification_tier_timestamp();