-- Criar view pública que NÃO expõe a elevenlabs_api_key
CREATE OR REPLACE VIEW public.password_call_config_public AS
SELECT 
  id,
  store_id,
  is_enabled,
  call_type,
  template,
  show_history,
  history_count,
  highlight_duration_ms,
  sound_enabled,
  primary_color,
  audio_type,
  voice_text_template,
  elevenlabs_voice_id,
  custom_text_enabled,
  custom_text_template,
  custom_prefix,
  custom_suffix,
  use_greeting,
  store_name_in_call,
  -- Indica se o lojista tem sua própria API key, sem expor o valor
  (elevenlabs_api_key IS NOT NULL AND elevenlabs_api_key != '') AS has_own_api_key,
  created_at,
  updated_at
FROM public.password_call_config;

-- Políticas RLS para a view (herda da tabela base, mas garantimos acesso público de leitura)
GRANT SELECT ON public.password_call_config_public TO anon, authenticated;