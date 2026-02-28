
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
  -- 0. Criar tabelas temporárias de mapeamento (bulk)
  CREATE TEMP TABLE _cat_map AS
  SELECT id AS old_id, gen_random_uuid() AS new_id
  FROM categories WHERE store_id = p_source_store_id;

  CREATE TEMP TABLE _prod_map AS
  SELECT id AS old_id, gen_random_uuid() AS new_id
  FROM products WHERE store_id = p_source_store_id;

  CREATE TEMP TABLE _addon_cat_map AS
  SELECT id AS old_id, gen_random_uuid() AS new_id
  FROM addon_categories WHERE store_id = p_source_store_id;

  -- 1. Clonar store_configurations
  INSERT INTO store_configurations (store_id, delivery_fee, min_order_value, max_delivery_radius, 
    delivery_time_min, delivery_time_max, enable_delivery, enable_pickup, enable_table_ordering,
    timezone, currency, enable_scheduling, scheduling_days_ahead, pix_key, pix_key_type,
    pix_beneficiary_name, enable_pix_payment, enable_cash_payment, enable_card_payment,
    google_maps_link, facebook_url, instagram_url, enable_mercadopago, mercadopago_public_key,
    mercadopago_access_token, enable_whatsapp_ordering, auto_accept_orders, 
    preparation_time_min, enable_loyalty_program, loyalty_points_per_real,
    loyalty_points_redemption_value, enable_review_system)
  SELECT p_new_store_id, delivery_fee, min_order_value, max_delivery_radius,
    delivery_time_min, delivery_time_max, enable_delivery, enable_pickup, enable_table_ordering,
    timezone, currency, enable_scheduling, scheduling_days_ahead, pix_key, pix_key_type,
    pix_beneficiary_name, enable_pix_payment, enable_cash_payment, enable_card_payment,
    google_maps_link, facebook_url, instagram_url, enable_mercadopago, mercadopago_public_key,
    mercadopago_access_token, enable_whatsapp_ordering, auto_accept_orders,
    preparation_time_min, enable_loyalty_program, loyalty_points_per_real,
    loyalty_points_redemption_value, enable_review_system
  FROM store_configurations WHERE store_id = p_source_store_id;

  -- 2. Clonar categorias (BULK)
  INSERT INTO categories (id, store_id, name, description, display_order, is_active, show_in_menu)
  SELECT cm.new_id, p_new_store_id, c.name, c.description, c.display_order, c.is_active, c.show_in_menu
  FROM categories c
  JOIN _cat_map cm ON cm.old_id = c.id
  WHERE c.store_id = p_source_store_id;
  
  GET DIAGNOSTICS v_cat_count = ROW_COUNT;

  -- 3. Clonar produtos (BULK - sem loop!)
  INSERT INTO products (id, store_id, name, description, price, original_price, image_url, category_id,
    is_available, display_order, sku, barcode, stock_quantity, min_stock_alert,
    track_inventory, unit_type, weight_grams, preparation_time_minutes,
    max_quantity_per_order, is_featured, gallery_images, short_description,
    meta_title, meta_description, brand, tags)
  SELECT 
    pm.new_id, p_new_store_id, p.name, p.description, p.price, p.original_price, p.image_url,
    cm.new_id, -- category_id mapeado
    p.is_available, p.display_order, p.sku, p.barcode, p.stock_quantity, p.min_stock_alert,
    p.track_inventory, p.unit_type, p.weight_grams, p.preparation_time_minutes,
    p.max_quantity_per_order, p.is_featured, p.gallery_images, p.short_description,
    p.meta_title, p.meta_description, p.brand, p.tags
  FROM products p
  JOIN _prod_map pm ON pm.old_id = p.id
  LEFT JOIN _cat_map cm ON cm.old_id = p.category_id
  WHERE p.store_id = p_source_store_id;
  
  GET DIAGNOSTICS v_prod_count = ROW_COUNT;

  -- 4. Clonar variantes (BULK)
  INSERT INTO product_variants (product_id, name, price, original_price, sku, is_available, display_order, stock_quantity)
  SELECT 
    pm.new_id,
    pv.name, pv.price, pv.original_price, pv.sku, pv.is_available, pv.display_order, pv.stock_quantity
  FROM product_variants pv
  JOIN _prod_map pm ON pm.old_id = pv.product_id;
  
  GET DIAGNOSTICS v_var_count = ROW_COUNT;

  -- 5. Clonar addon_categories (BULK)
  INSERT INTO addon_categories (id, store_id, name, description, display_order, is_active, is_required, min_selections, max_selections)
  SELECT acm.new_id, p_new_store_id, ac.name, ac.description, ac.display_order, ac.is_active, ac.is_required, ac.min_selections, ac.max_selections
  FROM addon_categories ac
  JOIN _addon_cat_map acm ON acm.old_id = ac.id
  WHERE ac.store_id = p_source_store_id;
  
  GET DIAGNOSTICS v_addon_cat_count = ROW_COUNT;

  -- 6. Clonar addons (BULK)
  INSERT INTO addons (store_id, category_id, name, description, price, display_order, is_available)
  SELECT 
    p_new_store_id,
    acm.new_id,
    a.name, a.description, a.price, a.display_order, a.is_available
  FROM addons a
  LEFT JOIN _addon_cat_map acm ON acm.old_id = a.category_id
  WHERE a.store_id = p_source_store_id;
  
  GET DIAGNOSTICS v_addon_count = ROW_COUNT;

  -- 7. Clonar category_addon_categories (BULK)
  INSERT INTO category_addon_categories (store_id, category_id, addon_category_id)
  SELECT 
    p_new_store_id,
    cm.new_id,
    acm.new_id
  FROM category_addon_categories cac
  JOIN _cat_map cm ON cm.old_id = cac.category_id
  JOIN _addon_cat_map acm ON acm.old_id = cac.addon_category_id
  WHERE cac.store_id = p_source_store_id;

  GET DIAGNOSTICS v_cac_count = ROW_COUNT;

  -- 8. Clonar store_modules (BULK)
  INSERT INTO store_modules (store_id, module_id, is_enabled)
  SELECT p_new_store_id, sm.module_id, sm.is_enabled
  FROM store_modules sm WHERE sm.store_id = p_source_store_id;
  
  GET DIAGNOSTICS v_module_count = ROW_COUNT;

  -- Limpar tabelas temporárias
  DROP TABLE IF EXISTS _cat_map;
  DROP TABLE IF EXISTS _prod_map;
  DROP TABLE IF EXISTS _addon_cat_map;

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
