
-- Adicionar colunas de "nunca dizer que não tem" na tabela de configurações conversacionais
ALTER TABLE public.store_bot_conversational_settings
ADD COLUMN IF NOT EXISTS never_say_unavailable boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS unavailable_phrases jsonb NOT NULL DEFAULT '[
  "Vou verificar no nosso estoque, um momento por favor! 🔍",
  "No momento não localizei, mas posso encomendar pra você! Deseja?",
  "Deixa eu confirmar com nosso estoque. Pode aguardar um instante? 😊"
]'::jsonb;
