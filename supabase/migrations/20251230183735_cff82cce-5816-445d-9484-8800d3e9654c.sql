-- Adicionar categoria "Vendas iFood" para separar receita do iFood
INSERT INTO financial_categories (name, type, description, is_system, is_active, icon, color)
VALUES ('Vendas iFood', 'income', 'Vendas realizadas através do iFood', true, true, 'Smartphone', '#ea1d2c')
ON CONFLICT DO NOTHING;