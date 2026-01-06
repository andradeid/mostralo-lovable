-- Definir valor padrão para timezone
ALTER TABLE stores 
ALTER COLUMN timezone SET DEFAULT 'America/Sao_Paulo';

-- Atualizar lojas sem timezone definido
UPDATE stores 
SET timezone = 'America/Sao_Paulo' 
WHERE timezone IS NULL;