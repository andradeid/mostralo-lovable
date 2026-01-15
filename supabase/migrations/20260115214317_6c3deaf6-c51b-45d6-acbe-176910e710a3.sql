-- Adicionar coluna slug na tabela professionals
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS slug TEXT;

-- Criar índice único para slug + store_id (slug único por loja)
CREATE UNIQUE INDEX IF NOT EXISTS professionals_store_slug_unique 
ON public.professionals(store_id, slug) 
WHERE slug IS NOT NULL;

-- Função para gerar slug a partir do nome
CREATE OR REPLACE FUNCTION public.generate_professional_slug(p_name TEXT, p_store_id UUID, p_professional_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Gerar slug base: lowercase, sem acentos, substituir espaços por hífens
  base_slug := lower(trim(p_name));
  base_slug := translate(base_slug, 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn');
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  new_slug := base_slug;
  
  -- Verificar se já existe e adicionar sufixo numérico se necessário
  WHILE EXISTS (
    SELECT 1 FROM professionals 
    WHERE store_id = p_store_id 
    AND slug = new_slug 
    AND (p_professional_id IS NULL OR id != p_professional_id)
  ) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN new_slug;
END;
$$;

-- Trigger para auto-gerar slug quando profissional é criado/atualizado
CREATE OR REPLACE FUNCTION public.handle_professional_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Gerar slug se não existir ou se o nome mudou
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name) THEN
    NEW.slug := generate_professional_slug(NEW.name, NEW.store_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS on_professional_slug ON professionals;
CREATE TRIGGER on_professional_slug
  BEFORE INSERT OR UPDATE ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION handle_professional_slug();

-- Atualizar profissionais existentes que não têm slug
UPDATE professionals 
SET slug = generate_professional_slug(name, store_id, id)
WHERE slug IS NULL;