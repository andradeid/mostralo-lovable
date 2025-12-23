-- Adicionar coluna boleto_view_url para armazenar o link de visualização (billet_link)
-- O boleto_pdf_url vai continuar existindo para o link direto do PDF
ALTER TABLE public.external_invoices 
ADD COLUMN IF NOT EXISTS boleto_view_url TEXT;