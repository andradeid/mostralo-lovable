-- Criar trigger que chama a função notify_store_new_order quando um novo pedido é inserido
CREATE TRIGGER trigger_notify_store_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_store_new_order();