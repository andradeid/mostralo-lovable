-- Corrigir valor da fatura existente
UPDATE subscription_invoices 
SET amount = 297.00 
WHERE amount = 29.90;