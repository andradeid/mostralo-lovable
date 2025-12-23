
-- =====================================================
-- CORREÇÃO: Mapear payment_method de orders para financial_transactions
-- O pedido usa: pix, card, cash
-- A transação aceita: cash, pix, credit_card, debit_card, bank_transfer, check, other
-- =====================================================

CREATE OR REPLACE FUNCTION create_income_from_completed_order()
RETURNS TRIGGER AS $$
DECLARE
    v_category_id UUID;
    v_exists BOOLEAN;
    v_payment_method TEXT;
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
        
        -- Mapear payment_method de orders para financial_transactions
        -- orders usa: pix, card, cash
        -- financial_transactions aceita: cash, pix, credit_card, debit_card, bank_transfer, check, other
        v_payment_method := CASE NEW.payment_method
            WHEN 'card' THEN 'credit_card'
            WHEN 'pix' THEN 'pix'
            WHEN 'cash' THEN 'cash'
            ELSE 'other'
        END;
        
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
            v_payment_method,
            NEW.order_number,
            'Registro automático - Cliente: ' || NEW.customer_name
        );
        
        RAISE NOTICE 'Receita criada automaticamente para pedido % - R$ %', NEW.order_number, NEW.total;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
