-- Corrigir Loja 008: vincular ao vendedor Desenvolvedor Mostralo
UPDATE payment_approvals 
SET referred_by_salesperson_id = 'd83727c4-f52f-4ed7-bbae-77654123ccd7'
WHERE id = '55dc38c4-9787-4d5f-83af-2975f4185afe'
AND referred_by_salesperson_id IS NULL;