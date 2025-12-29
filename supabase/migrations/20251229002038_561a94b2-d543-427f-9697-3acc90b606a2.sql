-- =====================================================
-- INTEGRAÇÃO COMPLETA DE RECEITAS AO SISTEMA FINANCEIRO
-- =====================================================

-- 1. CRIAR CATEGORIAS FINANCEIRAS ESPECÍFICAS
-- =====================================================

-- Categoria: Vendas PDV (comandas de balcão)
INSERT INTO financial_categories (name, type, icon, color, is_system, description, display_order, is_active)
VALUES ('Vendas PDV', 'income', 'Store', '#22c55e', true, 'Receitas de vendas do PDV/Balcão', 2, true)
ON CONFLICT DO NOTHING;

-- Categoria: Vendas Mesa (comandas de mesa)
INSERT INTO financial_categories (name, type, icon, color, is_system, description, display_order, is_active)
VALUES ('Vendas Mesa', 'income', 'UtensilsCrossed', '#3b82f6', true, 'Receitas de vendas em mesas', 3, true)
ON CONFLICT DO NOTHING;

-- Categoria: Agendamentos (bookings)
INSERT INTO financial_categories (name, type, icon, color, is_system, description, display_order, is_active)
VALUES ('Agendamentos', 'income', 'Calendar', '#8b5cf6', true, 'Receitas de serviços agendados', 4, true)
ON CONFLICT DO NOTHING;

-- 2. ADICIONAR COLUNAS DE REFERÊNCIA
-- =====================================================

ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS comanda_id UUID REFERENCES comandas(id) ON DELETE SET NULL;

ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_comanda_id 
ON financial_transactions(comanda_id) WHERE comanda_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_booking_id 
ON financial_transactions(booking_id) WHERE booking_id IS NOT NULL;

-- 3. FUNÇÃO E TRIGGER PARA COMANDAS FECHADAS
-- =====================================================

CREATE OR REPLACE FUNCTION create_income_from_closed_comanda()
RETURNS TRIGGER AS $$
DECLARE
    v_category_id UUID;
    v_exists BOOLEAN;
    v_payment_method TEXT;
    v_category_name TEXT;
BEGIN
    -- Só executa se o status mudou para 'closed'
    IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status != 'closed') THEN
        
        -- Verificar se já existe transação para esta comanda
        SELECT EXISTS(
            SELECT 1 FROM financial_transactions 
            WHERE comanda_id = NEW.id
            AND type = 'income'
        ) INTO v_exists;
        
        IF v_exists THEN 
            RETURN NEW; 
        END IF;
        
        -- Verificar se total é válido
        IF NEW.total IS NULL OR NEW.total <= 0 THEN
            RETURN NEW;
        END IF;
        
        -- Definir categoria baseada no tipo de comanda
        v_category_name := CASE NEW.type
            WHEN 'balcao' THEN 'Vendas PDV'
            WHEN 'mesa' THEN 'Vendas Mesa'
            ELSE 'Vendas'
        END;
        
        -- Buscar categoria (primeiro tenta a específica, depois fallback para Vendas genérica)
        SELECT id INTO v_category_id
        FROM financial_categories
        WHERE type = 'income' 
        AND name = v_category_name 
        AND is_active = true
        ORDER BY is_system DESC 
        LIMIT 1;
        
        -- Fallback para qualquer categoria de vendas se não encontrar
        IF v_category_id IS NULL THEN
            SELECT id INTO v_category_id
            FROM financial_categories
            WHERE type = 'income' 
            AND name ILIKE '%venda%'
            AND is_active = true
            ORDER BY is_system DESC 
            LIMIT 1;
        END IF;
        
        -- Mapear método de pagamento
        v_payment_method := CASE NEW.payment_method
            WHEN 'credito' THEN 'credit_card'
            WHEN 'credit_card' THEN 'credit_card'
            WHEN 'debito' THEN 'debit_card'
            WHEN 'debit_card' THEN 'debit_card'
            WHEN 'pix' THEN 'pix'
            WHEN 'dinheiro' THEN 'cash'
            WHEN 'cash' THEN 'cash'
            ELSE 'other'
        END;
        
        -- Inserir transação financeira
        INSERT INTO financial_transactions (
            store_id, 
            type, 
            category_id, 
            amount, 
            description,
            transaction_date, 
            payment_method, 
            reference_number, 
            notes,
            comanda_id
        ) VALUES (
            NEW.store_id, 
            'income', 
            v_category_id, 
            NEW.total,
            'Comanda #' || NEW.number || ' (' || UPPER(NEW.type) || ')',
            COALESCE(NEW.closed_at::date, CURRENT_DATE), 
            v_payment_method, 
            NEW.number,
            'Registro automático - Cliente: ' || COALESCE(NEW.customer_name, 'Não identificado'),
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_create_income_on_comanda_close ON comandas;

-- Criar trigger
CREATE TRIGGER trigger_create_income_on_comanda_close
    AFTER UPDATE ON comandas
    FOR EACH ROW
    EXECUTE FUNCTION create_income_from_closed_comanda();

-- 4. FUNÇÃO E TRIGGER PARA BOOKINGS CONCLUÍDOS
-- =====================================================

CREATE OR REPLACE FUNCTION create_income_from_completed_booking()
RETURNS TRIGGER AS $$
DECLARE
    v_category_id UUID;
    v_exists BOOLEAN;
    v_service_name TEXT;
    v_professional_name TEXT;
BEGIN
    -- Só executa se o status mudou para 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Verificar se já existe transação para este booking
        SELECT EXISTS(
            SELECT 1 FROM financial_transactions 
            WHERE booking_id = NEW.id
            AND type = 'income'
        ) INTO v_exists;
        
        IF v_exists THEN 
            RETURN NEW; 
        END IF;
        
        -- Verificar se preço é válido
        IF NEW.price IS NULL OR NEW.price <= 0 THEN
            RETURN NEW;
        END IF;
        
        -- Buscar nome do serviço
        SELECT name INTO v_service_name
        FROM booking_services 
        WHERE id = NEW.service_id;
        
        -- Buscar nome do profissional
        SELECT name INTO v_professional_name
        FROM professionals 
        WHERE id = NEW.professional_id;
        
        -- Buscar categoria "Agendamentos"
        SELECT id INTO v_category_id
        FROM financial_categories
        WHERE type = 'income' 
        AND (name ILIKE '%agendamento%' OR name ILIKE '%serviço%')
        AND is_active = true
        ORDER BY 
            CASE WHEN name = 'Agendamentos' THEN 0 ELSE 1 END,
            is_system DESC 
        LIMIT 1;
        
        -- Fallback para qualquer categoria de income
        IF v_category_id IS NULL THEN
            SELECT id INTO v_category_id
            FROM financial_categories
            WHERE type = 'income' 
            AND is_active = true
            ORDER BY is_system DESC 
            LIMIT 1;
        END IF;
        
        -- Inserir transação financeira
        INSERT INTO financial_transactions (
            store_id, 
            type, 
            category_id, 
            amount, 
            description,
            transaction_date, 
            payment_method, 
            reference_number, 
            notes,
            booking_id
        ) VALUES (
            NEW.store_id, 
            'income', 
            v_category_id, 
            NEW.price,
            'Agendamento - ' || COALESCE(v_service_name, 'Serviço'),
            NEW.booking_date, 
            'other', 
            'BOOK-' || LEFT(NEW.id::text, 8),
            'Registro automático - Cliente: ' || COALESCE(NEW.customer_name, 'N/I') || 
            CASE WHEN v_professional_name IS NOT NULL THEN ' | Profissional: ' || v_professional_name ELSE '' END,
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_create_income_on_booking_complete ON bookings;

-- Criar trigger
CREATE TRIGGER trigger_create_income_on_booking_complete
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_income_from_completed_booking();

-- 5. MIGRAR DADOS HISTÓRICOS - COMANDAS FECHADAS
-- =====================================================

INSERT INTO financial_transactions (
    store_id, 
    type, 
    category_id, 
    amount, 
    description, 
    transaction_date, 
    payment_method, 
    reference_number, 
    notes,
    comanda_id
)
SELECT 
    c.store_id,
    'income',
    (
        SELECT id FROM financial_categories 
        WHERE type = 'income' 
        AND name = CASE c.type 
            WHEN 'balcao' THEN 'Vendas PDV' 
            WHEN 'mesa' THEN 'Vendas Mesa' 
            ELSE 'Vendas' 
        END
        AND is_active = true
        LIMIT 1
    ),
    c.total,
    'Comanda #' || c.number || ' (' || UPPER(c.type) || ')',
    COALESCE(c.closed_at::date, c.updated_at::date),
    CASE c.payment_method
        WHEN 'credito' THEN 'credit_card'
        WHEN 'credit_card' THEN 'credit_card'
        WHEN 'debito' THEN 'debit_card'
        WHEN 'debit_card' THEN 'debit_card'
        WHEN 'pix' THEN 'pix'
        WHEN 'dinheiro' THEN 'cash'
        WHEN 'cash' THEN 'cash'
        ELSE 'other'
    END,
    c.number,
    'Migração histórica - Cliente: ' || COALESCE(c.customer_name, 'N/A'),
    c.id
FROM comandas c
WHERE c.status = 'closed'
AND c.total > 0
AND NOT EXISTS (
    SELECT 1 FROM financial_transactions ft 
    WHERE ft.comanda_id = c.id
    AND ft.type = 'income'
);

-- 6. MIGRAR DADOS HISTÓRICOS - BOOKINGS CONCLUÍDOS
-- =====================================================

INSERT INTO financial_transactions (
    store_id, 
    type, 
    category_id, 
    amount, 
    description, 
    transaction_date, 
    payment_method, 
    reference_number, 
    notes,
    booking_id
)
SELECT 
    b.store_id,
    'income',
    (
        SELECT id FROM financial_categories 
        WHERE type = 'income' 
        AND name = 'Agendamentos'
        AND is_active = true
        LIMIT 1
    ),
    b.price,
    'Agendamento - ' || COALESCE(bs.name, 'Serviço'),
    b.booking_date,
    'other',
    'BOOK-' || LEFT(b.id::text, 8),
    'Migração histórica - Cliente: ' || COALESCE(b.customer_name, 'N/A'),
    b.id
FROM bookings b
LEFT JOIN booking_services bs ON bs.id = b.service_id
WHERE b.status = 'completed'
AND b.price > 0
AND NOT EXISTS (
    SELECT 1 FROM financial_transactions ft 
    WHERE ft.booking_id = b.id
    AND ft.type = 'income'
);