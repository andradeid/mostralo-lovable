-- Dropar a view existente e recriá-la com o campo accept_outside_delivery_zone
DROP VIEW IF EXISTS public_store_config;

CREATE VIEW public_store_config AS
SELECT 
  sc.store_id,
  sc.primary_color,
  sc.secondary_color,
  sc.product_display_layout,
  sc.delivery_button_text,
  sc.pickup_button_text,
  sc.qr_code_enabled,
  sc.delivery_times,
  sc.delivery_zones,
  sc.accept_outside_delivery_zone,
  sc.created_at,
  sc.updated_at
FROM store_configurations sc
JOIN stores s ON s.id = sc.store_id
WHERE s.status = 'active';