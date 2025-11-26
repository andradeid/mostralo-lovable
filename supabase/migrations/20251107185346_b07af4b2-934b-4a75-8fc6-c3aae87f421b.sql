-- Criar ENUM para tipo de frequência do popup
CREATE TYPE popup_frequency_type AS ENUM (
  'once_browser',
  'once_session',
  'custom_count'
);

-- Adicionar colunas na tabela promotions
ALTER TABLE promotions 
ADD COLUMN show_as_popup BOOLEAN DEFAULT false,
ADD COLUMN popup_frequency_type popup_frequency_type DEFAULT 'once_session',
ADD COLUMN popup_max_displays INTEGER DEFAULT 1;

-- Criar índice para melhorar performance
CREATE INDEX idx_promotions_popup 
ON promotions(store_id, show_as_popup) 
WHERE show_as_popup = true AND status = 'active';

-- Comentários explicativos
COMMENT ON COLUMN promotions.show_as_popup IS 
  'Se true, esta promoção será exibida automaticamente em popup. Apenas 1 promoção por loja pode ter este valor como true.';

COMMENT ON COLUMN promotions.popup_frequency_type IS 
  'Define como controlar a exibição do popup: once_browser (1x permanente), once_session (1x por sessão), custom_count (X vezes)';

COMMENT ON COLUMN promotions.popup_max_displays IS 
  'Número máximo de vezes que o popup pode aparecer (usado apenas quando popup_frequency_type = custom_count). Padrão: 1';

-- Constraint: popup_max_displays deve ser >= 1
ALTER TABLE promotions
ADD CONSTRAINT check_popup_max_displays 
CHECK (popup_max_displays IS NULL OR popup_max_displays >= 1);

-- Função para garantir apenas 1 popup ativo por loja
CREATE OR REPLACE FUNCTION enforce_single_popup_per_store()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.show_as_popup = true THEN
    UPDATE promotions 
    SET show_as_popup = false 
    WHERE store_id = NEW.store_id 
      AND id != NEW.id 
      AND show_as_popup = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_single_popup_per_store ON promotions;
CREATE TRIGGER trigger_single_popup_per_store
  BEFORE INSERT OR UPDATE OF show_as_popup
  ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_popup_per_store();