-- Inserir registro de teste para avaliação
INSERT INTO booking_reviews (
  booking_id, 
  store_id,
  professional_id,
  token, 
  expires_at
)
VALUES (
  '10c161d2-0ed6-4f1c-a010-166fea27e6a8',
  '79fedd36-6e19-42d6-b331-79f9ad777180',
  'ce4c4694-f222-49d1-94c2-0c0a525011fa',
  'teste-avaliacao-2025',
  NOW() + INTERVAL '7 days'
)