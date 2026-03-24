ALTER TABLE public.store_configurations ADD COLUMN IF NOT EXISTS google_ads_id TEXT DEFAULT NULL;

DROP VIEW IF EXISTS public.public_store_config;

CREATE VIEW public.public_store_config AS
SELECT store_id,
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
    gtm_id,
    google_ads_id,
    google_analytics_id,
    facebook_pixel_id,
    created_at,
    updated_at
FROM store_configurations;