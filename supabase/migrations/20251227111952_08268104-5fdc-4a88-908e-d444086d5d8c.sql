-- Atualizar módulos CORE (R$ 0,00 - Inclusos no plano base)
UPDATE modules SET suggested_price = 0.00, price_reference = 'Base essencial - Goomer cobra R$ 99,90 só por isso', dependencies = NULL WHERE key = 'digital_menu';
UPDATE modules SET suggested_price = 0.00, price_reference = 'Base essencial', dependencies = '["digital_menu"]' WHERE key = 'order_management';
UPDATE modules SET suggested_price = 0.00, price_reference = 'Base essencial', dependencies = NULL WHERE key = 'reports';
UPDATE modules SET suggested_price = 0.00, price_reference = 'Base essencial', dependencies = NULL WHERE key = 'customization';
UPDATE modules SET suggested_price = 0.00, price_reference = 'Base essencial - Goomer inclui', dependencies = '["order_management"]' WHERE key = 'delivery';

-- Atualizar módulos AVANÇADOS
UPDATE modules SET suggested_price = 19.90, price_reference = 'Gestão de funcionários', dependencies = NULL WHERE key = 'attendants';
UPDATE modules SET suggested_price = 9.90, price_reference = 'Recurso visual/promoções', dependencies = NULL WHERE key = 'banners';
UPDATE modules SET suggested_price = 29.90, price_reference = 'Datacaixa inclui no PDV R$ 80/mês', dependencies = '["order_management"]' WHERE key = 'printing';
UPDATE modules SET suggested_price = 29.90, price_reference = 'Goomer inclui no Básico', dependencies = NULL WHERE key = 'promotions';
UPDATE modules SET suggested_price = 14.90, price_reference = 'Anota AI inclui', dependencies = '["order_management"]' WHERE key = 'scheduled_orders';
UPDATE modules SET suggested_price = 39.90, price_reference = 'Gestão logística - app separado', dependencies = '["delivery"]' WHERE key = 'delivery_drivers';
UPDATE modules SET suggested_price = 19.90, price_reference = 'QR codes/cartazes', dependencies = NULL WHERE key = 'marketing_material';
UPDATE modules SET suggested_price = 59.90, price_reference = 'Goomer R$ 70-99/mês', dependencies = '["digital_menu", "order_management"]' WHERE key = 'self_service_table';
UPDATE modules SET suggested_price = 29.90, price_reference = 'Painel de senhas', dependencies = '["order_management"]' WHERE key = 'password_call';
UPDATE modules SET suggested_price = 49.90, price_reference = 'FidelizAI +R$ 99,90/mês', dependencies = '["order_management"]' WHERE key = 'whatsapp';

-- Atualizar módulos PREMIUM
UPDATE modules SET suggested_price = 79.90, price_reference = 'Goomer R$ 85/mês (plano Automatizar)', dependencies = NULL WHERE key = 'marketing';
UPDATE modules SET suggested_price = 39.90, price_reference = 'iFrames/APIs externas', dependencies = NULL WHERE key = 'integrations';
UPDATE modules SET suggested_price = 19.90, price_reference = 'Cardápio Web R$ 19,90/mês', dependencies = '["order_management"]' WHERE key = 'ifood_integration';
UPDATE modules SET suggested_price = 59.90, price_reference = 'Digital Signage ~$30-80/tela internacional', dependencies = '["digital_menu"]' WHERE key = 'digital_signage';
UPDATE modules SET suggested_price = 69.90, price_reference = 'TotalERP R$ 174/mês, Anota AI +R$ 120/mês', dependencies = NULL WHERE key = 'financial_management';
UPDATE modules SET suggested_price = 29.90, price_reference = 'Pixels/chatbots', dependencies = NULL WHERE key = 'custom_scripts';
UPDATE modules SET suggested_price = 79.90, price_reference = 'Anota AI +R$ 120/mês no Gestão Avançada', dependencies = '["order_management", "printing"]' WHERE key = 'kds';
UPDATE modules SET suggested_price = 99.90, price_reference = 'Repediu ~R$ 197/mês (até 5k contatos)', dependencies = '["whatsapp"]' WHERE key = 'whatsapp_recovery';
UPDATE modules SET suggested_price = 129.90, price_reference = 'EXCLUSIVO Mostralo - sem concorrente', dependencies = '["whatsapp"]' WHERE key = 'sentinela';
UPDATE modules SET suggested_price = 149.90, price_reference = 'Goomer R$ 199+/mês (só software)', dependencies = '["digital_menu", "order_management"]' WHERE key = 'self_service_totem';
UPDATE modules SET suggested_price = 89.90, price_reference = 'Datacaixa R$ 80/mês, Nex R$ 89/mês', dependencies = '["order_management"]' WHERE key = 'pdv_comandas';