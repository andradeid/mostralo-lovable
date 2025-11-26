-- Adicionar campos de texto dos botões de delivery e pickup na tabela store_configurations
ALTER TABLE public.store_configurations
ADD COLUMN delivery_button_text text DEFAULT 'Delivery',
ADD COLUMN pickup_button_text text DEFAULT 'Retirada Balcão';

-- Comentários para documentação
COMMENT ON COLUMN public.store_configurations.delivery_button_text IS 'Texto personalizado para o botão de opção de delivery';
COMMENT ON COLUMN public.store_configurations.pickup_button_text IS 'Texto personalizado para o botão de retirada no balcão';