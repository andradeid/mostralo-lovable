-- Adicionar colunas para armazenar dados do boleto
ALTER TABLE external_invoices
ADD COLUMN IF NOT EXISTS boleto_codigo_barras TEXT,
ADD COLUMN IF NOT EXISTS boleto_linha_digitavel TEXT,
ADD COLUMN IF NOT EXISTS boleto_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS boleto_expires_at DATE;