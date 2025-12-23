-- Inserir módulo SENTINELA na tabela modules
INSERT INTO modules (name, description, key, icon, is_active)
VALUES (
  'SENTINELA - Recompra Inteligente',
  'Sistema de lembretes automáticos de recompra. Analisa produtos com ciclo de consumo e envia WhatsApp quando está prestes a acabar.',
  'sentinela',
  'Target',
  true
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active;