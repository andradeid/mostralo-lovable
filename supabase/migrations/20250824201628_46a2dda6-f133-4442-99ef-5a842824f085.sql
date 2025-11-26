-- Add slug field to products table for SEO-friendly URLs
ALTER TABLE public.products 
ADD COLUMN slug text;

-- Create index for slug field for better performance
CREATE INDEX idx_products_slug ON public.products(slug);

-- Create function to generate unique slug for products
CREATE OR REPLACE FUNCTION generate_product_slug(product_name text, store_id uuid)
RETURNS text AS $$
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
        AND store_id = generate_product_slug.store_id
    ) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate slug on insert/update
CREATE OR REPLACE FUNCTION auto_generate_product_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate slug if it's null or empty, or if name changed
    IF NEW.slug IS NULL OR NEW.slug = '' OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name) THEN
        NEW.slug := generate_product_slug(NEW.name, NEW.store_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_auto_generate_product_slug
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_product_slug();

-- Generate slugs for existing products
UPDATE public.products 
SET slug = generate_product_slug(name, store_id)
WHERE slug IS NULL OR slug = '';