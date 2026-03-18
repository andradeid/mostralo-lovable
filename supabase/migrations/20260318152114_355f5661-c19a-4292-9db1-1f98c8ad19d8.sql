
-- Migrar store_modules de 'whatsapp' (legado) para whatsapp_connection + whatsapp_chat
-- Lojas que tinham o módulo antigo recebem ambos os novos
INSERT INTO store_modules (store_id, module_id, is_enabled)
SELECT sm.store_id, m_new.id, sm.is_enabled
FROM store_modules sm
JOIN modules m_old ON m_old.id = sm.module_id AND m_old.key = 'whatsapp'
CROSS JOIN modules m_new
WHERE m_new.key IN ('whatsapp_connection', 'whatsapp_chat')
ON CONFLICT (store_id, module_id) DO NOTHING;

-- Migrar store_modules de 'intelligent_assistant_v2' para 'whatsapp_ai'
INSERT INTO store_modules (store_id, module_id, is_enabled)
SELECT sm.store_id, m_new.id, sm.is_enabled
FROM store_modules sm
JOIN modules m_old ON m_old.id = sm.module_id AND m_old.key = 'intelligent_assistant_v2'
CROSS JOIN modules m_new
WHERE m_new.key = 'whatsapp_ai'
ON CONFLICT (store_id, module_id) DO NOTHING;

-- Migrar plan_modules de 'whatsapp' para os novos
INSERT INTO plan_modules (plan_id, module_id)
SELECT pm.plan_id, m_new.id
FROM plan_modules pm
JOIN modules m_old ON m_old.id = pm.module_id AND m_old.key = 'whatsapp'
CROSS JOIN modules m_new
WHERE m_new.key IN ('whatsapp_connection', 'whatsapp_chat')
ON CONFLICT (plan_id, module_id) DO NOTHING;

-- Migrar plan_modules de 'intelligent_assistant_v2' para 'whatsapp_ai'
INSERT INTO plan_modules (plan_id, module_id)
SELECT pm.plan_id, m_new.id
FROM plan_modules pm
JOIN modules m_old ON m_old.id = pm.module_id AND m_old.key = 'intelligent_assistant_v2'
CROSS JOIN modules m_new
WHERE m_new.key = 'whatsapp_ai'
ON CONFLICT (plan_id, module_id) DO NOTHING;

-- Remover referências antigas de store_modules
DELETE FROM store_modules WHERE module_id IN (
  SELECT id FROM modules WHERE key IN ('whatsapp', 'intelligent_assistant_v2')
);

-- Remover referências antigas de plan_modules
DELETE FROM plan_modules WHERE module_id IN (
  SELECT id FROM modules WHERE key IN ('whatsapp', 'intelligent_assistant_v2')
);

-- Remover módulos legados
DELETE FROM modules WHERE key IN ('whatsapp', 'intelligent_assistant_v2');

-- Atualizar preços e referências dos novos módulos
UPDATE modules SET 
  suggested_price = 29.90,
  price_reference = 'Módulo leve: conexão WhatsApp + notificações automáticas (agendamentos, lembretes)',
  description = 'Conecte seu WhatsApp para enviar notificações automáticas de agendamentos, confirmações e lembretes. Módulo leve sem chat ou campanhas.'
WHERE key = 'whatsapp_connection';

UPDATE modules SET 
  suggested_price = 99.90,
  price_reference = 'Repediu ~R$ 197/mês, FidelizAI R$ 99,90/mês. Chat + campanhas + automações',
  description = 'Chat em tempo real com clientes, campanhas de recuperação, automações, contatos, relatórios e Sentinela. Requer Conexão WhatsApp.',
  dependencies = '["whatsapp_connection"]'
WHERE key = 'whatsapp_chat';

UPDATE modules SET 
  suggested_price = 197.00,
  price_reference = 'Anota AI R$ 279,99/mês, FidelizAI R$ 99,90/mês, chatbots IA R$ 150-350/mês',
  description = 'Assistente virtual com IA para WhatsApp. Responde sobre produtos, analisa fotos, envia imagens com preço e link. Usa OpenAI Assistants API.',
  dependencies = '["whatsapp_connection"]'
WHERE key = 'whatsapp_ai';

-- Atualizar whatsapp_recovery também
UPDATE modules SET
  dependencies = '["whatsapp_connection"]'
WHERE key = 'whatsapp_recovery';
