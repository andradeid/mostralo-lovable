-- Criar tabela de configuração de mensagens automáticas
CREATE TABLE public.whatsapp_auto_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Configuração global
  is_enabled BOOLEAN DEFAULT false,
  
  -- Mensagem de Saudação (novo contato)
  greeting_enabled BOOLEAN DEFAULT false,
  greeting_message TEXT DEFAULT 'Olá! 👋 Seja bem-vindo(a) à {loja}!

Confira nosso cardápio: {link_loja}
Faça seu pedido agora! 🍕',
  
  -- Pedido Recebido (entrada)
  order_received_enabled BOOLEAN DEFAULT false,
  order_received_message TEXT DEFAULT '✅ Recebemos seu pedido #{numero_pedido}!
Valor: R$ {valor_total}
Aguarde a confirmação da {loja}. 🕐',
  
  -- Pedido Confirmado (em_preparo)
  order_confirmed_enabled BOOLEAN DEFAULT false,
  order_confirmed_message TEXT DEFAULT '🎉 Pedido #{numero_pedido} CONFIRMADO!
Já estamos preparando com carinho! 👨‍🍳
Acompanhe: {link_pedido}',
  
  -- Pronto para Retirada (aguarda_retirada)
  order_ready_enabled BOOLEAN DEFAULT false,
  order_ready_message TEXT DEFAULT '🏪 Seu pedido #{numero_pedido} está PRONTO!
Pode vir retirar na {loja}! 🤗',
  
  -- Saiu para Entrega (em_transito)
  order_in_transit_enabled BOOLEAN DEFAULT false,
  order_in_transit_message TEXT DEFAULT '🚀 Seu pedido #{numero_pedido} está a CAMINHO!
📍 Endereço: {endereco_entrega}',
  
  -- Pedido Concluído
  order_completed_enabled BOOLEAN DEFAULT false,
  order_completed_message TEXT DEFAULT '🎊 Pedido #{numero_pedido} ENTREGUE!
Obrigado por escolher a {loja}! 💚
Volte sempre!',
  
  -- Pedido Cancelado
  order_cancelled_enabled BOOLEAN DEFAULT false,
  order_cancelled_message TEXT DEFAULT '😔 Pedido #{numero_pedido} foi cancelado.
Lamentamos o ocorrido.
Entre em contato: {whatsapp_loja}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(store_id)
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_auto_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Store owners can manage their auto messages"
ON public.whatsapp_auto_messages
FOR ALL
USING (EXISTS (
  SELECT 1 FROM stores 
  WHERE stores.id = whatsapp_auto_messages.store_id 
  AND stores.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM stores 
  WHERE stores.id = whatsapp_auto_messages.store_id 
  AND stores.owner_id = auth.uid()
));

CREATE POLICY "Master admins can view all auto messages"
ON public.whatsapp_auto_messages
FOR SELECT
USING (has_role(auth.uid(), 'master_admin'));

-- Trigger para updated_at
CREATE TRIGGER update_whatsapp_auto_messages_updated_at
BEFORE UPDATE ON public.whatsapp_auto_messages
FOR EACH ROW
EXECUTE FUNCTION update_whatsapp_updated_at();

-- Índice para busca por store_id
CREATE INDEX idx_whatsapp_auto_messages_store_id ON public.whatsapp_auto_messages(store_id);