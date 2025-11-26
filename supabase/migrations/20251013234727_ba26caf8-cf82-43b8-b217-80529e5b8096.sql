-- Criar ENUMs para o sistema de pedidos
CREATE TYPE order_status AS ENUM (
  'entrada',
  'em_preparo',
  'aguarda_retirada',
  'em_transito',
  'concluido',
  'cancelado'
);

CREATE TYPE delivery_type AS ENUM ('delivery', 'pickup');
CREATE TYPE payment_method AS ENUM ('pix', 'card', 'cash');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'cancelled');

-- Tabela de pedidos
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  delivery_type delivery_type NOT NULL DEFAULT 'delivery',
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  status order_status NOT NULL DEFAULT 'entrada',
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

-- Tabela de itens do pedido
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de adicionais dos itens
CREATE TABLE public.order_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  addon_id UUID REFERENCES public.addons(id) ON DELETE SET NULL,
  addon_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_orders_store_id ON public.orders(store_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_addons_order_item_id ON public.order_addons(order_item_id);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_addons ENABLE ROW LEVEL SECURITY;

-- RLS Policies para orders
CREATE POLICY "Público pode criar pedidos"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Donos das lojas podem ver seus pedidos"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = orders.store_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Master admins podem ver todos os pedidos"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'master_admin'
    )
  );

CREATE POLICY "Donos das lojas podem atualizar seus pedidos"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = orders.store_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Master admins podem atualizar todos os pedidos"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'master_admin'
    )
  );

-- RLS Policies para order_items
CREATE POLICY "Público pode criar itens de pedido"
  ON public.order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Donos das lojas podem ver itens dos seus pedidos"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.stores ON stores.id = orders.store_id
      WHERE orders.id = order_items.order_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Master admins podem ver todos os itens"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'master_admin'
    )
  );

-- RLS Policies para order_addons
CREATE POLICY "Público pode criar adicionais de itens"
  ON public.order_addons
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Donos das lojas podem ver adicionais dos seus pedidos"
  ON public.order_addons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.order_items
      JOIN public.orders ON orders.id = order_items.order_id
      JOIN public.stores ON stores.id = orders.store_id
      WHERE order_items.id = order_addons.order_item_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Master admins podem ver todos os adicionais"
  ON public.order_addons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'master_admin'
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Realtime para a tabela orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;