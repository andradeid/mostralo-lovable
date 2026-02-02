-- Criar módulo Assistente Inteligente v2
INSERT INTO modules (name, key, description, icon, suggested_price, price_reference, dependencies, is_active)
VALUES (
  'Assistente Inteligente v2',
  'intelligent_assistant_v2',
  'Assistente virtual com IA para WhatsApp. Responde sobre produtos, analisa receitas médicas por foto, envia imagens de produtos e consulta estoque em tempo real.',
  'Bot',
  197.00,
  'Anota AI R$ 279,99/mês, FidelizAI R$ 99,90/mês, chatbots IA R$ 150-350/mês',
  '["whatsapp"]',
  true
);

-- Liberar módulo para Farma Bella
INSERT INTO store_modules (store_id, module_id, is_enabled)
SELECT 
  'a8f04e0e-732b-4b60-acf8-a2a04b6a2382',
  id,
  true
FROM modules 
WHERE key = 'intelligent_assistant_v2';