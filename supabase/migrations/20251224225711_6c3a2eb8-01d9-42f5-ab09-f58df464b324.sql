-- Inserir módulo PDV e Comandas
INSERT INTO modules (name, key, description, is_active, icon)
VALUES ('PDV e Comandas', 'pdv_comandas', 'Ponto de venda para vendas presenciais e gestão de comandas de mesa/balcão', true, 'Receipt')
ON CONFLICT (key) DO NOTHING;