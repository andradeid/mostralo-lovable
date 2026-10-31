-- Clientes: sem leitura pública (qualquer visitante lia a tabela inteira com a chave do site).
-- Totem e cadastro da loja usam public.find_or_create_customer_by_phone (migração anterior);
-- o checkout usa a função customer-auth-v2 (service_role).
alter policy "Anon can read customers by phone" on public.customers to service_role;
