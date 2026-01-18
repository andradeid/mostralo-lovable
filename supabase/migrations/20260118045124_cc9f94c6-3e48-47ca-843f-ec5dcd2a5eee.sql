-- Inserir templates padrão para propostas comerciais
INSERT INTO whatsapp_templates (store_id, name, category, message_type, content, is_active, is_default)
VALUES 
-- Templates de Proposta Comercial
(NULL, 'Envio de Proposta - Formal', 'proposta', 'text', E'Olá {nome}! 👋\n\nSua proposta comercial personalizada está pronta!\n\n💰 Valor mensal: {valor_mensal}\n📋 Cobrança: {ciclo_cobranca}\n📅 Válida até: {validade}\n\nAcesse aqui para conferir todos os detalhes:\n{link_proposta}\n\nQualquer dúvida, estou à disposição! 😊', true, true),

(NULL, 'Envio de Proposta - Descontraído', 'proposta', 'text', E'E aí, {primeiro_nome}! 🚀\n\nPreparei uma proposta especial pra você!\n\n✨ Valor: {valor_mensal}/mês\n🎯 Pagamento: {ciclo_cobranca}\n\nDá uma olhada:\n{link_proposta}\n\nVamos fechar esse projeto? 💪', true, true),

(NULL, 'Lembrete de Proposta', 'proposta', 'text', E'Oi {primeiro_nome}! 😊\n\nPassando pra lembrar que sua proposta comercial ainda está disponível!\n\n⏰ Válida até: {validade}\n💰 Valor: {valor_mensal}\n\nAcesse: {link_proposta}\n\nPosso te ajudar com alguma dúvida?', true, true),

(NULL, 'Proposta Urgente', 'proposta', 'text', E'🔔 {nome}, atenção!\n\nSua proposta comercial está próxima de expirar!\n\n📅 Validade: {validade}\n💰 Valor total: {valor_total}\n\nNão perca essa oportunidade:\n{link_proposta}\n\nEstou à disposição para fecharmos! 🤝', true, true),

(NULL, 'Follow-up Proposta', 'proposta', 'text', E'Oi {primeiro_nome}! 👋\n\nTudo bem? Conseguiu dar uma olhada na proposta que enviei?\n\n{link_proposta}\n\nFico no aguardo do seu retorno! Qualquer ajuste que precisar, é só falar. 😉', true, true)

ON CONFLICT DO NOTHING;