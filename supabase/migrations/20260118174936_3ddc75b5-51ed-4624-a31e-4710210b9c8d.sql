-- Corrige propostas aceitas antes da implementação dos campos de termos
-- Justificativa: O fluxo de aceite sempre exigiu marcar ambos os checkboxes
UPDATE commercial_proposals 
SET 
  terms_accepted = true, 
  lgpd_accepted = true 
WHERE 
  status = 'accepted' 
  AND accepted_at IS NOT NULL 
  AND (terms_accepted = false OR lgpd_accepted = false);