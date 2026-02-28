
-- Função SQL para clonar produtos em massa (executa no PostgreSQL, sem limite de CPU)
CREATE OR REPLACE FUNCTION public.clone_store_data(
  p_source_store_id UUID,
  p_new_store_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_map JSONB := '{}';
  v_product_map JSONB := '{}';
  v_addon_cat_map JSONB := '{}';
  v_old_id UUID;
  v_new_id UUID;
  v_stats JSON;
  v_cat_count INT := 0;
  v_prod_count INT := 0;
  v_var_count INT := 0;
  v_addon_cat_count INT := 0;
  v_addon_count INT := 0;
  v_module_count INT := 0;
  rec RECORD;
BEGIN
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

  -- 2. Clonar categorias com mapeamento
  FOR rec IN 
    SELECT id, name, description, display_order, is_active, show_in_menu
    FROM categories WHERE store_id = p_source_store_id ORDER BY display_order
  LOOP
    INSERT INTO categories (store_id, name, description, display_order, is_active, show_in_menu)
    VALUES (p_new_store_id, rec.name, rec.description, rec.display_order, rec.is_active, rec.show_in_menu)
    RETURNING id INTO v_new_id;
    
    v_category_map := v_category_map || jsonb_build_object(rec.id::text, v_new_id::text);
    v_cat_count := v_cat_count + 1;
  END LOOP;

  -- 3. Clonar produtos com mapeamento (bulk - sem round trips)
  FOR rec IN
    SELECT id, name, description, price, original_price, image_url, category_id,
      is_available, display_order, sku, barcode, stock_quantity, min_stock_alert,
      track_inventory, unit_type, weight_grams, preparation_time_minutes,
      max_quantity_per_order, is_featured, gallery_images, short_description,
      meta_title, meta_description, brand, tags
    FROM products WHERE store_id = p_source_store_id ORDER BY display_order
  LOOP
    INSERT INTO products (
      store_id, name, description, price, original_price, image_url, category_id,
      is_available, display_order, sku, barcode, stock_quantity, min_stock_alert,
      track_inventory, unit_type, weight_grams, preparation_time_minutes,
      max_quantity_per_order, is_featured, gallery_images, short_description,
      meta_title, meta_description, brand, tags
    ) VALUES (
      p_new_store_id, rec.name, rec.description, rec.price, rec.original_price, rec.image_url,
      CASE WHEN rec.category_id IS NOT NULL THEN (v_category_map->>rec.category_id::text)::UUID ELSE NULL END,
      rec.is_available, rec.display_order, rec.sku, rec.barcode, rec.stock_quantity, rec.min_stock_alert,
      rec.track_inventory, rec.unit_type, rec.weight_grams, rec.preparation_time_minutes,
      rec.max_quantity_per_order, rec.is_featured, rec.gallery_images, rec.short_description,
      rec.meta_title, rec.meta_description, rec.brand, rec.tags
    ) RETURNING id INTO v_new_id;
    
    v_product_map := v_product_map || jsonb_build_object(rec.id::text, v_new_id::text);
    v_prod_count := v_prod_count + 1;
  END LOOP;

  -- 4. Clonar variantes
  INSERT INTO product_variants (product_id, name, price, original_price, sku, is_available, display_order, stock_quantity)
  SELECT 
    (v_product_map->>pv.product_id::text)::UUID,
    pv.name, pv.price, pv.original_price, pv.sku, pv.is_available, pv.display_order, pv.stock_quantity
  FROM product_variants pv
  WHERE pv.product_id IN (SELECT (key)::UUID FROM jsonb_each_text(v_product_map));
  
  GET DIAGNOSTICS v_var_count = ROW_COUNT;

  -- 5. Clonar addon_categories
  FOR rec IN
    SELECT id, name, description, display_order, is_active, is_required, min_selections, max_selections
    FROM addon_categories WHERE store_id = p_source_store_id
  LOOP
    INSERT INTO addon_categories (store_id, name, description, display_order, is_active, is_required, min_selections, max_selections)
    VALUES (p_new_store_id, rec.name, rec.description, rec.display_order, rec.is_active, rec.is_required, rec.min_selections, rec.max_selections)
    RETURNING id INTO v_new_id;
    
    v_addon_cat_map := v_addon_cat_map || jsonb_build_object(rec.id::text, v_new_id::text);
    v_addon_cat_count := v_addon_cat_count + 1;
  END LOOP;

  -- 6. Clonar addons
  INSERT INTO addons (store_id, category_id, name, description, price, display_order, is_available)
  SELECT 
    p_new_store_id,
    CASE WHEN a.category_id IS NOT NULL THEN (v_addon_cat_map->>a.category_id::text)::UUID ELSE NULL END,
    a.name, a.description, a.price, a.display_order, a.is_available
  FROM addons a WHERE a.store_id = p_source_store_id;
  
  GET DIAGNOSTICS v_addon_count = ROW_COUNT;

  -- 7. Clonar category_addon_categories
  INSERT INTO category_addon_categories (store_id, category_id, addon_category_id)
  SELECT 
    p_new_store_id,
    (v_category_map->>cac.category_id::text)::UUID,
    (v_addon_cat_map->>cac.addon_category_id::text)::UUID
  FROM category_addon_categories cac
  WHERE cac.store_id = p_source_store_id
    AND v_category_map ? cac.category_id::text
    AND v_addon_cat_map ? cac.addon_category_id::text;

  -- 8. Clonar store_modules
  INSERT INTO store_modules (store_id, module_id, is_enabled)
  SELECT p_new_store_id, sm.module_id, sm.is_enabled
  FROM store_modules sm WHERE sm.store_id = p_source_store_id;
  
  GET DIAGNOSTICS v_module_count = ROW_COUNT;

  v_stats := json_build_object(
    'categories', v_cat_count,
    'products', v_prod_count,
    'variants', v_var_count,
    'addon_categories', v_addon_cat_count,
    'addons', v_addon_count,
    'modules', v_module_count
  );

  RETURN v_stats;
END;
$$;
