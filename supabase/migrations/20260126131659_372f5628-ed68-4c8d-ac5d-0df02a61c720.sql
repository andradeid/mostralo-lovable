-- Tabela de logs de importação de produtos
CREATE TABLE public.product_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  imported_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX idx_product_import_logs_store_id ON product_import_logs(store_id);
CREATE INDEX idx_product_import_logs_created_at ON product_import_logs(created_at DESC);

-- RLS: apenas store_admin da loja pode ver seus logs
ALTER TABLE product_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their import logs"
ON product_import_logs FOR SELECT
USING (
  is_store_owner_direct(store_id, auth.uid())
  OR has_role(auth.uid(), 'master_admin'::app_role)
);

CREATE POLICY "Store owners can insert import logs"
ON product_import_logs FOR INSERT
WITH CHECK (
  is_store_owner_direct(store_id, auth.uid())
  OR has_role(auth.uid(), 'master_admin'::app_role)
);

-- Registrar o módulo de importação de produtos
INSERT INTO modules (key, name, description, is_active)
VALUES (
  'product_import',
  'Importação de Produtos',
  'Importação em massa de produtos via planilha CSV/Excel',
  true
)
ON CONFLICT (key) DO NOTHING;