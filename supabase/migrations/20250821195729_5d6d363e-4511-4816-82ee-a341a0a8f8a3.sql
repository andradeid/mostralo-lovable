-- Inserir categorias de exemplo para a pizzaria
INSERT INTO categories (name, description, store_id, display_order, is_active) VALUES
('Pizzas Tradicionais', 'Nossas deliciosas pizzas tradicionais com ingredientes frescos', '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 1, true),
('Pizzas Especiais', 'Pizzas gourmet com combinações únicas de sabores', '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 2, true),
('Bebidas', 'Refrigerantes, sucos e cervejas para acompanhar', '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 3, true),
('Sobremesas', 'Doces irresistíveis para finalizar sua refeição', '79fedd36-6e19-42d6-b331-79f9ad777180'::uuid, 4, true);