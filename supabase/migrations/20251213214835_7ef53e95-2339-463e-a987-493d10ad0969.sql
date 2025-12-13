UPDATE salespeople
SET 
  qualification_answers = '{
    "experience": "yes_years",
    "availability": "partial",
    "network": "many",
    "digital": "advanced",
    "communication": "all",
    "goal": "main_income"
  }'::jsonb
WHERE id = 'b0eb8526-7da0-4345-8fad-5676542a805c';