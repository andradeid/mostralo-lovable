-- Aceite automático de pedidos (delivery_config.auto_accept_orders), 28/10/2026.
-- Antes: a opção existia na configuração da loja, mas nada no sistema a usava, e a tela gravava o contrário
-- do que o lojista marcava. Agora: com a opção ligada, o pedido que entra em "entrada" passa sozinho para
-- "em_preparo" (encomenda vira "confirmado" pelo fluxo de agendados), igual a apertar "Aceitar".

-- 1. Como a opção nunca funcionou, todas as lojas ficam com o comportamento real de hoje (aceite manual).
--    O lojista liga de novo na configuração, que agora grava o que ele marca.
UPDATE public.stores
   SET delivery_config = jsonb_set(delivery_config, '{auto_accept_orders}', 'false'::jsonb)
 WHERE delivery_config ? 'auto_accept_orders'
   AND delivery_config->>'auto_accept_orders' IS DISTINCT FROM 'false';

-- 2. Aceita sozinho quando a loja tem a opção ligada
CREATE OR REPLACE FUNCTION public._auto_accept_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'entrada'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'entrada')
     AND EXISTS (SELECT 1 FROM stores s WHERE s.id = NEW.store_id AND coalesce((s.delivery_config->>'auto_accept_orders')::boolean, false)) THEN
    UPDATE orders SET status = 'em_preparo' WHERE id = NEW.id AND status = 'entrada';
  END IF;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  -- nunca impedir o pedido de entrar; fica para aceite manual
  RAISE WARNING 'Aceite automático do pedido %: %', NEW.id, SQLERRM;
  RETURN NULL;
END $$;

REVOKE ALL ON FUNCTION public._auto_accept_order() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_auto_accept_order ON public.orders;
CREATE TRIGGER trg_auto_accept_order
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public._auto_accept_order();
