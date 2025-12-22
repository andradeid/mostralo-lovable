-- Adicionar campos de configuração de áudio à tabela password_call_config
ALTER TABLE password_call_config 
ADD COLUMN IF NOT EXISTS audio_type TEXT DEFAULT 'beep',
ADD COLUMN IF NOT EXISTS voice_text_template TEXT DEFAULT 'simple',
ADD COLUMN IF NOT EXISTS elevenlabs_voice_id TEXT,
ADD COLUMN IF NOT EXISTS elevenlabs_api_key TEXT;

-- Comentários para documentação
COMMENT ON COLUMN password_call_config.audio_type IS 'Tipo de áudio: beep, web_speech, elevenlabs';
COMMENT ON COLUMN password_call_config.voice_text_template IS 'Template do texto: simple, counter, pickup';
COMMENT ON COLUMN password_call_config.elevenlabs_voice_id IS 'ID da voz ElevenLabs';
COMMENT ON COLUMN password_call_config.elevenlabs_api_key IS 'API key do ElevenLabs (armazenada por loja)';