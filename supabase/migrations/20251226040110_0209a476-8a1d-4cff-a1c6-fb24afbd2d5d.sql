-- Adicionar campo show_in_menu para controlar visibilidade no cardápio digital
-- Por padrão TRUE = aparece no cardápio digital

-- Produtos: exibir ou não no cardápio digital
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS show_in_menu BOOLEAN DEFAULT true;

-- Categorias: exibir ou não no cardápio digital  
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS show_in_menu BOOLEAN DEFAULT true;

-- Comentários explicativos
COMMENT ON COLUMN products.show_in_menu IS 'Se false, produto só disponível via PDV/comanda (não aparece no cardápio digital)';
COMMENT ON COLUMN categories.show_in_menu IS 'Se false, categoria e seus produtos só aparecem via PDV/comanda';