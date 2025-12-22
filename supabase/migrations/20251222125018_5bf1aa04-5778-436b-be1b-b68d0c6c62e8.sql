-- Adicionar coluna para exibir teclado no painel de pedidos
ALTER TABLE password_call_config 
ADD COLUMN show_in_orders_page boolean DEFAULT false;