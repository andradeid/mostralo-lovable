-- Adicionar coluna service_fee na tabela comandas
ALTER TABLE comandas 
ADD COLUMN IF NOT EXISTS service_fee NUMERIC DEFAULT 0 NOT NULL;

-- Atualizar ou criar função de recálculo de totais para incluir taxa de serviço
CREATE OR REPLACE FUNCTION recalculate_comanda_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE comandas
  SET 
    subtotal = COALESCE((
      SELECT SUM(total_price) 
      FROM comanda_items 
      WHERE comanda_id = COALESCE(NEW.comanda_id, OLD.comanda_id)
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.comanda_id, OLD.comanda_id);
  
  -- Recalcular total após atualizar subtotal
  UPDATE comandas
  SET 
    total = subtotal + service_fee - discount
  WHERE id = COALESCE(NEW.comanda_id, OLD.comanda_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recriar trigger se necessário
DROP TRIGGER IF EXISTS trg_recalculate_comanda_totals ON comanda_items;

CREATE TRIGGER trg_recalculate_comanda_totals
AFTER INSERT OR UPDATE OR DELETE ON comanda_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_comanda_totals();