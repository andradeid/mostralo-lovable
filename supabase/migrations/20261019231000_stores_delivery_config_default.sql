-- Loja nova já nasce com entrega e retirada ligadas e mesa desligada (vale para todos os caminhos de cadastro).
alter table public.stores
  alter column delivery_config set default '{"does_delivery": true, "allows_pickup": true, "allows_table": false}'::jsonb;
