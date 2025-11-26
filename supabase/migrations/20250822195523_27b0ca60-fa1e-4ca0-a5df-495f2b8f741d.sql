-- Adicionar colunas segment, state e city na tabela stores se não existirem
DO $$ 
BEGIN
    -- Adicionar coluna segment se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'segment') THEN
        ALTER TABLE public.stores ADD COLUMN segment text;
    END IF;
    
    -- Adicionar coluna state se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'state') THEN
        ALTER TABLE public.stores ADD COLUMN state text;
    END IF;
    
    -- Adicionar coluna city se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'city') THEN
        ALTER TABLE public.stores ADD COLUMN city text;
    END IF;
END $$;