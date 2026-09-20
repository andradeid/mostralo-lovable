ALTER TABLE public.stores ADD COLUMN billing_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.stores.billing_enabled IS 'Define se a loja recebe cobrança automática de assinatura (generate-monthly-invoices).';