-- =============================================
-- SISTEMA DE RE-ACEITE DE TERMOS
-- =============================================

-- 1. Adicionar colunas em profiles para controle de versão aceita
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS accepted_terms_version VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Criar tabela de configuração global de termos
CREATE TABLE IF NOT EXISTS system_terms_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR NOT NULL UNIQUE,
  config_value VARCHAR NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 3. Inserir configurações iniciais de versão
INSERT INTO system_terms_config (config_key, config_value, description) VALUES
  ('current_terms_version', '1.1', 'Versão atual dos Termos de Uso'),
  ('current_privacy_version', '1.0', 'Versão atual da Política de Privacidade'),
  ('terms_changelog', 'Adicionada Cláusula 10 - Evolução e Alteração Contratual: direito de modificar termos visando sustentabilidade do negócio com notificação de 30 dias.', 'Descrição das últimas alterações')
ON CONFLICT (config_key) DO NOTHING;

-- 4. RLS para system_terms_config
ALTER TABLE system_terms_config ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ler configurações
CREATE POLICY "Authenticated users can read terms config"
ON system_terms_config FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Apenas master_admin pode modificar
CREATE POLICY "Master admins can manage terms config"
ON system_terms_config FOR ALL
USING (has_role(auth.uid(), 'master_admin'))
WITH CHECK (has_role(auth.uid(), 'master_admin'));

-- 5. Atualizar merchant_contract_templates para versão 1.1 com nova cláusula
UPDATE merchant_contract_templates 
SET 
  is_active = false
WHERE is_active = true;

INSERT INTO merchant_contract_templates (version, title, content, is_active, created_by)
VALUES (
  '1.1',
  'Contrato de Prestação de Serviços - Mostralo',
  '# CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE PLATAFORMA DIGITAL

## TERMOS E CONDIÇÕES GERAIS DE USO DA PLATAFORMA MOSTRALO

---

### IDENTIFICAÇÃO DAS PARTES

**CONTRATADA:** MOSTRALO TECNOLOGIA LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº [CNPJ], com sede em [Endereço], doravante denominada simplesmente "MOSTRALO" ou "CONTRATADA".

**CONTRATANTE:** Pessoa física ou jurídica identificada no cadastro da plataforma, que aceita os presentes termos e condições, doravante denominada simplesmente "LOJISTA" ou "CONTRATANTE".

---

### CLÁUSULA 1ª - DO OBJETO

1.1. O presente contrato tem por objeto a prestação de serviços de disponibilização de plataforma digital para criação e gestão de cardápio/catálogo online, gerenciamento de pedidos, e ferramentas de marketing digital, conforme plano contratado pelo CONTRATANTE.

1.2. Os serviços incluem:
   a) Criação e hospedagem de loja virtual personalizada
   b) Sistema de gerenciamento de pedidos em tempo real
   c) Ferramentas de marketing digital e agendamento de posts
   d) Integração com meios de pagamento (quando disponível)
   e) Suporte técnico via canais oficiais
   f) Atualizações e melhorias contínuas da plataforma

---

### CLÁUSULA 2ª - DAS OBRIGAÇÕES DA CONTRATADA

2.1. Disponibilizar a plataforma em funcionamento 24 horas por dia, 7 dias por semana, ressalvadas as interrupções programadas para manutenção, devidamente comunicadas com antecedência mínima de 24 horas.

2.2. Garantir a segurança e integridade dos dados armazenados, em conformidade com a Lei Geral de Proteção de Dados (LGPD).

2.3. Fornecer suporte técnico para utilização da plataforma durante horário comercial.

2.4. Manter backup dos dados por período mínimo de 30 dias.

2.5. Comunicar alterações relevantes nos termos de uso ou funcionalidades com antecedência mínima de 30 dias.

---

### CLÁUSULA 3ª - DAS OBRIGAÇÕES DO CONTRATANTE

3.1. Efetuar o pagamento da mensalidade do plano contratado até a data de vencimento.

3.2. Fornecer informações verdadeiras e atualizadas no cadastro e manter os dados sempre atualizados.

3.3. Utilizar a plataforma de acordo com a legislação vigente e os presentes termos.

3.4. Não utilizar a plataforma para atividades ilícitas, fraudulentas ou que violem direitos de terceiros.

3.5. Responsabilizar-se integralmente pelo conteúdo publicado em sua loja virtual.

3.6. Manter sigilo sobre credenciais de acesso e dados sensíveis.

3.7. Possuir CNPJ ativo ou CPF regular para operação comercial.

---

### CLÁUSULA 4ª - DOS PAGAMENTOS

4.1. O CONTRATANTE compromete-se a pagar a mensalidade do plano contratado conforme valores vigentes na data da contratação.

4.2. O não pagamento até a data de vencimento acarretará:
   a) Multa de 2% sobre o valor devido
   b) Juros de mora de 1% ao mês, calculados pro rata die
   c) Suspensão dos serviços após 5 dias de inadimplência
   d) Cancelamento automático após 30 dias de inadimplência

4.3. A reativação após cancelamento por inadimplência está condicionada ao pagamento integral dos débitos pendentes.

4.4. Eventuais reajustes serão comunicados com antecedência mínima de 30 dias e entrarão em vigor no próximo ciclo de faturamento.

---

### CLÁUSULA 5ª - DA RESCISÃO

5.1. O presente contrato poderá ser rescindido:
   a) Por qualquer das partes, mediante comunicação com antecedência de 30 dias
   b) Imediatamente, em caso de violação grave dos termos
   c) Por inadimplência superior a 30 dias
   d) Por discordância com alterações contratuais, sem aplicação de multas

5.2. Não haverá reembolso de valores já pagos em caso de rescisão, ressalvado o disposto na Cláusula 10ª.

5.3. Após a rescisão, os dados do CONTRATANTE permanecerão disponíveis para exportação por 30 dias.

---

### CLÁUSULA 6ª - DA PROPRIEDADE INTELECTUAL

6.1. A plataforma MOSTRALO, incluindo código-fonte, layout, funcionalidades e marca, são de propriedade exclusiva da CONTRATADA.

6.2. O CONTRATANTE mantém a propriedade sobre todo conteúdo por ele inserido na plataforma (textos, imagens, produtos, etc.).

6.3. O CONTRATANTE concede à CONTRATADA licença não exclusiva para utilização de seu nome e logo para fins de divulgação da plataforma como case de sucesso.

---

### CLÁUSULA 7ª - DA PROTEÇÃO DE DADOS (LGPD)

7.1. A CONTRATADA atua como operadora de dados no que se refere aos dados dos clientes do CONTRATANTE, seguindo as instruções deste para o tratamento.

7.2. A CONTRATADA compromete-se a:
   a) Tratar os dados apenas para as finalidades previstas neste contrato
   b) Implementar medidas técnicas e organizacionais de segurança adequadas
   c) Comunicar incidentes de segurança que possam afetar os dados
   d) Garantir que funcionários e subcontratados estejam sob obrigação de confidencialidade

7.3. O CONTRATANTE é o controlador dos dados de seus clientes e responsável por garantir base legal para o tratamento.

7.4. A CONTRATADA disponibilizará ferramentas para que o CONTRATANTE atenda às solicitações de titulares de dados.

---

### CLÁUSULA 8ª - DA LIMITAÇÃO DE RESPONSABILIDADE

8.1. A CONTRATADA não se responsabiliza por:
   a) Lucros cessantes ou danos indiretos decorrentes do uso ou impossibilidade de uso da plataforma
   b) Conteúdo inserido pelo CONTRATANTE
   c) Problemas causados por terceiros (provedores de internet, operadoras, etc.)
   d) Indisponibilidades decorrentes de força maior ou caso fortuito

8.2. A responsabilidade total da CONTRATADA está limitada ao valor equivalente a 3 (três) mensalidades do plano contratado.

---

### CLÁUSULA 9ª - DA CONFIDENCIALIDADE

9.1. As partes comprometem-se a manter sigilo sobre informações confidenciais trocadas durante a vigência deste contrato.

9.2. Esta obrigação permanece válida por 2 (dois) anos após o término do contrato.

---

### CLÁUSULA 10ª - DA EVOLUÇÃO E ALTERAÇÃO CONTRATUAL

10.1. A CONTRATADA reserva-se o direito de promover alterações, atualizações e melhorias nestes termos contratuais a qualquer momento, visando:
   a) A sustentabilidade operacional e financeira da empresa
   b) A melhoria contínua dos serviços oferecidos
   c) A adequação às mudanças do mercado, legislação ou tecnologia
   d) A proteção dos interesses legítimos de todas as partes
   e) O aprimoramento da experiência do usuário

10.2. As alterações serão comunicadas ao CONTRATANTE com antecedência mínima de 30 (trinta) dias através dos canais oficiais de comunicação (e-mail cadastrado, plataforma ou WhatsApp vinculado).

10.3. O silêncio ou a continuidade do uso dos serviços após o período de notificação e confirmação de aceite será considerado como concordância tácita das novas condições.

10.4. Caso o CONTRATANTE não concorde com as alterações propostas, poderá solicitar a rescisão do contrato sem multas ou penalidades, desde que manifestada no prazo de 30 (trinta) dias contados da notificação.

10.5. Alterações que impactem diretamente valores, comissões ou condições financeiras serão sempre precedidas de notificação expressa e individual, não sendo aplicável o aceite tácito por silêncio.

10.6. O CONTRATANTE será solicitado a aceitar explicitamente as novas condições através do modal de aceite na plataforma antes de continuar utilizando os serviços.

---

### CLÁUSULA 11ª - DO FORO

11.1. Fica eleito o foro da Comarca de Brasília/DF para dirimir quaisquer questões oriundas do presente contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

---

### DISPOSIÇÕES FINAIS

Este contrato entra em vigor na data do aceite eletrônico pelo CONTRATANTE e permanece válido enquanto houver relação contratual entre as partes.

O aceite deste contrato implica concordância integral com todos os seus termos e condições.

**Versão:** 1.1
**Última atualização:** ' || TO_CHAR(NOW(), 'DD/MM/YYYY'),
  true,
  NULL
);

-- 6. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_system_terms_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_system_terms_config_timestamp ON system_terms_config;
CREATE TRIGGER update_system_terms_config_timestamp
BEFORE UPDATE ON system_terms_config
FOR EACH ROW
EXECUTE FUNCTION update_system_terms_config_updated_at();