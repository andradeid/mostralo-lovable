-- ========================================
-- FASE 1: Alterações na tabela stores
-- ========================================

-- Adicionar colunas para pagamento online
ALTER TABLE stores ADD COLUMN IF NOT EXISTS 
  wants_online_payment BOOLEAN DEFAULT false;

ALTER TABLE stores ADD COLUMN IF NOT EXISTS 
  efi_account_status TEXT DEFAULT 'not_configured';
  -- Valores: not_configured, pending_approval, active, rejected, suspended

ALTER TABLE stores ADD COLUMN IF NOT EXISTS 
  efi_account_id TEXT;
  -- ID da conta simplificada retornado pela EFI

ALTER TABLE stores ADD COLUMN IF NOT EXISTS 
  efi_client_id TEXT;
  -- Client ID para API Split

ALTER TABLE stores ADD COLUMN IF NOT EXISTS 
  efi_client_secret TEXT;
  -- Client Secret (criptografado)

ALTER TABLE stores ADD COLUMN IF NOT EXISTS 
  online_payment_commission NUMERIC(5,2) DEFAULT 7.00;
  -- Comissão Mostralo (permite ajuste futuro)

-- ========================================
-- FASE 2: Criar tabela store_efi_data
-- ========================================

CREATE TABLE IF NOT EXISTS store_efi_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  person_type TEXT NOT NULL CHECK (person_type IN ('pf', 'pj')),
  -- Dados PF
  birth_date DATE,
  mother_name TEXT,
  -- Controle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id)
);

-- Habilitar RLS
ALTER TABLE store_efi_data ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Store owners can manage their EFI data"
ON store_efi_data FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_efi_data.store_id
    AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_efi_data.store_id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Master admins can view all EFI data"
ON store_efi_data FOR SELECT
USING (
  has_role(auth.uid(), 'master_admin'::app_role)
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_store_efi_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_update_store_efi_data_updated_at
BEFORE UPDATE ON store_efi_data
FOR EACH ROW
EXECUTE FUNCTION update_store_efi_data_updated_at();

-- ========================================
-- FASE 3: Atualizar contrato merchant para v1.2
-- ========================================

-- Atualizar versão do contrato existente para inativo
UPDATE merchant_contract_templates
SET is_active = false
WHERE is_active = true;

-- Inserir nova versão com cláusula 4-A
INSERT INTO merchant_contract_templates (
  version,
  title,
  content,
  is_active,
  created_by
)
VALUES (
  '1.2',
  'Contrato de Prestação de Serviços Mostralo - Comerciante',
  '# CONTRATO DE PRESTAÇÃO DE SERVIÇOS

## MOSTRALO TECNOLOGIA LTDA

---

### IDENTIFICAÇÃO DAS PARTES

**CONTRATADA:** MOSTRALO TECNOLOGIA LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {cnpj_contratada}, com sede em {endereco_contratada}, doravante denominada simplesmente "MOSTRALO".

**CONTRATANTE:** {nome_empresa}, pessoa {tipo_pessoa} inscrita no {tipo_documento} sob o nº {documento}, com sede em {endereco_contratante}, representada neste ato por {nome_representante}, doravante denominado simplesmente "CONTRATANTE" ou "LOJISTA".

---

### CLÁUSULA 1ª - DO OBJETO

1.1. O presente contrato tem por objeto a prestação de serviços de tecnologia pela MOSTRALO ao CONTRATANTE, consistindo na disponibilização de plataforma digital para gestão de cardápio, pedidos online, delivery e demais funcionalidades descritas no plano contratado.

1.2. A MOSTRALO disponibilizará ao CONTRATANTE:
   a) Cardápio digital personalizado com domínio próprio
   b) Sistema de gestão de pedidos
   c) Painel administrativo completo
   d) Suporte técnico conforme plano contratado
   e) Atualizações e melhorias contínuas da plataforma

---

### CLÁUSULA 2ª - DAS OBRIGAÇÕES DA MOSTRALO

2.1. Compete à MOSTRALO:
   a) Disponibilizar a plataforma em funcionamento 24 horas por dia, 7 dias por semana, ressalvadas manutenções programadas
   b) Garantir a segurança e integridade dos dados do CONTRATANTE
   c) Prestar suporte técnico conforme nível do plano contratado
   d) Comunicar previamente manutenções que afetem o funcionamento do sistema
   e) Manter backup dos dados por período mínimo de 30 dias

2.2. A MOSTRALO compromete-se a manter SLA (Service Level Agreement) de 99,5% de disponibilidade mensal.

---

### CLÁUSULA 3ª - DAS OBRIGAÇÕES DO CONTRATANTE

3.1. Compete ao CONTRATANTE:
   a) Fornecer informações verdadeiras e atualizadas para cadastro
   b) Manter dados de produtos, preços e disponibilidade atualizados
   c) Cumprir com as obrigações tributárias e fiscais de sua atividade
   d) Utilizar a plataforma em conformidade com a legislação vigente
   e) Efetuar os pagamentos nas datas acordadas
   f) Não utilizar a plataforma para fins ilícitos ou que violem direitos de terceiros

3.2. O CONTRATANTE é integralmente responsável pelo conteúdo publicado em seu cardápio, incluindo descrições, imagens e preços.

---

### CLÁUSULA 4ª - DOS PAGAMENTOS

4.1. O CONTRATANTE pagará à MOSTRALO o valor correspondente ao plano contratado, conforme tabela de preços vigente.

4.2. O pagamento será realizado via PIX, boleto bancário ou cartão de crédito, conforme escolha do CONTRATANTE.

4.3. O não pagamento no vencimento acarretará:
   a) Suspensão do acesso à plataforma após 5 dias de atraso
   b) Cobrança de multa de 2% sobre o valor em atraso
   c) Juros de mora de 1% ao mês
   d) Cancelamento do contrato após 30 dias de inadimplência

4.4. Preços podem ser reajustados anualmente com base no IPCA ou índice substituto, mediante comunicação prévia de 30 dias.

---

### CLÁUSULA 4ª-A - DOS PAGAMENTOS ONLINE (PIX)

4-A.1. O CONTRATANTE poderá optar por habilitar o módulo de **Pagamentos Online via PIX**, permitindo que seus clientes finais paguem diretamente pela plataforma.

4-A.2. Ao habilitar este módulo, o CONTRATANTE concorda com:
   a) Criação de conta na instituição de pagamentos parceira (Efí Pay)
   b) Cobrança de comissão de **7% (sete por cento)** sobre cada venda realizada via PIX online
   c) Taxa adicional de processamento de **1,19% (um vírgula dezenove por cento)** cobrada pela Efí Pay
   d) **Taxa total: 8,19% por transação**

4-A.3. O recebimento dos valores é **instantâneo** diretamente na conta Efí do CONTRATANTE, deduzidas as taxas previstas.

4-A.4. Em caso de **cancelamento de pedido**:
   a) Se cancelado ANTES da aceitação pelo lojista: reembolso automático ao cliente final
   b) Se cancelado APÓS aceitação: reembolso manual pelo CONTRATANTE, que deverá devolver o valor via PIX diretamente ao cliente
   c) A comissão da MOSTRALO (7%) não será estornada em cancelamentos após aceitação do pedido

4-A.5. O CONTRATANTE é integralmente responsável por:
   a) Manter dados bancários/PIX atualizados na plataforma Efí
   b) Declarar e recolher impostos incidentes sobre as vendas (ISS, ICMS, etc.)
   c) Emitir notas fiscais aos clientes quando aplicável
   d) Resolver disputas e solicitações de reembolso com seus clientes finais
   e) Verificar e acompanhar o status de suas transações na plataforma Efí

4-A.6. A MOSTRALO reserva-se o direito de:
   a) Suspender o módulo de pagamentos em caso de irregularidades ou suspeita de fraude
   b) Alterar as taxas de comissão com aviso prévio de 30 dias, conforme Cláusula 10ª
   c) Bloquear temporariamente transações para análise de segurança

4-A.7. Este módulo é **opcional**. O CONTRATANTE pode optar por receber pagamentos apenas na entrega (dinheiro, cartão físico, PIX manual, etc.) sem custos adicionais além da mensalidade do plano.

4-A.8. A MOSTRALO não se responsabiliza por:
   a) Indisponibilidade temporária dos serviços da Efí Pay
   b) Problemas relacionados à conta do CONTRATANTE na Efí Pay
   c) Transações não autorizadas por falha do CONTRATANTE em manter credenciais seguras

---

### CLÁUSULA 5ª - DA RESCISÃO

5.1. O presente contrato poderá ser rescindido:
   a) Por acordo mútuo entre as partes
   b) Por inadimplência de qualquer das partes
   c) Por violação de qualquer cláusula contratual
   d) Por solicitação do CONTRATANTE a qualquer momento, sem multa, com aviso prévio de 30 dias

5.2. Em caso de rescisão, a MOSTRALO disponibilizará ao CONTRATANTE seus dados por período de 30 dias para migração.

5.3. Não haverá reembolso de valores já pagos em caso de rescisão antecipada.

---

### CLÁUSULA 6ª - DA PROPRIEDADE INTELECTUAL

6.1. A MOSTRALO detém todos os direitos de propriedade intelectual sobre a plataforma, incluindo código-fonte, design, funcionalidades e marca.

6.2. O CONTRATANTE mantém total propriedade sobre:
   a) Seus dados de clientes
   b) Conteúdo de seu cardápio
   c) Sua marca e identidade visual

6.3. É vedado ao CONTRATANTE copiar, modificar, distribuir ou criar obras derivadas da plataforma.

---

### CLÁUSULA 7ª - DA PROTEÇÃO DE DADOS (LGPD)

7.1. As partes comprometem-se a cumprir a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

7.2. A MOSTRALO atua como operadora de dados em relação aos dados de clientes do CONTRATANTE.

7.3. O CONTRATANTE é controlador dos dados de seus clientes e responsável por obter consentimento adequado.

7.4. Em caso de incidente de segurança, a parte afetada comunicará a outra em até 48 horas.

---

### CLÁUSULA 8ª - DA LIMITAÇÃO DE RESPONSABILIDADE

8.1. A MOSTRALO não se responsabiliza por:
   a) Danos indiretos, incidentais ou consequentes
   b) Lucros cessantes
   c) Perda de dados por culpa exclusiva do CONTRATANTE
   d) Indisponibilidade causada por terceiros ou força maior

8.2. A responsabilidade máxima da MOSTRALO está limitada ao valor pago pelo CONTRATANTE nos últimos 12 meses.

---

### CLÁUSULA 9ª - DO FORO

9.1. Fica eleito o foro da Comarca de {cidade_foro}, Estado de {estado_foro}, para dirimir quaisquer questões oriundas deste contrato, renunciando as partes a qualquer outro, por mais privilegiado que seja.

---

### CLÁUSULA 10ª - DA EVOLUÇÃO E ALTERAÇÃO CONTRATUAL

10.1. A MOSTRALO reserva-se o direito de modificar os termos deste contrato para:
   a) Adequação a novas legislações ou regulamentações
   b) Melhoria dos serviços prestados
   c) Sustentabilidade econômica do negócio
   d) Adaptação a mudanças tecnológicas ou de mercado

10.2. Alterações contratuais serão comunicadas ao CONTRATANTE com antecedência mínima de **30 (trinta) dias**.

10.3. Em caso de discordância com as alterações, o CONTRATANTE poderá rescindir o contrato sem qualquer penalidade, desde que manifeste sua intenção dentro do prazo de 30 dias da comunicação.

10.4. A continuidade do uso dos serviços após o prazo de notificação implica aceite tácito das novas condições.

---

### DECLARAÇÕES DO CONTRATANTE

Ao aceitar este contrato, o CONTRATANTE declara que:

☐ **Aceito os Termos de Uso e Condições Gerais** descritos neste contrato

☐ **Li e concordo com a Política de Privacidade** da MOSTRALO

☐ **Autorizo o uso de cookies** necessários para funcionamento da plataforma

☐ **Declaro que as informações prestadas são verdadeiras** e que estou autorizado a representar a empresa cadastrada

☐ **Comprometo-me a cumprir as obrigações fiscais e tributárias** relacionadas à minha atividade comercial

☐ Aceito receber comunicações sobre novidades e melhorias (opcional)

---

**Data de aceite:** {data_aceite}

**IP de origem:** {ip_origem}

**Hash de verificação:** {hash_verificacao}

---

*Documento gerado eletronicamente pela plataforma Mostralo.*
*Versão do contrato: 1.2*',
  true,
  NULL
);