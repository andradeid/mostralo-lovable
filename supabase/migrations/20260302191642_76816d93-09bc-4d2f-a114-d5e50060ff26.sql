
-- 1. Adicionar niche_id na tabela stores
ALTER TABLE public.stores ADD COLUMN niche_id UUID REFERENCES public.niches(id) ON DELETE SET NULL;

-- 2. Criar tabela niche_ai_configs
CREATE TABLE public.niche_ai_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id UUID NOT NULL REFERENCES public.niches(id) ON DELETE CASCADE,
  bot_mode TEXT NOT NULL CHECK (bot_mode IN ('chat_completion', 'assistant', 'conversational')),
  prompt_base TEXT NOT NULL DEFAULT '',
  prompt_restrictions TEXT DEFAULT '',
  enabled_tools TEXT[] DEFAULT '{}',
  max_products_per_response INTEGER DEFAULT 3,
  vision_enabled BOOLEAN DEFAULT false,
  vision_prompt TEXT DEFAULT '',
  send_product_photos BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(niche_id, bot_mode)
);

-- 3. Criar tabela niche_ai_rules
CREATE TABLE public.niche_ai_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_ai_config_id UUID NOT NULL REFERENCES public.niche_ai_configs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  rule_type TEXT NOT NULL CHECK (rule_type IN ('behavior', 'restriction', 'conditional')),
  trigger_condition TEXT DEFAULT '',
  action_prompt TEXT NOT NULL DEFAULT '',
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  custom_phrases TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Índices
CREATE INDEX idx_niche_ai_configs_niche_id ON public.niche_ai_configs(niche_id);
CREATE INDEX idx_niche_ai_rules_config_id ON public.niche_ai_rules(niche_ai_config_id);
CREATE INDEX idx_stores_niche_id ON public.stores(niche_id);

-- 5. Triggers de updated_at
CREATE OR REPLACE FUNCTION public.update_niche_ai_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_niche_ai_configs_updated_at
BEFORE UPDATE ON public.niche_ai_configs
FOR EACH ROW EXECUTE FUNCTION public.update_niche_ai_configs_updated_at();

CREATE OR REPLACE FUNCTION public.update_niche_ai_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_niche_ai_rules_updated_at
BEFORE UPDATE ON public.niche_ai_rules
FOR EACH ROW EXECUTE FUNCTION public.update_niche_ai_rules_updated_at();

-- 6. RLS
ALTER TABLE public.niche_ai_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niche_ai_rules ENABLE ROW LEVEL SECURITY;

-- niche_ai_configs: master_admin full access, store_admin read only
CREATE POLICY "Master admin full access on niche_ai_configs"
ON public.niche_ai_configs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'master_admin'))
WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Store admin can read niche_ai_configs"
ON public.niche_ai_configs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'store_admin'));

-- niche_ai_rules: master_admin full access, store_admin read only
CREATE POLICY "Master admin full access on niche_ai_rules"
ON public.niche_ai_rules
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'master_admin'))
WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Store admin can read niche_ai_rules"
ON public.niche_ai_rules
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'store_admin'));
