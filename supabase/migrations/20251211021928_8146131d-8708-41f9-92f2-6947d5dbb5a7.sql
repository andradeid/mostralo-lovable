-- Adicionar constraint UNIQUE no campo salesperson_id
-- Isso permite que o UPSERT funcione com onConflict: "salesperson_id"
ALTER TABLE salesperson_commission_configs 
ADD CONSTRAINT salesperson_commission_configs_salesperson_id_key 
UNIQUE (salesperson_id);