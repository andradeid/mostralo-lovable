
INSERT INTO public.modules (name, description, key, is_active, icon)
VALUES (
  'Assistente IA WhatsApp',
  'Assistente virtual com inteligência artificial para atendimento automatizado via WhatsApp. Inclui configuração de personalidade, ferramentas e prompt.',
  'whatsapp_ai',
  true,
  'Bot'
)
ON CONFLICT DO NOTHING;
