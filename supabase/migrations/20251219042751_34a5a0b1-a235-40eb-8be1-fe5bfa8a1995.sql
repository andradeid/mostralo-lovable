-- =============================================
-- MÓDULO: GESTÃO FINANCEIRA PARA LOJISTAS
-- =============================================

-- 1. TABELA DE CATEGORIAS FINANCEIRAS
-- Suporta categorias do sistema (globais) + personalizadas por loja
CREATE TABLE public.financial_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT 'CircleDollarSign',
  color TEXT DEFAULT '#6366f1',
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_financial_categories_store_id ON public.financial_categories(store_id);
CREATE INDEX idx_financial_categories_type ON public.financial_categories(type);
CREATE INDEX idx_financial_categories_is_system ON public.financial_categories(is_system);

-- RLS para categorias
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

-- Política: Ver categorias do sistema (is_system=true) + categorias da própria loja
CREATE POLICY "Lojistas podem ver categorias do sistema e próprias"
ON public.financial_categories FOR SELECT
USING (
  is_system = true 
  OR store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- Política: Criar apenas categorias da própria loja (não sistema)
CREATE POLICY "Lojistas podem criar categorias próprias"
ON public.financial_categories FOR INSERT
WITH CHECK (
  is_system = false
  AND (
    store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('store_admin', 'attendant'))
    OR EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
  )
);

-- Política: Editar apenas categorias próprias (não sistema)
CREATE POLICY "Lojistas podem editar categorias próprias"
ON public.financial_categories FOR UPDATE
USING (
  is_system = false
  AND (
    store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('store_admin', 'attendant'))
    OR EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
  )
);

-- Política: Deletar apenas categorias próprias (não sistema)
CREATE POLICY "Lojistas podem deletar categorias próprias"
ON public.financial_categories FOR DELETE
USING (
  is_system = false
  AND (
    store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('store_admin', 'attendant'))
    OR EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
  )
);

-- Master admin pode tudo
CREATE POLICY "Master admin acesso total categorias"
ON public.financial_categories FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'master_admin')
);

-- 2. TABELA DE TRANSAÇÕES FINANCEIRAS
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.financial_categories(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  notes TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other')),
  reference_number TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  attachment_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_financial_transactions_store_id ON public.financial_transactions(store_id);
CREATE INDEX idx_financial_transactions_category_id ON public.financial_transactions(category_id);
CREATE INDEX idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX idx_financial_transactions_date ON public.financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_order_id ON public.financial_transactions(order_id);

-- RLS para transações
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Política: Ver apenas transações da própria loja
CREATE POLICY "Lojistas podem ver transações próprias"
ON public.financial_transactions FOR SELECT
USING (
  store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- Política: Criar transações na própria loja
CREATE POLICY "Lojistas podem criar transações"
ON public.financial_transactions FOR INSERT
WITH CHECK (
  store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('store_admin', 'attendant'))
  OR EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- Política: Editar transações da própria loja
CREATE POLICY "Lojistas podem editar transações próprias"
ON public.financial_transactions FOR UPDATE
USING (
  store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('store_admin', 'attendant'))
  OR EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- Política: Deletar transações da própria loja
CREATE POLICY "Lojistas podem deletar transações próprias"
ON public.financial_transactions FOR DELETE
USING (
  store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('store_admin', 'attendant'))
  OR EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- Master admin pode tudo
CREATE POLICY "Master admin acesso total transações"
ON public.financial_transactions FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'master_admin')
);

-- 3. TRIGGER PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION public.update_financial_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_financial_categories_timestamp
BEFORE UPDATE ON public.financial_categories
FOR EACH ROW EXECUTE FUNCTION public.update_financial_categories_updated_at();

CREATE OR REPLACE FUNCTION public.update_financial_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_financial_transactions_timestamp
BEFORE UPDATE ON public.financial_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_financial_transactions_updated_at();

-- 4. SEED: CATEGORIAS PADRÃO DO SISTEMA (is_system = true, store_id = NULL)
-- RECEITAS (3 categorias)
INSERT INTO public.financial_categories (name, type, icon, color, description, is_system, store_id) VALUES
('Vendas', 'income', 'ShoppingCart', '#22c55e', 'Receitas de vendas de produtos', true, NULL),
('Serviços', 'income', 'Wrench', '#3b82f6', 'Receitas de prestação de serviços', true, NULL),
('Outras Receitas', 'income', 'Plus', '#8b5cf6', 'Outras entradas de dinheiro', true, NULL);

-- DESPESAS (13 categorias)
INSERT INTO public.financial_categories (name, type, icon, color, description, is_system, store_id) VALUES
('Fornecedores', 'expense', 'Truck', '#ef4444', 'Pagamentos a fornecedores', true, NULL),
('Aluguel', 'expense', 'Home', '#f97316', 'Aluguel do estabelecimento', true, NULL),
('Energia Elétrica', 'expense', 'Zap', '#eab308', 'Conta de luz', true, NULL),
('Água', 'expense', 'Droplet', '#06b6d4', 'Conta de água', true, NULL),
('Internet/Telefone', 'expense', 'Wifi', '#6366f1', 'Internet e telefonia', true, NULL),
('Salários', 'expense', 'Users', '#ec4899', 'Pagamento de funcionários', true, NULL),
('Impostos', 'expense', 'Receipt', '#f43f5e', 'Impostos e taxas governamentais', true, NULL),
('Marketing', 'expense', 'Megaphone', '#a855f7', 'Publicidade e marketing', true, NULL),
('Manutenção', 'expense', 'Wrench', '#14b8a6', 'Manutenção de equipamentos', true, NULL),
('Transporte', 'expense', 'Car', '#0ea5e9', 'Combustível e transporte', true, NULL),
('Taxas Bancárias', 'expense', 'CreditCard', '#64748b', 'Tarifas e taxas bancárias', true, NULL),
('Material de Escritório', 'expense', 'FileText', '#78716c', 'Papelaria e material de escritório', true, NULL),
('Outras Despesas', 'expense', 'Minus', '#94a3b8', 'Outras saídas de dinheiro', true, NULL);

-- 5. INSERIR MÓDULO financial_management
INSERT INTO public.modules (name, key, description, icon, is_active) VALUES
('Gestão Financeira', 'financial_management', 'Controle de receitas, despesas e fluxo de caixa da loja', 'Wallet', true)
ON CONFLICT DO NOTHING;