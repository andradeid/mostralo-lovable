-- Corrigir qualification_level inconsistente no banco
UPDATE salespeople 
SET qualification_level = 'top' 
WHERE qualification_level = 'top_candidate';

UPDATE salespeople 
SET qualification_level = 'promising' 
WHERE qualification_level = 'promising_candidate';

UPDATE salespeople 
SET qualification_level = 'beginner' 
WHERE qualification_level = 'beginner_candidate';