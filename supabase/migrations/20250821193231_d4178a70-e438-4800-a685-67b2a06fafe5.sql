-- Adicionar constraint única na tabela store_configurations para store_id
-- Isso permite o uso correto de UPSERT com ON CONFLICT

ALTER TABLE store_configurations 
ADD CONSTRAINT store_configurations_store_id_unique 
UNIQUE (store_id);