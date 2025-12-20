-- Adicionar colunas para configuração de links WhatsApp por nicho
ALTER TABLE master_whatsapp_config 
ADD COLUMN IF NOT EXISTS fallback_phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_messages JSONB DEFAULT '{
  "default": "Olá! Gostaria de saber mais sobre o Mostralo",
  "suplementos_landing": "Olá! Quero uma simulação de economia para minha loja de suplementos",
  "suplementos_guia": "Olá! Vi o guia completo e quero saber mais sobre o Mostralo para suplementos",
  "supermercados": "Olá! Tenho um supermercado e quero saber mais sobre o Mostralo",
  "farmacias": "Olá! Tenho uma farmácia e gostaria de conhecer o Mostralo",
  "acougues": "Olá! Tenho um açougue e quero saber mais sobre o Mostralo",
  "feirantes": "Oi! Sou lojista de feira e quero saber mais sobre o Mostralo",
  "lojistas": "Olá! Tenho uma loja física e quero criar minha loja online com o Mostralo",
  "biomundo": "Olá! Sou da Bio Mundo e gostaria de agendar uma apresentação do Mostralo"
}'::jsonb;

COMMENT ON COLUMN master_whatsapp_config.fallback_phone IS 'Número de telefone de fallback quando a instância WhatsApp não está conectada';
COMMENT ON COLUMN master_whatsapp_config.whatsapp_messages IS 'Mensagens personalizadas por nicho/página para links de WhatsApp';