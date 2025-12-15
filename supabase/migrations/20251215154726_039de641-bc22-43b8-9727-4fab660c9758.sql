-- Remover constraint antigo
ALTER TABLE salespeople DROP CONSTRAINT IF EXISTS salespeople_salesperson_type_check;

-- Adicionar novo constraint com partner_pj
ALTER TABLE salespeople ADD CONSTRAINT salespeople_salesperson_type_check 
CHECK (salesperson_type = ANY (ARRAY['affiliate'::text, 'partner'::text, 'partner_pj'::text]));

-- Atualizar o vendedor de teste para partner_pj
UPDATE salespeople 
SET salesperson_type = 'partner_pj'
WHERE email = 'vendedorpj@email.com';