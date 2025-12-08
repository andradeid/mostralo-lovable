-- Recriar a view public_store_config para incluir custom_scripts
DROP VIEW IF EXISTS public_store_config;

CREATE VIEW public_store_config AS
SELECT 
  store_id,
  primary_color,
  secondary_color,
  product_display_layout,
  delivery_button_text,
  pickup_button_text,
  qr_code_enabled,
  delivery_times,
  delivery_zones,
  accept_outside_delivery_zone,
  custom_scripts,
  created_at,
  updated_at
FROM store_configurations;

-- Garantir acesso público à view
GRANT SELECT ON public_store_config TO anon, authenticated;