UPDATE salespeople
SET 
  qualification_answers = '{
    "1": "yes_2_years",
    "2": "15_25_hours",
    "3": "both",
    "4": "yes_both",
    "5": "yes_50_plus",
    "6": "extra_income_career"
  }'::jsonb
WHERE id = 'b0eb8526-7da0-4345-8fad-5676542a805c';