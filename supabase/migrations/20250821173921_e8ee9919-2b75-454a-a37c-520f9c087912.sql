-- Criar enum para tipos de usuário
CREATE TYPE user_type AS ENUM ('master_admin', 'store_admin');

-- Criar enum para status de planos
CREATE TYPE plan_status AS ENUM ('active', 'inactive');

-- Criar enum para status de lojas
CREATE TYPE store_status AS ENUM ('active', 'inactive', 'suspended');

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  user_type user_type NOT NULL DEFAULT 'store_admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de planos
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly
  max_products INTEGER,
  max_categories INTEGER,
  status plan_status NOT NULL DEFAULT 'active',
  features JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de módulos
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de módulos por plano
CREATE TABLE public.plan_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  UNIQUE(plan_id, module_id)
);

-- Tabela de lojas
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  phone TEXT,
  address TEXT,
  status store_status NOT NULL DEFAULT 'active',
  theme_colors JSONB DEFAULT '{}',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de categorias
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de produtos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Master admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'master_admin'
    )
  );

-- Políticas para planos (apenas master admin)
CREATE POLICY "Master admins can manage plans" ON public.plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'master_admin'
    )
  );

-- Políticas para módulos (apenas master admin)
CREATE POLICY "Master admins can manage modules" ON public.modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'master_admin'
    )
  );

-- Políticas para plan_modules (apenas master admin)
CREATE POLICY "Master admins can manage plan modules" ON public.plan_modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'master_admin'
    )
  );

-- Políticas para stores
CREATE POLICY "Store owners can manage their stores" ON public.stores
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Master admins can manage all stores" ON public.stores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'master_admin'
    )
  );

CREATE POLICY "Anyone can view active stores" ON public.stores
  FOR SELECT USING (status = 'active');

-- Políticas para categorias
CREATE POLICY "Store owners can manage their categories" ON public.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id = store_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view categories of active stores" ON public.categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id = store_id AND status = 'active'
    ) AND is_active = true
  );

-- Políticas para produtos
CREATE POLICY "Store owners can manage their products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id = store_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view products of active stores" ON public.products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id = store_id AND status = 'active'
    ) AND is_available = true
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE 
      WHEN NEW.email = 'admin@mostralo.com' THEN 'master_admin'::user_type
      ELSE 'store_admin'::user_type
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir dados iniciais
INSERT INTO public.modules (name, description, icon) VALUES
  ('Cardápio Digital', 'Gerenciar produtos e categorias do cardápio', 'Menu'),
  ('Gestão de Pedidos', 'Receber e gerenciar pedidos online', 'ShoppingCart'),
  ('Relatórios', 'Análises e relatórios de vendas', 'BarChart'),
  ('Personalização', 'Customizar cores e layout da loja', 'Palette'),
  ('WhatsApp Integration', 'Integração com WhatsApp Business', 'MessageCircle'),
  ('Delivery', 'Gestão de entrega e taxa de delivery', 'Truck');

INSERT INTO public.plans (name, description, price, max_products, max_categories, features) VALUES
  ('Básico', 'Plano ideal para pequenos negócios', 29.90, 50, 10, '{"whatsapp": false, "delivery": false, "reports": "basic"}'),
  ('Profissional', 'Plano completo para crescer seu negócio', 59.90, 200, 25, '{"whatsapp": true, "delivery": true, "reports": "advanced"}'),
  ('Premium', 'Todos os recursos para grandes operações', 99.90, 1000, 50, '{"whatsapp": true, "delivery": true, "reports": "premium", "priority_support": true}');

-- Associar módulos aos planos
INSERT INTO public.plan_modules (plan_id, module_id)
SELECT p.id, m.id FROM public.plans p, public.modules m
WHERE (p.name = 'Básico' AND m.name IN ('Cardápio Digital', 'Personalização'))
   OR (p.name = 'Profissional' AND m.name IN ('Cardápio Digital', 'Gestão de Pedidos', 'Relatórios', 'Personalização', 'WhatsApp Integration'))
   OR (p.name = 'Premium' AND m.name IN ('Cardápio Digital', 'Gestão de Pedidos', 'Relatórios', 'Personalização', 'WhatsApp Integration', 'Delivery'));