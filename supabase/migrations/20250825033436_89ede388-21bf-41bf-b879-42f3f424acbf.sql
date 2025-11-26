-- Adicionar campos de oferta na tabela products
ALTER TABLE public.products 
ADD COLUMN is_on_offer boolean DEFAULT false,
ADD COLUMN original_price numeric DEFAULT NULL,
ADD COLUMN offer_price numeric DEFAULT NULL;

-- Copiar os preços atuais para original_price quando não há oferta
UPDATE public.products 
SET original_price = price 
WHERE is_on_offer = false OR is_on_offer IS NULL;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN public.products.is_on_offer IS 'Indica se o produto está em oferta';
COMMENT ON COLUMN public.products.original_price IS 'Preço original do produto (usado quando está em oferta)';
COMMENT ON COLUMN public.products.offer_price IS 'Preço com desconto quando o produto está em oferta';