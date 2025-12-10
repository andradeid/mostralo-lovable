-- 1. Permitir NULL na coluna store_id para templates globais
ALTER TABLE whatsapp_templates ALTER COLUMN store_id DROP NOT NULL;

-- 2. Adicionar coluna is_default
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- 3. Inserir os 20 templates padrão globais

-- BOAS-VINDAS (4 templates)
INSERT INTO whatsapp_templates (store_id, name, category, message_type, content, is_active, is_default)
VALUES 
(NULL, 'Boas-vindas Novo Cliente', 'boas_vindas', 'text', E'Olá {primeiro_nome}! 👋\n\nSeja muito bem-vindo(a) à {loja}! 🎉\n\nEstamos muito felizes em ter você conosco. Confira nosso cardápio completo:\n{link_loja}\n\nQualquer dúvida, é só chamar! 😊', true, true),

(NULL, 'Boas-vindas com Promoção', 'boas_vindas', 'text', E'Ei {primeiro_nome}! 🙌\n\nBem-vindo(a) à {loja}!\n\nPara comemorar seu cadastro, separamos uma surpresa especial para você no próximo pedido! 🎁\n\nAcesse: {link_loja}\n\nAproveite! 🍕', true, true),

(NULL, 'Boas-vindas Formal', 'boas_vindas', 'text', E'Prezado(a) {nome},\n\nÉ um prazer recebê-lo(a) na {loja}!\n\nNosso compromisso é oferecer a melhor experiência em cada pedido.\n\nConheça nosso cardápio: {link_loja}\n\nAtenciosamente,\nEquipe {loja}', true, true),

(NULL, 'Boas-vindas Descontraído', 'boas_vindas', 'text', E'E aí, {primeiro_nome}! 🔥\n\nBem-vindo(a) ao time da {loja}!\n\nTá com fome? Bora fazer seu primeiro pedido! 🚀\n\n👉 {link_loja}\n\nTe esperamos! 😋', true, true),

-- RECUPERAÇÃO (6 templates)
(NULL, 'Recuperação 7 dias', 'recuperacao', 'text', E'Oi {primeiro_nome}! 👋\n\nSentimos sua falta aqui na {loja}! 😢\n\nJá faz {dias_inativo} dias que você não aparece... Temos novidades esperando por você!\n\n📱 {link_loja}\n\nVolta logo! 💚', true, true),

(NULL, 'Recuperação 15 dias', 'recuperacao', 'text', E'{primeiro_nome}, tudo bem? 🤔\n\nVocê sumiu da {loja}! Já são {dias_inativo} dias sem sua visita.\n\nSabemos que a vida é corrida, mas quando bater aquela fome, estamos aqui!\n\n{link_loja}', true, true),

(NULL, 'Recuperação 30 dias', 'recuperacao', 'text', E'Ei {primeiro_nome}! 😊\n\nFaz tempo que não nos vemos... {dias_inativo} dias para ser exato!\n\nSeu último pedido foi em {ultimo_pedido} e já estamos com saudades.\n\nQue tal matar a vontade?\n{link_loja}', true, true),

(NULL, 'Recuperação VIP', 'recuperacao', 'text', E'Olá {nome}! ⭐\n\nVocê é um cliente especial da {loja}! Já fez {total_pedidos} pedidos conosco.\n\nNotamos que está há {dias_inativo} dias sem pedir... está tudo bem?\n\nQueremos você de volta! 💚\n{link_loja}', true, true),

(NULL, 'Recuperação Informal', 'recuperacao', 'text', E'Opa {primeiro_nome}! 🍕\n\nCadê você?! A galera aqui da {loja} está perguntando!\n\n{dias_inativo} dias sem te ver... Isso não pode acontecer! 😅\n\nBora pedir hoje?\n{link_loja}', true, true),

(NULL, 'Recuperação com Incentivo', 'recuperacao', 'text', E'{primeiro_nome}, sentimos sua falta! 😢\n\nPara provar quanto queremos você de volta, preparamos algo especial no seu próximo pedido!\n\nÉ só acessar:\n{link_loja}\n\nNão perca! 🎁', true, true),

-- PROMOÇÃO (5 templates)
(NULL, 'Promoção Geral', 'promocao', 'text', E'🚨 PROMOÇÃO {loja}! 🚨\n\nOi {primeiro_nome}!\n\nTemos ofertas imperdíveis te esperando hoje!\n\nCorre conferir:\n{link_loja}\n\nVálido por tempo limitado! ⏰', true, true),

(NULL, 'Promoção Fim de Semana', 'promocao', 'text', E'Oi {primeiro_nome}! 🎉\n\nFim de semana chegou e a {loja} preparou promoções especiais!\n\n🍔 Confira as ofertas:\n{link_loja}\n\nBom apetite! 😋', true, true),

(NULL, 'Promoção Exclusiva', 'promocao', 'text', E'{primeiro_nome}, você é especial! ⭐\n\nComo cliente fiel da {loja} (já são {total_pedidos} pedidos!), você tem acesso a promoções exclusivas!\n\n👉 {link_loja}\n\nAproveite! 🎁', true, true),

(NULL, 'Lançamento', 'promocao', 'text', E'🆕 NOVIDADE NA {loja}!\n\nOi {primeiro_nome}!\n\nTemos lançamentos fresquinhos no cardápio e você precisa experimentar!\n\nVeja agora:\n{link_loja}\n\nConta pra gente o que achou! 😊', true, true),

(NULL, 'Promoção Relâmpago', 'promocao', 'text', E'⚡ PROMOÇÃO RELÂMPAGO ⚡\n\n{primeiro_nome}, corre!\n\nA {loja} está com desconto especial por poucas horas!\n\nNão perde tempo:\n{link_loja}\n\n⏰ Aproveita!', true, true),

-- AGRADECIMENTO (5 templates)
(NULL, 'Agradecimento Pedido', 'agradecimento', 'text', E'Oi {primeiro_nome}! 💚\n\nMuito obrigado pelo seu pedido na {loja}!\n\nEsperamos que goste. Qualquer coisa, estamos aqui!\n\nAté a próxima! 😊', true, true),

(NULL, 'Agradecimento Cliente Fiel', 'agradecimento', 'text', E'{nome}, você é demais! 🌟\n\nJá são {total_pedidos} pedidos com a gente, totalizando R$ {total_gasto}!\n\nObrigado por confiar na {loja}. Você faz parte da nossa história! 💚', true, true),

(NULL, 'Agradecimento Avaliação', 'agradecimento', 'text', E'Oi {primeiro_nome}! 😊\n\nSeu feedback é muito importante para nós!\n\nSe puder, avalie seu último pedido da {loja}. Isso nos ajuda a melhorar sempre!\n\nObrigado! 💚', true, true),

(NULL, 'Agradecimento Indicação', 'agradecimento', 'text', E'{primeiro_nome}! 🙌\n\nSoubemos que você indicou a {loja} para amigos. Muito obrigado!\n\nIndicações como a sua nos fazem crescer. Você é especial para nós! 💚\n\n{link_loja}', true, true),

(NULL, 'Agradecimento Especial', 'agradecimento', 'text', E'Querido(a) {nome},\n\nA equipe {loja} quer agradecer por sua preferência! 🙏\n\nCada pedido seu nos motiva a melhorar. Obrigado por fazer parte dessa jornada!\n\nCom carinho,\nEquipe {loja} 💚', true, true);

-- 4. Criar política RLS para permitir leitura dos templates padrão por todos
CREATE POLICY "Anyone can view default templates"
ON whatsapp_templates
FOR SELECT
USING (is_default = true AND store_id IS NULL);