
ALTER TABLE store_bot_config 
  ADD COLUMN IF NOT EXISTS assistant_type text DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS enabled_tools jsonb DEFAULT '["search_products", "check_stock", "get_product_details", "list_categories", "get_promotions", "check_store_status", "get_store_info"]',
  ADD COLUMN IF NOT EXISTS enabled_rules jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS assistant_identity jsonb DEFAULT '{}';

COMMENT ON COLUMN store_bot_config.assistant_type IS 'Tipo: triage, sales, support, custom';
COMMENT ON COLUMN store_bot_config.enabled_tools IS 'Array de tools habilitadas: search_products, check_stock, etc.';
COMMENT ON COLUMN store_bot_config.enabled_rules IS 'Regras: block_prices, block_photos, allow_upsell, suggest_generic, ask_specification, suggest_store_link, require_prescription_check';
COMMENT ON COLUMN store_bot_config.assistant_identity IS 'Identidade: name, personality, emoji_level, greeting';
