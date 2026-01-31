-- FASE 1: Sistema de FAQ Dinâmico para Bot Master

-- 1.1 Criar tabela master_faq
CREATE TABLE public.master_faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('sales', 'support', 'recruitment')),
  question text NOT NULL,
  answer text NOT NULL,
  keywords text[] DEFAULT '{}',
  priority int DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.2 Criar tabela master_recruitment_keywords
CREATE TABLE public.master_recruitment_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 1.3 Popular keywords padrão de recrutamento
INSERT INTO public.master_recruitment_keywords (keyword) VALUES
  ('trabalhar'),
  ('vendedor'),
  ('parceiro'),
  ('comissao'),
  ('ganhar dinheiro'),
  ('renda extra'),
  ('afiliado'),
  ('representante'),
  ('vender'),
  ('oportunidade'),
  ('emprego'),
  ('vagas'),
  ('trabalho');

-- 1.4 Índices para busca eficiente
CREATE INDEX idx_master_faq_category ON public.master_faq(category);
CREATE INDEX idx_master_faq_keywords ON public.master_faq USING GIN(keywords);
CREATE INDEX idx_master_faq_active ON public.master_faq(is_active);
CREATE INDEX idx_master_faq_priority ON public.master_faq(priority DESC);
CREATE INDEX idx_master_recruitment_keywords_active ON public.master_recruitment_keywords(is_active);

-- 1.5 Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_master_faq_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_master_faq_updated_at
  BEFORE UPDATE ON public.master_faq
  FOR EACH ROW
  EXECUTE FUNCTION public.update_master_faq_updated_at();

-- 1.6 Habilitar RLS
ALTER TABLE public.master_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_recruitment_keywords ENABLE ROW LEVEL SECURITY;

-- 1.7 Políticas RLS para master_faq
-- Leitura pública (para o bot consultar)
CREATE POLICY "master_faq_public_read" ON public.master_faq
  FOR SELECT USING (true);

-- Escrita apenas para master_admin
CREATE POLICY "master_faq_admin_insert" ON public.master_faq
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'master_admin')
  );

CREATE POLICY "master_faq_admin_update" ON public.master_faq
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'master_admin')
  );

CREATE POLICY "master_faq_admin_delete" ON public.master_faq
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'master_admin')
  );

-- 1.8 Políticas RLS para master_recruitment_keywords
-- Leitura pública (para o bot consultar)
CREATE POLICY "recruitment_keywords_public_read" ON public.master_recruitment_keywords
  FOR SELECT USING (true);

-- Escrita apenas para master_admin
CREATE POLICY "recruitment_keywords_admin_insert" ON public.master_recruitment_keywords
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'master_admin')
  );

CREATE POLICY "recruitment_keywords_admin_update" ON public.master_recruitment_keywords
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'master_admin')
  );

CREATE POLICY "recruitment_keywords_admin_delete" ON public.master_recruitment_keywords
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'master_admin')
  );

-- 1.9 Popular FAQs iniciais de VENDAS
INSERT INTO public.master_faq (category, question, answer, keywords, priority) VALUES
  ('sales', 'Quanto custa o Mostralo?', 'Temos planos a partir de R$ 197,90/mês. O mais escolhido é o Avançado por R$ 397,90/mês. Todos com 0% de taxa por pedido!', ARRAY['preco', 'custo', 'valor', 'plano', 'quanto', 'mensalidade'], 10),
  ('sales', 'Tem taxa por pedido?', 'Não! O Mostralo tem 0% de taxa por pedido. Você paga apenas a mensalidade fixa e fica com 100% do seu faturamento.', ARRAY['taxa', 'comissao', 'porcentagem', 'pedido'], 10),
  ('sales', 'Quais módulos estão inclusos?', 'O Mostralo tem mais de 30 módulos: Catálogo Digital, Delivery, Agendamentos, WhatsApp Automatizado, Gestão Financeira, Fidelidade, e muito mais!', ARRAY['modulo', 'recurso', 'funcionalidade', 'incluso', 'funciona'], 9),
  ('sales', 'Funciona para meu tipo de negócio?', 'O Mostralo atende diversos nichos: restaurantes, pizzarias, farmácias, pet shops, salões de beleza, clínicas, e muito mais. Qual é o seu?', ARRAY['funciona', 'negocio', 'nicho', 'segmento', 'tipo'], 8),
  ('sales', 'Tem teste grátis?', 'Sim! Oferecemos 7 dias grátis para você testar todos os recursos da plataforma sem compromisso.', ARRAY['teste', 'experimentar', 'gratis', 'trial', 'avaliar'], 9),
  ('sales', 'Como funciona o delivery?', 'Você cadastra suas áreas de entrega com taxas personalizadas, os clientes fazem pedidos pelo cardápio digital e você recebe tudo pelo WhatsApp ou painel.', ARRAY['delivery', 'entrega', 'area', 'taxa entrega'], 8),
  ('sales', 'Preciso de site próprio?', 'Não! O Mostralo cria um link personalizado (seudominio.mostralo.com.br) para seus clientes acessarem seu cardápio digital.', ARRAY['site', 'dominio', 'link', 'url', 'pagina'], 7);

-- 1.10 Popular FAQs iniciais de SUPORTE
INSERT INTO public.master_faq (category, question, answer, keywords, priority) VALUES
  ('support', 'Como conectar o WhatsApp?', 'Acesse seu painel > WhatsApp > Conexão e escaneie o QR Code com o WhatsApp que deseja conectar. O processo leva menos de 1 minuto!', ARRAY['whatsapp', 'conectar', 'qrcode', 'qr', 'escanear'], 10),
  ('support', 'Não estou recebendo pedidos', 'Verifique: 1) Se o WhatsApp está conectado (luz verde), 2) Se a loja está aberta no horário configurado, 3) Se os produtos estão ativos no cardápio.', ARRAY['pedido', 'receber', 'notificacao', 'nao chega'], 10),
  ('support', 'Como mudar meu plano?', 'Acesse Configurações > Assinatura > Alterar Plano. Você pode fazer upgrade a qualquer momento e a diferença é calculada proporcionalmente.', ARRAY['plano', 'mudar', 'upgrade', 'trocar', 'alterar'], 8),
  ('support', 'Como cadastrar produtos?', 'Acesse Cardápio > Produtos > Novo Produto. Preencha nome, preço, foto e categoria. Você pode importar em massa via planilha também!', ARRAY['produto', 'cadastrar', 'adicionar', 'criar', 'novo'], 9),
  ('support', 'Como configurar horário de funcionamento?', 'Acesse Configurações > Horários e defina os dias e horários que sua loja aceita pedidos. Fora desse horário, o cardápio fica em modo "fechado".', ARRAY['horario', 'funcionamento', 'aberto', 'fechado', 'configurar'], 8),
  ('support', 'Esqueci minha senha', 'Na tela de login, clique em "Esqueci minha senha" e informe seu email. Você receberá um link para criar uma nova senha.', ARRAY['senha', 'esqueci', 'recuperar', 'login', 'acesso'], 9);

-- 1.11 Popular FAQs iniciais de RECRUTAMENTO (oculto)
INSERT INTO public.master_faq (category, question, answer, keywords, priority) VALUES
  ('recruitment', 'Como ser parceiro do Mostralo?', 'Acesse nosso programa de parceiros em https://mostralo.com.br/seja-vendedor e faça seu cadastro. Você ganha comissões RECORRENTES por cada cliente indicado!', ARRAY['parceiro', 'vendedor', 'indicar', 'revenda'], 10),
  ('recruitment', 'Quanto posso ganhar como parceiro?', 'Nossos parceiros ganham comissões recorrentes de até 30% sobre a mensalidade dos clientes indicados. Quanto mais indica, mais ganha!', ARRAY['ganhar', 'comissao', 'quanto', 'recorrente'], 10),
  ('recruitment', 'Preciso de CNPJ para ser parceiro?', 'Não! Para começar você não precisa de CNPJ. Pode se cadastrar como pessoa física e depois formalizar se preferir.', ARRAY['cnpj', 'mei', 'empresa', 'pessoa fisica'], 8);