-- Atualizar módulo Agendamento com valores de mercado
UPDATE modules 
SET 
  suggested_price = 69.90,
  price_reference = 'Simples Agenda R$ 39,90, Trinks R$ 72+, SimplyBook ~R$ 150/mês'
WHERE key = 'booking';

-- Atualizar módulo Vendas Sugeridas com valores de mercado
UPDATE modules 
SET 
  suggested_price = 59.90,
  price_reference = 'Goomer Automatizar R$ 85/mês, funcionalidade premium em plataformas SaaS'
WHERE key = 'upsell';