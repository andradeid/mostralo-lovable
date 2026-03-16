-- Adicionar coluna separada para instruções manuais do lojista (Wizard)
-- O campo custom_prompt_instructions continuará guardando o prompt completo gerado
ALTER TABLE public.store_bot_config 
ADD COLUMN IF NOT EXISTS wizard_custom_instructions TEXT DEFAULT '';

-- Migrar dados existentes: se tem wizard configurado, copiar custom_prompt_instructions 
-- NÃO fazemos isso pois custom_prompt_instructions já contém o prompt completo
-- As instruções reais do wizard precisam ser re-salvas pelo usuário