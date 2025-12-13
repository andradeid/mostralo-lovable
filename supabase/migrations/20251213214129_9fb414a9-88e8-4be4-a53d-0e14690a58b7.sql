UPDATE salespeople
SET 
  qualification_answers = '[
    {"question": 1, "answer": "yes_2_years", "points": 20},
    {"question": 2, "answer": "15_25_hours", "points": 15},
    {"question": 3, "answer": "both", "points": 20},
    {"question": 4, "answer": "yes_both", "points": 15},
    {"question": 5, "answer": "yes_50_plus", "points": 10},
    {"question": 6, "answer": "extra_income_career", "points": 5}
  ]'::jsonb,
  qualification_score = 85,
  qualification_level = 'top_candidate',
  updated_at = NOW()
WHERE id = 'b0eb8526-7da0-4345-8fad-5676542a805c';