-- 1. ENUMS
CREATE TYPE promotion_type AS ENUM (
  'percentage',
  'fixed_amount',
  'free_delivery',
  'bogo',
  'first_order',
  'minimum_order'
);

CREATE TYPE promotion_scope AS ENUM (
  'all_products',
  'category',
  'specific_products',
  'delivery_type'
);

CREATE TYPE promotion_status AS ENUM (
  'active',
  'scheduled',
  'paused',
  'expired'
);

-- 2. TABELA PRINCIPAL: promotions
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Informações básicas
  name TEXT NOT NULL,
  description TEXT,
  code TEXT,
  
  -- Tipo e escopo
  type promotion_type NOT NULL,
  scope promotion_scope NOT NULL,
  status promotion_status NOT NULL DEFAULT 'active',
  
  -- Configurações de desconto
  discount_percentage NUMERIC(5,2),
  discount_amount NUMERIC(10,2),
  minimum_order_value NUMERIC(10,2),
  
  -- Configurações BOGO
  bogo_buy_quantity INTEGER,
  bogo_get_quantity INTEGER,
  
  -- Aplicabilidade
  applies_to_delivery BOOLEAN DEFAULT true,
  applies_to_pickup BOOLEAN DEFAULT true,
  first_order_only BOOLEAN DEFAULT false,
  
  -- Limites
  max_uses INTEGER,
  max_uses_per_customer INTEGER,
  current_uses INTEGER DEFAULT 0,
  
  -- Período de validade
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Dias e horários permitidos
  allowed_days TEXT[],
  start_time TIME,
  end_time TIME,
  
  -- Metadados
  display_order INTEGER DEFAULT 0,
  is_visible_on_store BOOLEAN DEFAULT true,
  banner_image_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_promotions_store ON promotions(store_id);
CREATE INDEX idx_promotions_status ON promotions(status);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_code ON promotions(code) WHERE code IS NOT NULL;

-- 3. TABELA: promotion_products
CREATE TABLE promotion_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(promotion_id, product_id)
);

CREATE INDEX idx_promotion_products_promotion ON promotion_products(promotion_id);
CREATE INDEX idx_promotion_products_product ON promotion_products(product_id);

-- 4. TABELA: promotion_categories
CREATE TABLE promotion_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(promotion_id, category_id)
);

CREATE INDEX idx_promotion_categories_promotion ON promotion_categories(promotion_id);
CREATE INDEX idx_promotion_categories_category ON promotion_categories(category_id);

-- 5. TABELA: promotion_usage
CREATE TABLE promotion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  discount_applied NUMERIC(10,2) NOT NULL,
  promotion_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_promotion_usage_promotion ON promotion_usage(promotion_id);
CREATE INDEX idx_promotion_usage_order ON promotion_usage(order_id);
CREATE INDEX idx_promotion_usage_customer ON promotion_usage(customer_id);

-- 6. ATUALIZAR TABELA orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS promotion_discount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS promotion_code TEXT;

CREATE INDEX idx_orders_promotion ON orders(promotion_id);

-- 7. RLS POLICIES
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active promotions"
  ON promotions FOR SELECT
  USING (
    status = 'active' AND
    start_date <= NOW() AND
    (end_date IS NULL OR end_date >= NOW())
  );

CREATE POLICY "Store owners can manage their promotions"
  ON promotions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = promotions.store_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Master admins can manage all promotions"
  ON promotions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'master_admin'
    )
  );

-- promotion_products
ALTER TABLE promotion_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view promotion products"
  ON promotion_products FOR SELECT
  USING (true);

CREATE POLICY "Store owners can manage promotion products"
  ON promotion_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM promotions p
      JOIN stores s ON s.id = p.store_id
      WHERE p.id = promotion_products.promotion_id
      AND s.owner_id = auth.uid()
    )
  );

-- promotion_categories
ALTER TABLE promotion_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view promotion categories"
  ON promotion_categories FOR SELECT
  USING (true);

CREATE POLICY "Store owners can manage promotion categories"
  ON promotion_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM promotions p
      JOIN stores s ON s.id = p.store_id
      WHERE p.id = promotion_categories.promotion_id
      AND s.owner_id = auth.uid()
    )
  );

-- promotion_usage
ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own usage"
  ON promotion_usage FOR SELECT
  USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Store owners can view their store usage"
  ON promotion_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM promotions p
      JOIN stores s ON s.id = p.store_id
      WHERE p.id = promotion_usage.promotion_id
      AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert usage records"
  ON promotion_usage FOR INSERT
  WITH CHECK (true);

-- 8. FUNÇÃO AUXILIAR
CREATE OR REPLACE FUNCTION increment_promotion_usage(promotion_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE promotions
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = promotion_id_param;
END;
$$;