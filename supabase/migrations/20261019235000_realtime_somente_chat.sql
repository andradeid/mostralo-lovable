-- Realtime só para o chat de WhatsApp (únicas tabelas com tela escutando).
-- Pedidos, itens, agendamentos, comandas, chamadas de senha e pagamentos usam consulta periódica.
alter publication supabase_realtime drop table public.bookings, public.comanda_items, public.order_items, public.orders, public.password_calls, public.payment_requests;
