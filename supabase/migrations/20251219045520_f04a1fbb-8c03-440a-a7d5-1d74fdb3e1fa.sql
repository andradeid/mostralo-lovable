-- =====================================================
-- AUTOMAÇÃO FINANCEIRA: Receitas e Despesas Automáticas
-- =====================================================

-- 1. Criar categoria de sistema para pagamento de entregadores
INSERT INTO financial_categories (name, type, icon, color, is_system, is_active, description, display_order)
VALUES ('Pagamento Entregadores', 'expense', 'Truck', '#f97316', true, true, 'Pagamentos automáticos aos entregadores por entregas realizadas', 100)
ON CONFLICT DO NOTHING;

-- 2. Garantir que existe a categoria "Vendas" para receitas
INSERT INTO financial_categories (name, type, icon, color, is_system, is_active, description, display_order)
VALUES ('Vendas', 'income', 'ShoppingCart', '#22c55e', true, true, 'Receitas de vendas de pedidos', 1)
ON CONFLICT DO NOTHING;

-- 3. Índice para performance na verificação de duplicatas
CREATE INDEX IF NOT EXISTS idx_financial_transactions_order_id 
ON financial_transactions(order_id) 
WHERE order_id IS NOT NULL;

-- =====================================================
-- TRIGGER 1: Pedido Concluído → Receita Automática
-- =====================================================

CREATE OR REPLACE FUNCTION create_income_from_completed_order()
RETURNS TRIGGER AS $$
DECLARE
    v_category_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Só executa se o status mudou para 'concluido'
    IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
        
        -- Verificar se já existe transação para este pedido (evitar duplicatas)
        SELECT EXISTS(
            SELECT 1 FROM financial_transactions 
            WHERE order_id = NEW.id 
            AND type = 'income'
        ) INTO v_exists;
        
        IF v_exists THEN
            RAISE NOTICE 'Transação de receita já existe para pedido %', NEW.id;
            RETURN NEW;
        END IF;
        
        -- Buscar categoria "Vendas" (prioriza a do sistema)
        SELECT id INTO v_category_id
        FROM financial_categories
        WHERE type = 'income' 
        AND (name ILIKE '%venda%' OR name ILIKE '%sales%')
        AND is_active = true
        AND (store_id = NEW.store_id OR is_system = true)
        ORDER BY is_system DESC, display_order ASC
        LIMIT 1;
        
        -- Se não encontrou, criar categoria padrão
        IF v_category_id IS NULL THEN
            INSERT INTO financial_categories (name, type, icon, color, is_system, store_id, description)
            VALUES ('Vendas', 'income', 'ShoppingCart', '#22c55e', false, NEW.store_id, 'Receitas de vendas')
            RETURNING id INTO v_category_id;
        END IF;
        
        -- Inserir transação de receita
        INSERT INTO financial_transactions (
            store_id,
            type,
            category_id,
            amount,
            description,
            order_id,
            transaction_date,
            payment_method,
            reference_number,
            notes
        ) VALUES (
            NEW.store_id,
            'income',
            v_category_id,
            NEW.total,
            'Pedido #' || NEW.order_number,
            NEW.id,
            CURRENT_DATE,
            NEW.payment_method::text,
            NEW.order_number,
            'Registro automático - Cliente: ' || NEW.customer_name
        );
        
        RAISE NOTICE 'Receita criada automaticamente para pedido % - R$ %', NEW.order_number, NEW.total;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger na tabela orders
DROP TRIGGER IF EXISTS trigger_create_income_on_order_complete ON orders;
CREATE TRIGGER trigger_create_income_on_order_complete
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_income_from_completed_order();

-- =====================================================
-- TRIGGER 2: Entrega Registrada → Despesa Automática
-- =====================================================

CREATE OR REPLACE FUNCTION create_expense_from_driver_earning()
RETURNS TRIGGER AS $$
DECLARE
    v_category_id UUID;
    v_driver_name TEXT;
    v_order_number TEXT;
    v_exists BOOLEAN;
BEGIN
    -- Verificar se já existe transação para este earning (evitar duplicatas)
    SELECT EXISTS(
        SELECT 1 FROM financial_transactions 
        WHERE order_id = NEW.order_id 
        AND type = 'expense'
        AND description ILIKE '%entrega%'
        AND notes ILIKE '%' || NEW.id || '%'
    ) INTO v_exists;
    
    IF v_exists THEN
        RAISE NOTICE 'Transação de despesa já existe para earning %', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Buscar nome do entregador
    SELECT COALESCE(full_name, 'Entregador') INTO v_driver_name
    FROM profiles
    WHERE id = NEW.driver_id;
    
    -- Buscar número do pedido
    SELECT order_number INTO v_order_number
    FROM orders
    WHERE id = NEW.order_id;
    
    -- Buscar categoria "Pagamento Entregadores"
    SELECT id INTO v_category_id
    FROM financial_categories
    WHERE type = 'expense' 
    AND (name ILIKE '%entregador%' OR name ILIKE '%delivery%' OR name ILIKE '%frete%')
    AND is_active = true
    AND (store_id = NEW.store_id OR is_system = true)
    ORDER BY is_system DESC, display_order ASC
    LIMIT 1;
    
    -- Se não encontrou, criar categoria padrão para a loja
    IF v_category_id IS NULL THEN
        INSERT INTO financial_categories (name, type, icon, color, is_system, store_id, description)
        VALUES ('Pagamento Entregadores', 'expense', 'Truck', '#f97316', false, NEW.store_id, 'Pagamentos aos entregadores')
        RETURNING id INTO v_category_id;
    END IF;
    
    -- Inserir transação de despesa
    INSERT INTO financial_transactions (
        store_id,
        type,
        category_id,
        amount,
        description,
        order_id,
        transaction_date,
        payment_method,
        reference_number,
        notes
    ) VALUES (
        NEW.store_id,
        'expense',
        v_category_id,
        NEW.earnings_amount,
        'Entrega #' || COALESCE(v_order_number, 'N/A') || ' - ' || v_driver_name,
        NEW.order_id,
        NEW.delivered_at::date,
        NEW.payment_type::text,
        'EARN-' || LEFT(NEW.id::text, 8),
        'Registro automático - Earning ID: ' || NEW.id
    );
    
    RAISE NOTICE 'Despesa criada automaticamente para entrega % - R$ %', v_order_number, NEW.earnings_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger na tabela driver_earnings
DROP TRIGGER IF EXISTS trigger_create_expense_on_driver_earning ON driver_earnings;
CREATE TRIGGER trigger_create_expense_on_driver_earning
    AFTER INSERT ON driver_earnings
    FOR EACH ROW
    EXECUTE FUNCTION create_expense_from_driver_earning();