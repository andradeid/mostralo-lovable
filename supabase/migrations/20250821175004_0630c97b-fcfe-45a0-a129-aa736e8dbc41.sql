-- Inserir uma loja de exemplo para teste
INSERT INTO public.profiles (id, email, full_name, user_type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'pizzaria@exemplo.com', 'João da Pizzaria', 'store_admin');

INSERT INTO public.stores (id, owner_id, plan_id, name, slug, description, phone, address, status) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  p.id,
  'Pizzaria do João',
  'pizzaria-do-joao',
  'A melhor pizzaria da cidade com sabores únicos e massa artesanal',
  '(11) 99999-9999',
  'Rua das Pizzas, 123 - Centro',
  'active'
FROM public.plans p WHERE p.name = 'Profissional';

-- Inserir categorias de exemplo
INSERT INTO public.categories (store_id, name, description, display_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Pizzas Tradicionais', 'Nossas pizzas clássicas com ingredientes frescos', 1),
  ('00000000-0000-0000-0000-000000000001', 'Pizzas Premium', 'Sabores exclusivos com ingredientes especiais', 2),
  ('00000000-0000-0000-0000-000000000001', 'Bebidas', 'Refrigerantes, sucos e água', 3),
  ('00000000-0000-0000-0000-000000000001', 'Sobremesas', 'Doces para finalizar sua refeição', 4);

-- Inserir produtos de exemplo
INSERT INTO public.products (store_id, category_id, name, description, price, display_order) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  c.id,
  'Pizza Margherita',
  'Molho de tomate, mussarela, manjericão fresco e azeite',
  35.90,
  1
FROM public.categories c 
WHERE c.store_id = '00000000-0000-0000-0000-000000000001' AND c.name = 'Pizzas Tradicionais';

INSERT INTO public.products (store_id, category_id, name, description, price, display_order) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  c.id,
  'Pizza Pepperoni',
  'Molho de tomate, mussarela e pepperoni',
  39.90,
  2
FROM public.categories c 
WHERE c.store_id = '00000000-0000-0000-0000-000000000001' AND c.name = 'Pizzas Tradicionais';

INSERT INTO public.products (store_id, category_id, name, description, price, display_order) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  c.id,
  'Pizza Portuguesa',
  'Molho de tomate, mussarela, presunto, ovos, cebola, azeitona e orégano',
  42.90,
  3
FROM public.categories c 
WHERE c.store_id = '00000000-0000-0000-0000-000000000001' AND c.name = 'Pizzas Tradicionais';

INSERT INTO public.products (store_id, category_id, name, description, price, display_order) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  c.id,
  'Pizza Trufa Negra',
  'Molho branco, mussarela especial, trufa negra, rúcula e parmesão',
  89.90,
  1
FROM public.categories c 
WHERE c.store_id = '00000000-0000-0000-0000-000000000001' AND c.name = 'Pizzas Premium';

INSERT INTO public.products (store_id, category_id, name, description, price, display_order) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  c.id,
  'Pizza Salmão',
  'Molho branco, mussarela, salmão defumado, alcaparras e cream cheese',
  75.90,
  2
FROM public.categories c 
WHERE c.store_id = '00000000-0000-0000-0000-000000000001' AND c.name = 'Pizzas Premium';

INSERT INTO public.products (store_id, category_id, name, description, price, display_order) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  c.id,
  'Coca-Cola 350ml',
  'Refrigerante tradicional gelado',
  5.90,
  1
FROM public.categories c 
WHERE c.store_id = '00000000-0000-0000-0000-000000000001' AND c.name = 'Bebidas';

INSERT INTO public.products (store_id, category_id, name, description, price, display_order) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  c.id,
  'Água Mineral 500ml',
  'Água mineral natural',
  3.90,
  2
FROM public.categories c 
WHERE c.store_id = '00000000-0000-0000-0000-000000000001' AND c.name = 'Bebidas';

INSERT INTO public.products (store_id, category_id, name, description, price, display_order) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  c.id,
  'Petit Gateau',
  'Bolinho de chocolate quente com sorvete de baunilha',
  18.90,
  1
FROM public.categories c 
WHERE c.store_id = '00000000-0000-0000-0000-000000000001' AND c.name = 'Sobremesas';

INSERT INTO public.products (store_id, category_id, name, description, price, display_order) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  c.id,
  'Pudim da Casa',
  'Pudim de leite condensado com calda de caramelo',
  12.90,
  2
FROM public.categories c 
WHERE c.store_id = '00000000-0000-0000-0000-000000000001' AND c.name = 'Sobremesas';