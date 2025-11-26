-- Inserir produtos de exemplo usando os IDs das categorias existentes
INSERT INTO products (name, description, price, category_id, store_id, display_order, is_available) VALUES
-- Pizzas Tradicionais (d02ad581-f908-44d2-8cf3-2dcf85baf62a)
('Pizza Margherita', 'Molho de tomate, mussarela, manjericão fresco e azeite extra virgem', 32.90, 
 'd02ad581-f908-44d2-8cf3-2dcf85baf62a'::uuid, '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 1, true),

('Pizza Calabresa', 'Molho de tomate, mussarela, calabresa fatiada e cebola', 35.90, 
 'd02ad581-f908-44d2-8cf3-2dcf85baf62a'::uuid, '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 2, true),

('Pizza Portuguesa', 'Molho de tomate, mussarela, presunto, ovos, cebola, azeitona e ervilha', 38.90, 
 'd02ad581-f908-44d2-8cf3-2dcf85baf62a'::uuid, '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 3, true),

-- Pizzas Especiais (eac715d4-51be-45e6-a615-157d647a72b1)
('Pizza Quatro Queijos', 'Molho branco, mussarela, gorgonzola, parmesão e catupiry', 42.90, 
 'eac715d4-51be-45e6-a615-157d647a72b1'::uuid, '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 4, true),

('Pizza Frango com Catupiry', 'Molho de tomate, mussarela, frango desfiado e catupiry', 39.90, 
 'eac715d4-51be-45e6-a615-157d647a72b1'::uuid, '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 5, true),

('Pizza Pepperoni', 'Molho de tomate, mussarela e generosas fatias de pepperoni', 45.90, 
 'eac715d4-51be-45e6-a615-157d647a72b1'::uuid, '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 6, true),

('Pizza Bacon', 'Molho de tomate, mussarela, bacon crocante e cebola roxa', 41.90, 
 'eac715d4-51be-45e6-a615-157d647a72b1'::uuid, '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 7, true),

-- Bebidas (f9b04919-dc4d-46db-9ec0-1f6a9d46bcfa)
('Coca-Cola 350ml', 'Refrigerante de cola gelado', 6.50, 
 'f9b04919-dc4d-46db-9ec0-1f6a9d46bcfa'::uuid, '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 8, true),

('Suco de Laranja 300ml', 'Suco natural de laranja', 8.90, 
 'f9b04919-dc4d-46db-9ec0-1f6a9d46bcfa'::uuid, '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 9, true),

-- Sobremesas (46b83313-17d1-44e8-a2c4-a1e2b4b3b866)
('Pudim de Leite', 'Cremoso pudim de leite condensado com calda de caramelo', 12.90, 
 '46b83313-17d1-44e8-a2c4-a1e2b4b3b866'::uuid, '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 10, true);