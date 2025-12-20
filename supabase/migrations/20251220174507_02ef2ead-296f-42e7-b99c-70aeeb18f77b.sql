-- Corrigir notify_new_orders da Stark Pizzaria que estava desativado incorretamente
UPDATE stores 
SET notify_new_orders = true 
WHERE id = '79fedd36-6e19-42d6-b331-79f9ad777180';