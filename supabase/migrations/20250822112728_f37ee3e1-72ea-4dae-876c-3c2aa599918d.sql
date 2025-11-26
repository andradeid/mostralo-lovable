-- Adicionar campo de texto personalizado do botão e galeria de imagens
ALTER TABLE products 
ADD COLUMN button_text text DEFAULT 'Comprar',
ADD COLUMN image_gallery text[] DEFAULT ARRAY[]::text[];