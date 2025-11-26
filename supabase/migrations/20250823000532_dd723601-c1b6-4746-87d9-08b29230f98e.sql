-- Allow public access to view active stores and their data
-- This enables anyone to visit store pages and see products

-- Allow public read access to active stores through public_stores view
CREATE POLICY "Public can view active stores" ON public_stores 
FOR SELECT USING (status = 'active'::store_status);

-- Allow public read access to products from active stores
DROP POLICY IF EXISTS "Anyone can view products of active stores" ON products;
CREATE POLICY "Public can view products of active stores" ON products 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = products.store_id 
    AND stores.status = 'active'::store_status
  )
  AND is_available = true
);

-- Allow public read access to categories from active stores
DROP POLICY IF EXISTS "Anyone can view categories of active stores" ON categories;
CREATE POLICY "Public can view categories of active stores" ON categories 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = categories.store_id 
    AND stores.status = 'active'::store_status
  )
  AND is_active = true
);

-- Allow public read access to product variants from active stores
DROP POLICY IF EXISTS "Anyone can view variants of available products from active stor" ON product_variants;
CREATE POLICY "Public can view product variants of active stores" ON product_variants 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products 
    JOIN stores ON products.store_id = stores.id
    WHERE products.id = product_variants.product_id 
    AND products.is_available = true 
    AND stores.status = 'active'::store_status
  )
  AND is_available = true
);

-- Allow public read access to store configurations of active stores
DROP POLICY IF EXISTS "Anyone can view store configurations of public active stores" ON store_configurations;
CREATE POLICY "Public can view store configurations of active stores" ON store_configurations 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = store_configurations.store_id 
    AND stores.status = 'active'::store_status
  )
);