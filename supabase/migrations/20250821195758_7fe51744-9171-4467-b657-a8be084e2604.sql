-- Inserir categorias de exemplo para a pizzaria
INSERT INTO categories (name, description, store_id, display_order, is_active) VALUES
('Pizzas Tradicionais', 'Nossas deliciosas pizzas tradicionais com ingredientes frescos', '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 1, true),
('Pizzas Especiais', 'Pizzas gourmet com combinações únicas de sabores', '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 2, true),
('Bebidas', 'Refrigerantes, sucos e cervejas para acompanhar', '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 3, true),
('Sobremesas', 'Doces irresistíveis para finalizar sua refeição', '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 4, true);

-- Inserir produtos de exemplo
INSERT INTO products (name, description, price, category_id, store_id, display_order, is_available) VALUES
-- Pizzas Tradicionais
('Pizza Margherita', 'Molho de tomate, mussarela, manjericão fresco e azeite extra virgem', 32.90, 
 (SELECT id FROM categories WHERE name = 'Pizzas Tradicionais' AND store_id = '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid), 
 '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 1, true),

('Pizza Calabresa', 'Molho de tomate, mussarela, calabresa fatiada e cebola', 35.90, 
 (SELECT id FROM categories WHERE name = 'Pizzas Tradicionais' AND store_id = '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid), 
 '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 2, true),

('Pizza Portuguesa', 'Molho de tomate, mussarela, presunto, ovos, cebola, azeitona e ervilha', 38.90, 
 (SELECT id FROM categories WHERE name = 'Pizzas Tradicionais' AND store_id = '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid), 
 '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 3, true),

-- Pizzas Especiais  
('Pizza Quatro Queijos', 'Molho branco, mussarela, gorgonzola, parmesão e catupiry', 42.90, 
 (SELECT id FROM categories WHERE name = 'Pizzas Especiais' AND store_id = '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid), 
 '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 4, true),

('Pizza Frango com Catupiry', 'Molho de tomate, mussarela, frango desfiado e catupiry', 39.90, 
 (SELECT id FROM categories WHERE name = 'Pizzas Especiais' AND store_id = '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid), 
 '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 5, true),

('Pizza Pepperoni', 'Molho de tomate, mussarela e generosas fatias de pepperoni', 45.90, 
 (SELECT id FROM categories WHERE name = 'Pizzas Especiais' AND store_id = '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid), 
 '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 6, true),

-- Bebidas
('Coca-Cola 350ml', 'Refrigerante de cola gelado', 6.50, 
 (SELECT id FROM categories WHERE name = 'Bebidas' AND store_id = '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid), 
 '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 7, true),

('Suco de Laranja 300ml', 'Suco natural de laranja', 8.90, 
 (SELECT id FROM categories WHERE name = 'Bebidas' AND store_id = '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid), 
 '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 8, true),

-- Sobremesas
('Pudim de Leite', 'Cremoso pudim de leite condensado com calda de caramelo', 12.90, 
 (SELECT id FROM categories WHERE name = 'Sobremesas' AND store_id = '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid), 
 '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 9, true),

('Pizza Doce de Chocolate', 'Massa doce com chocolate derretido, morango e açúcar de confeiteiro', 28.90, 
 (SELECT id FROM categories WHERE name = 'Sobremesas' AND store_id = '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid), 
 '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 10, true);