CREATE OR REPLACE FUNCTION public.clone_store_data(p_source_store_id uuid, p_new_store_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_stats JSON;
  v_cat_count INT := 0;
  v_prod_count INT := 0;
  v_var_count INT := 0;
  v_addon_cat_count INT := 0;
  v_addon_count INT := 0;
  v_module_count INT := 0;
  v_cac_count INT := 0;
BEGIN
  -- Limpeza defensiva para reuso da mesma sessão
  DROP TABLE IF EXISTS _cat_map;
  DROP TABLE IF EXISTS _prod_map;
  DROP TABLE IF EXISTS _addon_cat_map;

  -- 0. Mapeamentos (bulk)
  CREATE TEMP TABLE _cat_map ON COMMIT DROP AS
  SELECT id AS old_id, gen_random_uuid() AS new_id
  FROM categories
  WHERE store_id = p_source_store_id;

  CREATE TEMP TABLE _prod_map ON COMMIT DROP AS
  SELECT id AS old_id, gen_random_uuid() AS new_id
  FROM products
  WHERE store_id = p_source_store_id;

  CREATE TEMP TABLE _addon_cat_map ON COMMIT DROP AS
  SELECT id AS old_id, gen_random_uuid() AS new_id
  FROM addon_categories
  WHERE store_id = p_source_store_id;

  -- 1. store_configurations (schema atual)
  INSERT INTO store_configurations (
    store_id,
    primary_color,
    secondary_color,
    product_display_layout,
    online_payment_enabled,
    pix_key,
    mercado_pago_token,
    stripe_config,
    delivery_zones,
    delivery_times,
    qr_code_enabled,
    qr_code_url,
    social_media,
    google_analytics_id,
    facebook_pixel_id,
    delivery_button_text,
    pickup_button_text,
    accept_outside_delivery_zone,
    custom_scripts
  )
  SELECT
    p_new_store_id,
    sc.primary_color,
    sc.secondary_color,
    sc.product_display_layout,
    sc.online_payment_enabled,
    sc.pix_key,
    sc.mercado_pago_token,
    sc.stripe_config,
    sc.delivery_zones,
    sc.delivery_times,
    sc.qr_code_enabled,
    sc.qr_code_url,
    sc.social_media,
    sc.google_analytics_id,
    sc.facebook_pixel_id,
    sc.delivery_button_text,
    sc.pickup_button_text,
    sc.accept_outside_delivery_zone,
    sc.custom_scripts
  FROM store_configurations sc
  WHERE sc.store_id = p_source_store_id;

  -- 2. categories
  INSERT INTO categories (
    id, store_id, name, description, display_order, is_active, show_in_menu
  )
  SELECT
    cm.new_id, p_new_store_id, c.name, c.description, c.display_order, c.is_active, c.show_in_menu
  FROM categories c
  JOIN _cat_map cm ON cm.old_id = c.id
  WHERE c.store_id = p_source_store_id;
  GET DIAGNOSTICS v_cat_count = ROW_COUNT;

  -- 3. products (schema atual, bulk)
  INSERT INTO products (
    id,
    store_id,
    category_id,
    name,
    description,
    price,
    image_url,
    is_available,
    display_order,
    button_text,
    image_gallery,
    slug,
    is_on_offer,
    original_price,
    offer_price,
    recurrence_days,
    show_in_menu,
    track_stock,
    stock_quantity,
    stock_alert_threshold,
    is_featured
  )
  SELECT
    pm.new_id,
    p_new_store_id,
    cm.new_id,
    p.name,
    p.description,
    p.price,
    p.image_url,
    p.is_available,
    p.display_order,
    p.button_text,
    p.image_gallery,
    p.slug,
    p.is_on_offer,
    p.original_price,
    p.offer_price,
    p.recurrence_days,
    p.show_in_menu,
    p.track_stock,
    p.stock_quantity,
    p.stock_alert_threshold,
    p.is_featured
  FROM products p
  JOIN _prod_map pm ON pm.old_id = p.id
  LEFT JOIN _cat_map cm ON cm.old_id = p.category_id
  WHERE p.store_id = p_source_store_id;
  GET DIAGNOSTICS v_prod_count = ROW_COUNT;

  -- 4. product_variants (schema atual)
  INSERT INTO product_variants (
    product_id,
    name,
    description,
    price,
    is_default,
    display_order,
    is_available,
    track_stock,
    stock_quantity
  )
  SELECT
    pm.new_id,
    pv.name,
    pv.description,
    pv.price,
    pv.is_default,
    pv.display_order,
    pv.is_available,
    pv.track_stock,
    pv.stock_quantity
  FROM product_variants pv
  JOIN _prod_map pm ON pm.old_id = pv.product_id;
  GET DIAGNOSTICS v_var_count = ROW_COUNT;

  -- 5. addon_categories
  INSERT INTO addon_categories (
    id, store_id, name, description, display_order, is_active, is_required, min_selections, max_selections
  )
  SELECT
    acm.new_id, p_new_store_id, ac.name, ac.description, ac.display_order, ac.is_active, ac.is_required, ac.min_selections, ac.max_selections
  FROM addon_categories ac
  JOIN _addon_cat_map acm ON acm.old_id = ac.id
  WHERE ac.store_id = p_source_store_id;
  GET DIAGNOSTICS v_addon_cat_count = ROW_COUNT;

  -- 6. addons
  INSERT INTO addons (
    store_id, category_id, name, description, price, display_order, is_available
  )
  SELECT
    p_new_store_id,
    acm.new_id,
    a.name,
    a.description,
    a.price,
    a.display_order,
    a.is_available
  FROM addons a
  LEFT JOIN _addon_cat_map acm ON acm.old_id = a.category_id
  WHERE a.store_id = p_source_store_id;
  GET DIAGNOSTICS v_addon_count = ROW_COUNT;

  -- 7. category_addon_categories
  INSERT INTO category_addon_categories (
    store_id, category_id, addon_category_id
  )
  SELECT
    p_new_store_id,
    cm.new_id,
    acm.new_id
  FROM category_addon_categories cac
  JOIN _cat_map cm ON cm.old_id = cac.category_id
  JOIN _addon_cat_map acm ON acm.old_id = cac.addon_category_id
  WHERE cac.store_id = p_source_store_id;
  GET DIAGNOSTICS v_cac_count = ROW_COUNT;

  -- 8. store_modules
  INSERT INTO store_modules (
    store_id, module_id, is_enabled
  )
  SELECT
    p_new_store_id, sm.module_id, sm.is_enabled
  FROM store_modules sm
  WHERE sm.store_id = p_source_store_id;
  GET DIAGNOSTICS v_module_count = ROW_COUNT;

  v_stats := json_build_object(
    'categories', v_cat_count,
    'products', v_prod_count,
    'variants', v_var_count,
    'addon_categories', v_addon_cat_count,
    'addons', v_addon_count,
    'modules', v_module_count,
    'category_addon_links', v_cac_count
  );

  RETURN v_stats;
END;
$function$;