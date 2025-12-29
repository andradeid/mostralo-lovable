-- 1. Criar categoria "Vendas Totem" se não existir
INSERT INTO financial_categories (name, type, icon, color, is_system, description, display_order, is_active)
SELECT 'Vendas Totem', 'income', 'Tablet', '#f97316', true, 'Receitas de vendas via Totem de Autoatendimento', 5, true
WHERE NOT EXISTS (
    SELECT 1 FROM financial_categories WHERE name = 'Vendas Totem' AND type = 'income'
);

-- 2. Atualizar trigger para identificar origem do pedido
CREATE OR REPLACE FUNCTION create_income_from_completed_order()
RETURNS TRIGGER AS $$
DECLARE
    v_category_id UUID;
    v_exists BOOLEAN;
    v_payment_method TEXT;
    v_category_name TEXT;
    v_description TEXT;
BEGIN
    IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
        
        -- Verificar se já existe transação para este pedido
        SELECT EXISTS(
            SELECT 1 FROM financial_transactions 
            WHERE order_id = NEW.id AND type = 'income'
        ) INTO v_exists;
        
        IF v_exists THEN
            RETURN NEW;
        END IF;
        
        -- Determinar categoria baseada na origem (source)
        v_category_name := CASE COALESCE(NEW.source, 'site')
            WHEN 'totem' THEN 'Vendas Totem'
            WHEN 'ifood' THEN 'Vendas iFood'
            ELSE 'Vendas'
        END;
        
        -- Determinar descrição baseada na origem
        v_description := CASE COALESCE(NEW.source, 'site')
            WHEN 'totem' THEN 'Totem #' || NEW.order_number
            WHEN 'ifood' THEN 'iFood #' || NEW.order_number
            ELSE 'Pedido #' || NEW.order_number
        END;
        
        -- Buscar categoria específica
        SELECT id INTO v_category_id
        FROM financial_categories
        WHERE type = 'income' 
        AND name = v_category_name 
        AND is_active = true
        ORDER BY is_system DESC 
        LIMIT 1;
        
        -- Fallback para "Vendas" se não encontrar categoria específica
        IF v_category_id IS NULL THEN
            SELECT id INTO v_category_id
            FROM financial_categories
            WHERE type = 'income' 
            AND name = 'Vendas' 
            AND is_active = true
            ORDER BY is_system DESC 
            LIMIT 1;
        END IF;
        
        -- Mapear método de pagamento
        v_payment_method := CASE NEW.payment_method
            WHEN 'card' THEN 'credit_card'
            WHEN 'credit_card' THEN 'credit_card'
            WHEN 'debit_card' THEN 'debit_card'
            WHEN 'pix' THEN 'pix'
            WHEN 'cash' THEN 'cash'
            WHEN 'dinheiro' THEN 'cash'
            ELSE 'other'
        END;
        
        -- Inserir transação financeira
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
            v_description,
            NEW.id,
            CURRENT_DATE,
            v_payment_method,
            NEW.order_number,
            'Registro automático - Origem: ' || COALESCE(NEW.source, 'site') || ' - Cliente: ' || COALESCE(NEW.customer_name, 'N/A')
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Migrar dados históricos de pedidos totem
UPDATE financial_transactions ft
SET category_id = (
    SELECT id FROM financial_categories 
    WHERE name = 'Vendas Totem' AND type = 'income' AND is_active = true
    ORDER BY is_system DESC LIMIT 1
)
FROM orders o
WHERE ft.order_id = o.id
AND o.source = 'totem'
AND ft.type = 'income'
AND EXISTS (
    SELECT 1 FROM financial_categories 
    WHERE name = 'Vendas Totem' AND type = 'income' AND is_active = true
);