-- Tabela para templates de contrato do lojista
CREATE TABLE public.merchant_contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela para registro de aceite de contrato
CREATE TABLE public.merchant_contract_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id UUID REFERENCES public.stores(id),
  contract_version VARCHAR(20) NOT NULL,
  contract_template_id UUID REFERENCES public.merchant_contract_templates(id),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  verification_hash VARCHAR(64) UNIQUE,
  terms_accepted BOOLEAN DEFAULT false,
  privacy_accepted BOOLEAN DEFAULT false,
  cookies_accepted BOOLEAN DEFAULT false,
  marketing_accepted BOOLEAN DEFAULT false,
  business_info_declaration BOOLEAN DEFAULT false,
  company_authorization BOOLEAN DEFAULT false,
  compliance_commitment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.merchant_contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_contract_acceptance ENABLE ROW LEVEL SECURITY;

-- Políticas para templates
CREATE POLICY "Anyone can view active templates"
ON public.merchant_contract_templates FOR SELECT
USING (is_active = true);

CREATE POLICY "Master admins can manage templates"
ON public.merchant_contract_templates FOR ALL
USING (has_role(auth.uid(), 'master_admin'))
WITH CHECK (has_role(auth.uid(), 'master_admin'));

-- Políticas para aceites
CREATE POLICY "Users can view their own acceptances"
ON public.merchant_contract_acceptance FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own acceptance"
ON public.merchant_contract_acceptance FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Master admins can view all acceptances"
ON public.merchant_contract_acceptance FOR SELECT
USING (has_role(auth.uid(), 'master_admin'));

-- Índices para performance
CREATE INDEX idx_merchant_contract_acceptance_user_id ON public.merchant_contract_acceptance(user_id);
CREATE INDEX idx_merchant_contract_acceptance_store_id ON public.merchant_contract_acceptance(store_id);
CREATE INDEX idx_merchant_contract_acceptance_hash ON public.merchant_contract_acceptance(verification_hash);

-- Inserir template padrão ativo
INSERT INTO public.merchant_contract_templates (version, title, content, is_active) VALUES (
  '1.0',
  'Contrato de Prestação de Serviços - Mostralo',
  E'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE PLATAFORMA DIGITAL

MOSTRALO TECNOLOGIA LTDA, pessoa jurídica de direito privado, doravante denominada CONTRATADA, e de outro lado o CONTRATANTE identificado no cadastro eletrônico, celebram o presente Contrato de Prestação de Serviços de Plataforma Digital, que se regerá pelas seguintes cláusulas e condições:

CLÁUSULA 1ª - DO OBJETO
1.1. O presente contrato tem por objeto a prestação de serviços de plataforma digital SaaS (Software as a Service) para criação e gestão de cardápio digital, sistema de pedidos online, e ferramentas de marketing digital.
1.2. Os serviços incluem: cardápio digital personalizado, sistema de gestão de pedidos, integração com WhatsApp, relatórios de vendas, e demais funcionalidades descritas no plano contratado.

CLÁUSULA 2ª - DAS OBRIGAÇÕES DA CONTRATADA
2.1. Disponibilizar a plataforma com disponibilidade mínima de 99,5% (noventa e nove vírgula cinco por cento) ao mês.
2.2. Fornecer suporte técnico via canais oficiais durante o horário comercial.
2.3. Manter a segurança e confidencialidade dos dados do CONTRATANTE conforme LGPD.
2.4. Realizar backups periódicos dos dados da plataforma.
2.5. Notificar previamente sobre manutenções programadas.

CLÁUSULA 3ª - DAS OBRIGAÇÕES DO CONTRATANTE
3.1. Efetuar o pagamento nas datas estabelecidas.
3.2. Fornecer informações verdadeiras e atualizadas no cadastro.
3.3. Responsabilizar-se integralmente pelo conteúdo publicado (produtos, preços, imagens, descrições).
3.4. Cumprir todas as normas sanitárias, fiscais e trabalhistas aplicáveis ao seu negócio.
3.5. Não utilizar a plataforma para fins ilícitos ou que violem direitos de terceiros.
3.6. Manter suas credenciais de acesso em sigilo.

CLÁUSULA 4ª - DOS VALORES E PAGAMENTO
4.1. O CONTRATANTE pagará o valor correspondente ao plano escolhido conforme tabela vigente.
4.2. Os pagamentos serão realizados conforme ciclo de cobrança do plano (mensal, trimestral, semestral ou anual).
4.3. O não pagamento por mais de 15 (quinze) dias acarretará suspensão temporária do serviço.
4.4. O não pagamento por mais de 30 (trinta) dias acarretará cancelamento do contrato e exclusão dos dados após 90 dias.
4.5. Os valores poderão ser reajustados anualmente pelo IPCA ou índice que o substitua.

CLÁUSULA 5ª - DO PRAZO E RESCISÃO
5.1. Este contrato vigorará por prazo indeterminado, iniciando-se na data de aceite eletrônico.
5.2. Qualquer das partes poderá rescindir o contrato mediante comunicação com 30 (trinta) dias de antecedência.
5.3. O CONTRATANTE poderá solicitar cancelamento a qualquer momento, sendo devido o valor proporcional até a data de cancelamento.
5.4. Não haverá reembolso de valores já pagos para períodos já utilizados.

CLÁUSULA 6ª - DA PROPRIEDADE INTELECTUAL
6.1. A plataforma, marca, software e tecnologia permanecem de propriedade exclusiva da CONTRATADA.
6.2. O conteúdo inserido pelo CONTRATANTE (produtos, imagens, textos) permanece de sua propriedade.
6.3. A CONTRATADA poderá utilizar dados anonimizados para fins estatísticos e melhoria do serviço.

CLÁUSULA 7ª - DA PROTEÇÃO DE DADOS (LGPD)
7.1. A CONTRATADA atuará como operadora dos dados pessoais dos clientes do CONTRATANTE.
7.2. Os dados serão tratados exclusivamente para execução do serviço contratado.
7.3. A CONTRATADA implementa medidas técnicas e organizacionais de segurança conforme as melhores práticas.
7.4. O CONTRATANTE é responsável por obter consentimento de seus clientes para tratamento de dados.
7.5. Em caso de incidente de segurança, a CONTRATADA notificará o CONTRATANTE em até 48 horas.

CLÁUSULA 8ª - DA LIMITAÇÃO DE RESPONSABILIDADE
8.1. A CONTRATADA não se responsabiliza por danos indiretos, lucros cessantes ou perda de oportunidade de negócio.
8.2. A responsabilidade da CONTRATADA limita-se ao valor pago pelo CONTRATANTE nos últimos 12 meses.
8.3. A CONTRATADA não se responsabiliza por indisponibilidades causadas por terceiros (provedores, internet, etc.).

CLÁUSULA 9ª - DO FORO
9.1. Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer questões oriundas deste contrato, com renúncia expressa de qualquer outro, por mais privilegiado que seja.

Este contrato entra em vigor na data do aceite eletrônico, momento em que o CONTRATANTE declara ter lido, compreendido e concordado com todas as cláusulas aqui estabelecidas.',
  true
);