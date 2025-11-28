-- Adicionar 'salesperson' ao enum app_role se ainda não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'salesperson' AND enumtypid = 'public.app_role'::regtype) THEN
        ALTER TYPE public.app_role ADD VALUE 'salesperson';
    END IF;
END $$;

-- Verificar se a tabela já existe antes de criar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'salesperson_contracts') THEN
        CREATE TABLE public.salesperson_contracts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE,
          contract_version TEXT NOT NULL DEFAULT '1.0',
          accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          ip_address TEXT,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Habilitar RLS
        ALTER TABLE public.salesperson_contracts ENABLE ROW LEVEL SECURITY;

        -- Policy: Vendedores podem ver seus próprios contratos
        CREATE POLICY "Salesperson can view own contracts"
          ON public.salesperson_contracts
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM public.salespeople
              WHERE salespeople.id = salesperson_contracts.salesperson_id
                AND salespeople.user_id = auth.uid()
            )
          );

        -- Policy: Sistema pode inserir contratos
        CREATE POLICY "System can insert contracts"
          ON public.salesperson_contracts
          FOR INSERT
          WITH CHECK (true);

        -- Policy: Master admin pode ver todos os contratos
        CREATE POLICY "Master admin can view all contracts"
          ON public.salesperson_contracts
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM public.profiles
              WHERE profiles.id = auth.uid()
                AND profiles.user_type = 'master_admin'
            )
          );

        -- Criar índices para performance
        CREATE INDEX idx_salesperson_contracts_salesperson_id 
          ON public.salesperson_contracts(salesperson_id);
    END IF;
END $$;