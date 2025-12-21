-- Adicionar coluna use_master_for_notifications na tabela stores
-- Por padrão FALSE - lojas NÃO usam instância master automaticamente
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS use_master_for_notifications boolean DEFAULT false;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.stores.use_master_for_notifications IS 'Se true, permite usar a instância WhatsApp master para enviar notificações quando a loja não tiver instância própria conectada';