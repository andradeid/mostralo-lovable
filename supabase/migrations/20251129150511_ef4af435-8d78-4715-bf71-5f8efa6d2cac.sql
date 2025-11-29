-- Configurar REPLICA IDENTITY FULL na tabela orders
-- Isso garante que o Realtime envie todos os campos (old e new) nos eventos de UPDATE
ALTER TABLE orders REPLICA IDENTITY FULL;