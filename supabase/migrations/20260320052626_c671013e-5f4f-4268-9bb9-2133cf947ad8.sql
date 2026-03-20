
-- Índices de performance — tabelas com alto seq scan

-- PROFESSIONALS (248K seq scans, 0 idx scans) — MAIS CRÍTICO
CREATE INDEX IF NOT EXISTS idx_professionals_store_id ON public.professionals (store_id);

-- PROFILES (2.4K seq scans)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles (user_type);

-- CATEGORIES (131 seq scans, 0 idx scans)
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON public.categories (store_id);
CREATE INDEX IF NOT EXISTS idx_categories_store_active ON public.categories (store_id, is_active);

-- WHATSAPP_PAUSED_CONTACTS (109 seq scans)
CREATE INDEX IF NOT EXISTS idx_whatsapp_paused_contacts_store_id ON public.whatsapp_paused_contacts (store_id);

-- FINANCIAL_TRANSACTIONS (relatórios financeiros com range queries)
CREATE INDEX IF NOT EXISTS idx_financial_transactions_store_date ON public.financial_transactions (store_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_store_type ON public.financial_transactions (store_id, type);
