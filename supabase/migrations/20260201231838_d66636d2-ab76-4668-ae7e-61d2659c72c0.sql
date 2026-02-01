CREATE OR REPLACE VIEW public_stores AS
SELECT 
  id, name, slug, description, logo_url, cover_url, 
  phone, address, city, state, business_hours, 
  theme_colors, status, created_at, segment
FROM stores
WHERE status = 'active' 
  AND (subscription_expires_at IS NULL OR subscription_expires_at > now());