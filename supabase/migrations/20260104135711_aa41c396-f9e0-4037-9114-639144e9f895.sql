-- =============================================
-- PARTE 1: Sistema de Favoritos
-- =============================================

-- Tabela de tutoriais favoritos
CREATE TABLE public.tutorial_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tutorial_id)
);

-- RLS para favoritos
ALTER TABLE public.tutorial_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
ON public.tutorial_favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add own favorites"
ON public.tutorial_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
ON public.tutorial_favorites FOR DELETE
USING (auth.uid() = user_id);

-- Índice para performance
CREATE INDEX idx_tutorial_favorites_user ON public.tutorial_favorites(user_id);
CREATE INDEX idx_tutorial_favorites_tutorial ON public.tutorial_favorites(tutorial_id);

-- =============================================
-- PARTE 2: Sistema de Inscrição em Categorias
-- =============================================

-- Tabela de inscrições em categorias
CREATE TABLE public.tutorial_category_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.tutorial_categories(id) ON DELETE CASCADE,
  notify_in_app BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- RLS para inscrições
ALTER TABLE public.tutorial_category_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
ON public.tutorial_category_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add own subscriptions"
ON public.tutorial_category_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own subscriptions"
ON public.tutorial_category_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_category_subscriptions_user ON public.tutorial_category_subscriptions(user_id);
CREATE INDEX idx_category_subscriptions_category ON public.tutorial_category_subscriptions(category_id);

-- =============================================
-- PARTE 3: Sistema de Notificações
-- =============================================

-- Tabela de notificações de tutoriais
CREATE TABLE public.tutorial_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.tutorial_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para notificações
ALTER TABLE public.tutorial_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.tutorial_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.tutorial_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
ON public.tutorial_notifications FOR DELETE
USING (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_tutorial_notifications_user ON public.tutorial_notifications(user_id);
CREATE INDEX idx_tutorial_notifications_unread ON public.tutorial_notifications(user_id, is_read) WHERE is_read = false;

-- =============================================
-- PARTE 4: Trigger para Notificações Automáticas
-- =============================================

-- Função que cria notificações quando novo tutorial é inserido
CREATE OR REPLACE FUNCTION public.notify_tutorial_subscribers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só cria notificações se o tutorial estiver ativo
  IF NEW.is_active = true THEN
    INSERT INTO public.tutorial_notifications (user_id, tutorial_id, category_id, title, message)
    SELECT 
      s.user_id,
      NEW.id,
      NEW.category_id,
      'Novo tutorial disponível!',
      'O tutorial "' || NEW.title || '" foi adicionado.'
    FROM public.tutorial_category_subscriptions s
    WHERE s.category_id = NEW.category_id
      AND s.notify_in_app = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para novos tutoriais
CREATE TRIGGER on_tutorial_created
AFTER INSERT ON public.tutorials
FOR EACH ROW
EXECUTE FUNCTION public.notify_tutorial_subscribers();