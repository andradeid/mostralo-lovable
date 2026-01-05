-- Atualiza a trigger para criar categoria automaticamente se não existir

CREATE OR REPLACE FUNCTION public.create_income_from_completed_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_category_id UUID;
    v_exists BOOLEAN;
    v_payment_method TEXT;
    v_category_name TEXT;
    v_description TEXT;
BEGIN
    IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
        
        SELECT EXISTS(
            SELECT 1 FROM financial_transactions 
            WHERE order_id = NEW.id AND type = 'income'
        ) INTO v_exists;
        
        IF v_exists THEN
            RETURN NEW;
        END IF;
        
        v_category_name := CASE COALESCE(NEW.source, 'site')
            WHEN 'totem' THEN 'Vendas Totem'
            WHEN 'ifood' THEN 'Vendas iFood'
            ELSE 'Vendas'
        END;
        
        v_description := CASE COALESCE(NEW.source, 'site')
            WHEN 'totem' THEN 'Totem #' || NEW.order_number
            WHEN 'ifood' THEN 'iFood #' || NEW.order_number
            ELSE 'Pedido #' || NEW.order_number
        END;
        
        -- Buscar categoria existente
        SELECT id INTO v_category_id
        FROM financial_categories
        WHERE store_id = NEW.store_id
        AND type = 'income' 
        AND name = v_category_name 
        AND is_active = true
        ORDER BY is_system DESC 
        LIMIT 1;
        
        -- Se não encontrou a categoria específica, buscar "Vendas"
        IF v_category_id IS NULL AND v_category_name != 'Vendas' THEN
            SELECT id INTO v_category_id
            FROM financial_categories
            WHERE store_id = NEW.store_id
            AND type = 'income' 
            AND name = 'Vendas' 
            AND is_active = true
            ORDER BY is_system DESC 
            LIMIT 1;
        END IF;
        
        -- Se ainda não encontrou, CRIAR a categoria automaticamente
        IF v_category_id IS NULL THEN
            INSERT INTO financial_categories (
                store_id, name, type, icon, color, is_system, is_active
            ) VALUES (
                NEW.store_id, 'Vendas', 'income', 'shopping-cart', '#22c55e', true, true
            )
            RETURNING id INTO v_category_id;
        END IF;
        
        -- Cast explícito para TEXT antes da comparação
        v_payment_method := CASE NEW.payment_method::TEXT
            WHEN 'card' THEN 'credit_card'
            WHEN 'credit_card' THEN 'credit_card'
            WHEN 'debit_card' THEN 'debit_card'
            WHEN 'pix' THEN 'pix'
            WHEN 'cash' THEN 'cash'
            WHEN 'dinheiro' THEN 'cash'
            ELSE 'other'
        END;
        
        INSERT INTO financial_transactions (
            store_id, type, category_id, amount, description, order_id,
            transaction_date, payment_method, reference_number, notes
        ) VALUES (
            NEW.store_id, 'income', v_category_id, NEW.total, v_description, NEW.id,
            CURRENT_DATE, v_payment_method, NEW.order_number,
            'Registro automático - Origem: ' || COALESCE(NEW.source, 'site') || ' - Cliente: ' || COALESCE(NEW.customer_name, 'N/A')
        );
    END IF;
    
    RETURN NEW;
END;
$function$;