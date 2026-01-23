-- Financeiro do Sistema (plataforma)

-- 1) Helper: updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2) Categorias do sistema
CREATE TABLE IF NOT EXISTS public.system_financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT NULL,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sys_fin_cat_type_active
  ON public.system_financial_categories (type, is_active);

CREATE TRIGGER trg_sys_fin_cat_updated_at
BEFORE UPDATE ON public.system_financial_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Transações do sistema
CREATE TABLE IF NOT EXISTS public.system_financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NULL REFERENCES public.system_financial_categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  notes TEXT NULL,
  vendor TEXT NULL,
  payment_method TEXT NULL,
  reference_number TEXT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_type TEXT NULL CHECK (recurrence_type IN ('monthly', 'yearly')),
  attachment_url TEXT NULL,
  created_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sys_fin_tx_date
  ON public.system_financial_transactions (transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_sys_fin_tx_type_date
  ON public.system_financial_transactions (type, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_sys_fin_tx_category
  ON public.system_financial_transactions (category_id);

CREATE INDEX IF NOT EXISTS idx_sys_fin_tx_vendor
  ON public.system_financial_transactions (vendor);

CREATE TRIGGER trg_sys_fin_tx_updated_at
BEFORE UPDATE ON public.system_financial_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4) RLS
ALTER TABLE public.system_financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_financial_transactions ENABLE ROW LEVEL SECURITY;

-- Restrição: somente master_admin
CREATE POLICY "Master admin can read system financial categories"
ON public.system_financial_categories
FOR SELECT
USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admin can insert system financial categories"
ON public.system_financial_categories
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admin can update system financial categories"
ON public.system_financial_categories
FOR UPDATE
USING (public.has_role(auth.uid(), 'master_admin'))
WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admin can delete system financial categories"
ON public.system_financial_categories
FOR DELETE
USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admin can read system financial transactions"
ON public.system_financial_transactions
FOR SELECT
USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admin can insert system financial transactions"
ON public.system_financial_transactions
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admin can update system financial transactions"
ON public.system_financial_transactions
FOR UPDATE
USING (public.has_role(auth.uid(), 'master_admin'))
WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admin can delete system financial transactions"
ON public.system_financial_transactions
FOR DELETE
USING (public.has_role(auth.uid(), 'master_admin'));

-- 5) Seed opcional: categorias padrão (somente se não houver nenhuma)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.system_financial_categories) THEN
    INSERT INTO public.system_financial_categories (name, type, description)
    VALUES
      ('Setup', 'income', 'Receitas de setup e implantação'),
      ('Assinaturas (manual)', 'income', 'Receitas lançadas manualmente (se necessário)'),
      ('Infra (VPS)', 'expense', 'Custos de servidor/VPS'),
      ('Supabase', 'expense', 'Custos Supabase (DB/Auth/Storage/Edge)'),
      ('Ferramentas', 'expense', 'Ferramentas e SaaS do sistema'),
      ('Marketing', 'expense', 'Investimentos em marketing'),
      ('Impostos', 'expense', 'Impostos e taxas');
  END IF;
END $$;