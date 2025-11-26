-- Fix search path security issues for the newly created functions

-- Update generate_product_slug function with secure search path
CREATE OR REPLACE FUNCTION generate_product_slug(product_name text, input_store_id uuid)
RETURNS text 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
BEGIN
    -- Generate base slug from product name
    base_slug := lower(trim(regexp_replace(product_name, '[^a-zA-Z0-9\s]', '', 'g')));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    
    -- Remove multiple dashes and trim
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(base_slug, '-');
    
    -- Ensure slug is not empty
    IF base_slug = '' THEN
        base_slug := 'produto';
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness within the store
    WHILE EXISTS (
        SELECT 1 FROM products 
        WHERE slug = final_slug 
        AND products.store_id = input_store_id
    ) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$;

-- Update auto_generate_product_slug function with secure search path
CREATE OR REPLACE FUNCTION auto_generate_product_slug()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only generate slug if it's null or empty, or if name changed
    IF NEW.slug IS NULL OR NEW.slug = '' OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name) THEN
        NEW.slug := generate_product_slug(NEW.name, NEW.store_id);
    END IF;
    
    RETURN NEW;
END;
$$;