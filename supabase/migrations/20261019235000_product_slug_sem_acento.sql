-- Slug de produto sem perder letras acentuadas (Clássico -> classico). Slugs já existentes não mudam.
CREATE OR REPLACE FUNCTION public.generate_product_slug(product_name text, input_store_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
BEGIN
    base_slug := translate(coalesce(product_name, ''),
      'áàâãäåÁÀÂÃÄÅéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑ',
      'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUcCnN');
    base_slug := lower(trim(regexp_replace(base_slug, '[^a-zA-Z0-9\s]', '', 'g')));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(base_slug, '-');
    IF base_slug = '' THEN
        base_slug := 'produto';
    END IF;
    final_slug := base_slug;
    WHILE EXISTS (
        SELECT 1 FROM products WHERE slug = final_slug AND products.store_id = input_store_id
    ) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    RETURN final_slug;
END;
$function$;
