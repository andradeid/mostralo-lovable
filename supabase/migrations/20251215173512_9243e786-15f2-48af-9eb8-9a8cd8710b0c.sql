-- Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('salesperson-invoices', 'salesperson-invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para vendedores fazerem upload de suas próprias notas fiscais
CREATE POLICY "Salespeople can upload their own invoices"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'salesperson-invoices' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.salespeople 
    WHERE user_id = auth.uid() 
    AND id::text = (storage.foldername(name))[1]
  )
);

-- Policy para vendedores visualizarem suas próprias notas
CREATE POLICY "Salespeople can view their own invoices"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'salesperson-invoices'
  AND (
    -- Vendedor vê suas próprias notas
    EXISTS (
      SELECT 1 FROM public.salespeople 
      WHERE user_id = auth.uid() 
      AND id::text = (storage.foldername(name))[1]
    )
    -- Ou é master admin
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_type = 'master_admin'
    )
  )
);

-- Policy para master admin ver todas as notas
CREATE POLICY "Master admin can view all invoices"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'salesperson-invoices'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'master_admin'
  )
);