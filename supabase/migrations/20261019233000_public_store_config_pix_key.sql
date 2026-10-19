-- Chave Pix da loja (Pix manual) visível para o cliente no checkout.
create or replace view public.public_store_config as
 SELECT store_id, primary_color, secondary_color, product_display_layout, delivery_button_text, pickup_button_text,
    qr_code_enabled, delivery_times, delivery_zones, accept_outside_delivery_zone, custom_scripts, gtm_id,
    google_ads_id, google_analytics_id, facebook_pixel_id, created_at, updated_at,
    nullif(btrim(pix_key), '') as pix_key
   FROM store_configurations;
revoke insert, update, delete, truncate on public.public_store_config from anon, authenticated;
grant select on public.public_store_config to anon, authenticated;
