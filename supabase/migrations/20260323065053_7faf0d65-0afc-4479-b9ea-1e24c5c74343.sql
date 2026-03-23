
INSERT INTO public.modules (key, name, description, is_active)
VALUES (
  'commercial_analysis',
  'Análise Comercial',
  'Análise inteligente de conversas WhatsApp para identificar intenção de compra, fechamentos e faturamento invisível',
  true
) ON CONFLICT (key) DO NOTHING;
