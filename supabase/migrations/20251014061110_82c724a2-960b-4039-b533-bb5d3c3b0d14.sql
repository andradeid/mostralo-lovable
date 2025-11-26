-- Adicionar campo para preferência de app de navegação
ALTER TABLE public.stores 
ADD COLUMN preferred_navigation_app text DEFAULT 'google_maps' 
CHECK (preferred_navigation_app IN ('google_maps', 'waze'));

COMMENT ON COLUMN public.stores.preferred_navigation_app IS 
'App de navegação preferido do lojista: google_maps ou waze';