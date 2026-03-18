
-- Inserir módulo whatsapp_connection (leve: só conexão + notificações)
INSERT INTO public.modules (name, description, key, is_active, icon)
VALUES (
  'Conexão WhatsApp',
  'Conecte seu WhatsApp para enviar notificações automáticas de agendamentos, confirmações e lembretes. Não inclui chat ou campanhas.',
  'whatsapp_connection',
  true,
  'MessageCircle'
)
ON CONFLICT DO NOTHING;

-- Inserir módulo whatsapp_chat (completo: chat, campanhas, automações, relatórios)
INSERT INTO public.modules (name, description, key, is_active, icon)
VALUES (
  'Chat WhatsApp',
  'Chat em tempo real, campanhas de recuperação, automações, contatos, relatórios e Sentinela. Requer Conexão WhatsApp ativa.',
  'whatsapp_chat',
  true,
  'MessageSquare'
)
ON CONFLICT DO NOTHING;
