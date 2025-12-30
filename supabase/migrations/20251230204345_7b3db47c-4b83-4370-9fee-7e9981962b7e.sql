
-- Atualizar valores de referência de mercado para módulos restantes
UPDATE modules SET price_reference = 'Saipos R$ 50-100/mês, GrandChef R$ 89/mês (módulo funcionários)' WHERE key = 'attendants';
UPDATE modules SET price_reference = 'Goomer inclui no plano, Consumer R$ 20-40/mês, funcionalidade padrão' WHERE key = 'banners';
UPDATE modules SET price_reference = 'Google Tag Manager gratuito, integrações premium R$ 50-150/mês' WHERE key = 'custom_scripts';
UPDATE modules SET price_reference = 'Loggi/Lalamove R$ 10-20/entrega, apps próprios R$ 100-200/mês' WHERE key = 'delivery_drivers';
UPDATE modules SET price_reference = 'Sistemas de senha R$ 50-150/mês, hardware+software R$ 200+/mês' WHERE key = 'password_call';
UPDATE modules SET price_reference = 'Zapier R$ 70-200/mês, integrações customizadas R$ 100-300/mês' WHERE key = 'integrations';
UPDATE modules SET price_reference = 'Canva Pro R$ 55/mês, design freelancer R$ 100-500/job' WHERE key = 'marketing_material';
UPDATE modules SET price_reference = 'Goomer R$ 99,90/mês (incluso), plataformas de cupons R$ 50-100/mês' WHERE key = 'promotions';
