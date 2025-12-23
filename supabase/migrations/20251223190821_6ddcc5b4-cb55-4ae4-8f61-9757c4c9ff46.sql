-- Criar tabela de templates do SENTINELA
CREATE TABLE sentinela_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices
CREATE INDEX idx_sentinela_templates_store_id ON sentinela_templates(store_id);
CREATE INDEX idx_sentinela_templates_category ON sentinela_templates(category);
CREATE INDEX idx_sentinela_templates_is_default ON sentinela_templates(is_default);

-- Enable RLS
ALTER TABLE sentinela_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer pessoa pode ver templates globais (is_default = true)
CREATE POLICY "Templates globais são públicos"
  ON sentinela_templates FOR SELECT
  USING (is_default = true);

-- Policy: Donos de loja podem ver seus templates
CREATE POLICY "Donos podem ver templates da loja"
  ON sentinela_templates FOR SELECT
  USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Policy: Donos podem criar templates para sua loja
CREATE POLICY "Donos podem criar templates"
  ON sentinela_templates FOR INSERT
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Policy: Donos podem editar templates da loja
CREATE POLICY "Donos podem editar templates"
  ON sentinela_templates FOR UPDATE
  USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Policy: Donos podem deletar templates da loja
CREATE POLICY "Donos podem deletar templates"
  ON sentinela_templates FOR DELETE
  USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Trigger para updated_at
CREATE TRIGGER update_sentinela_templates_updated_at
  BEFORE UPDATE ON sentinela_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_sentinela_rules_updated_at();

-- Inserir 20 templates globais pré-definidos (5 categorias x 4 templates)

-- Categoria: RECOMPRA (4 templates)
INSERT INTO sentinela_templates (store_id, category, name, content, is_default) VALUES
(NULL, 'recompra', 'Lembrete Simples', E'Oi {primeiro_nome}! 👋\n\nLembrete: seu {produto} da {loja} pode estar acabando.\n\nQuer que eu ajude com um novo pedido? 🛒\n\n{link_loja}', true),
(NULL, 'recompra', 'Reposição Amigável', E'{primeiro_nome}, já faz um tempo desde a última compra de {produto}! 📦\n\nTa na hora de repor?\n\n🛒 {link_loja}', true),
(NULL, 'recompra', 'Recompra Direta', E'Olá {nome}!\n\nSegundo nossos registros, seu {produto} deve estar acabando.\n\nGaranta o seu! 📦\n\n{link_loja}', true),
(NULL, 'recompra', 'Check-in Produto', E'Ei {primeiro_nome}! 😊\n\nComo está indo com o {produto}?\n\nSe precisar repor, estamos aqui!\n\n{link_loja}', true);

-- Categoria: LEMBRETE SUAVE (4 templates)
INSERT INTO sentinela_templates (store_id, category, name, content, is_default) VALUES
(NULL, 'lembrete_suave', 'Batendo na Porta', E'Oi {primeiro_nome}! 🚪\n\nPassando só pra lembrar que seu {produto} favorito pode estar acabando.\n\nPrecisa de mais?\n\n{link_loja}', true),
(NULL, 'lembrete_suave', 'Pensando em Você', E'{primeiro_nome}, lembramos de você! 💭\n\nHora de repor seu {produto}?\n\n{link_loja}', true),
(NULL, 'lembrete_suave', 'Gentil Lembrete', E'Olá {nome}! 💚\n\nUm lembrete carinhoso da {loja}: talvez seja hora de um novo {produto}!\n\n{link_loja}', true),
(NULL, 'lembrete_suave', 'Ainda Tem?', E'{primeiro_nome}, ainda tem {produto} aí?\n\nSe estiver acabando, a gente entrega rapidinho! 🚚\n\n{link_loja}', true);

-- Categoria: URGÊNCIA (4 templates)
INSERT INTO sentinela_templates (store_id, category, name, content, is_default) VALUES
(NULL, 'urgencia', 'Últimas Unidades', E'⚡ {primeiro_nome}!\n\nSeu {produto} pode estar no fim.\n\nGaranta já antes que acabe no estoque!\n\n{link_loja}', true),
(NULL, 'urgencia', 'Não Fique Sem', E'🚨 {nome}!\n\nNão fique sem seu {produto}!\n\nFaça seu pedido agora: {link_loja}', true),
(NULL, 'urgencia', 'Corre que Acaba', E'{primeiro_nome}, corre! 🏃\n\nSeu {produto} está acabando e você não pode ficar sem!\n\nPeça já: {link_loja}', true),
(NULL, 'urgencia', 'Aviso Importante', E'⚠️ Atenção {nome}!\n\nDetectamos que seu {produto} pode estar no fim.\n\nReponha com urgência!\n\n{link_loja}', true);

-- Categoria: PROMOCIONAL (4 templates)
INSERT INTO sentinela_templates (store_id, category, name, content, is_default) VALUES
(NULL, 'promocional', 'Desconto Especial', E'🎁 {primeiro_nome}!\n\nTemos um desconto especial na sua recompra de {produto}!\n\nAproveite: {link_loja}', true),
(NULL, 'promocional', 'Oferta Recompra', E'{nome}, cliente especial tem vantagens! 🌟\n\nNa sua próxima compra de {produto}, condições exclusivas!\n\n{link_loja}', true),
(NULL, 'promocional', 'Volta com Presente', E'Ei {primeiro_nome}! 🎀\n\nVolte para repor seu {produto} e ganhe um mimo da {loja}!\n\n{link_loja}', true),
(NULL, 'promocional', 'Promoção Fidelidade', E'💎 {primeiro_nome}, valorizamos sua fidelidade!\n\nDesconto na sua recompra de {produto}!\n\n{link_loja}', true);

-- Categoria: FIDELIDADE (4 templates)
INSERT INTO sentinela_templates (store_id, category, name, content, is_default) VALUES
(NULL, 'fidelidade', 'Cliente VIP', E'{primeiro_nome}, você é VIP aqui na {loja}! 👑\n\nNão deixe seu {produto} favorito acabar!\n\n{link_loja}', true),
(NULL, 'fidelidade', 'Parceria Forte', E'Olá {nome}!\n\nNossa parceria é importante! 🤝\n\nHora de renovar seu estoque de {produto}?\n\n{link_loja}', true),
(NULL, 'fidelidade', 'Você Faz Falta', E'{primeiro_nome}, sentimos sua falta! 💚\n\nVolte para repor seu {produto}.\n\nEstamos te esperando!\n\n{link_loja}', true),
(NULL, 'fidelidade', 'Relacionamento', E'{nome}, faz tempo que não nos falamos! 😊\n\nComo está seu {produto}?\n\nPrecisando de mais?\n\n{link_loja}', true);