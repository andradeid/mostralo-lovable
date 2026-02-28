
-- Tabela de perguntas configuráveis para o modo conversacional
CREATE TABLE public.store_bot_order_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'text' CHECK (question_type IN ('text', 'location', 'payment', 'options')),
  placeholder_response TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.store_bot_conversational_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  recommend_generics BOOLEAN NOT NULL DEFAULT true,
  never_send_links BOOLEAN NOT NULL DEFAULT true,
  send_product_photos BOOLEAN NOT NULL DEFAULT true,
  informal_tone BOOLEAN NOT NULL DEFAULT true,
  closing_message TEXT DEFAULT 'Obrigada! Seu pedido será preparado 🙏',
  generic_phrases JSONB NOT NULL DEFAULT '["Temos a versão genérica com o mesmo princípio ativo por um preço menor, deseja?", "Posso sugerir o genérico equivalente? O preço é bem mais acessível!", "Esse medicamento tem versão genérica disponível, quer que eu verifique?"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

ALTER TABLE public.store_bot_order_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_bot_conversational_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage order questions"
ON public.store_bot_order_questions
FOR ALL
USING (
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'master_admin')
)
WITH CHECK (
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'master_admin')
);

CREATE POLICY "Store owners can manage conversational settings"
ON public.store_bot_conversational_settings
FOR ALL
USING (
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'master_admin')
)
WITH CHECK (
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'master_admin')
);

CREATE TRIGGER update_store_bot_order_questions_updated_at
BEFORE UPDATE ON public.store_bot_order_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_bot_conversational_settings_updated_at
BEFORE UPDATE ON public.store_bot_conversational_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
