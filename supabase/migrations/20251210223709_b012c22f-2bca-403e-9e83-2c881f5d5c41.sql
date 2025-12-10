-- Tabela de templates de contrato editáveis pelo master admin
CREATE TABLE public.salesperson_contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_cnpj TEXT NOT NULL,
  company_address TEXT,
  company_city TEXT NOT NULL,
  company_state TEXT,
  contract_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Adicionar campo de hash de verificação na tabela de contratos aceitos
ALTER TABLE public.salesperson_contracts 
ADD COLUMN IF NOT EXISTS verification_hash TEXT,
ADD COLUMN IF NOT EXISTS contract_template_id UUID REFERENCES salesperson_contract_templates(id),
ADD COLUMN IF NOT EXISTS salesperson_name TEXT,
ADD COLUMN IF NOT EXISTS salesperson_cnpj TEXT;

-- Criar índice único para hash
CREATE UNIQUE INDEX IF NOT EXISTS idx_salesperson_contracts_verification_hash 
ON salesperson_contracts(verification_hash) WHERE verification_hash IS NOT NULL;

-- RLS para templates
ALTER TABLE public.salesperson_contract_templates ENABLE ROW LEVEL SECURITY;

-- Master admin pode gerenciar templates
CREATE POLICY "Master admins can manage contract templates"
ON public.salesperson_contract_templates
FOR ALL
USING (has_role(auth.uid(), 'master_admin'))
WITH CHECK (has_role(auth.uid(), 'master_admin'));

-- Vendedores podem visualizar template ativo
CREATE POLICY "Salespeople can view active template"
ON public.salesperson_contract_templates
FOR SELECT
USING (
  is_active = true AND
  EXISTS (
    SELECT 1 FROM salespeople 
    WHERE user_id = auth.uid()
  )
);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_contract_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para updated_at
CREATE TRIGGER update_contract_templates_updated_at
BEFORE UPDATE ON salesperson_contract_templates
FOR EACH ROW
EXECUTE FUNCTION update_contract_templates_updated_at();

-- Garantir apenas 1 template ativo por vez
CREATE OR REPLACE FUNCTION ensure_single_active_contract_template()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE salesperson_contract_templates 
    SET is_active = false 
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER ensure_single_active_contract_template
BEFORE INSERT OR UPDATE ON salesperson_contract_templates
FOR EACH ROW
EXECUTE FUNCTION ensure_single_active_contract_template();

-- Inserir template padrão inicial
INSERT INTO salesperson_contract_templates (
  version,
  company_name,
  company_cnpj,
  company_address,
  company_city,
  company_state,
  contract_text,
  is_active
) VALUES (
  '1.0',
  'Mostralo Tecnologia LTDA',
  '00.000.000/0001-00',
  'Endereço da Empresa, Nº 000',
  'São Paulo',
  'SP',
  E'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE REPRESENTAÇÃO COMERCIAL AUTÔNOMA

1. PARTES CONTRATANTES

1.1. CONTRATANTE: {empresa}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {cnpj}, com sede em {cidade}/{estado}, neste ato representada por seu representante legal.

1.2. CONTRATADO(A): {vendedor_nome}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {vendedor_cnpj}, neste ato representada por seu representante legal.

2. OBJETO DO CONTRATO

2.1. O presente contrato tem por objeto a prestação de serviços de representação comercial autônoma para captação de novos clientes para a plataforma Mostralo.

2.2. O CONTRATADO(A) atuará de forma independente na prospecção, apresentação e fechamento de vendas dos planos oferecidos pela CONTRATANTE.

3. DA NATUREZA DA RELAÇÃO

3.1. Este contrato estabelece relação de prestação de serviços entre pessoas jurídicas, NÃO configurando, sob qualquer hipótese, vínculo empregatício, sociedade ou associação entre as partes.

3.2. O CONTRATADO(A) é profissional autônomo, responsável por sua própria organização de trabalho, horários e métodos de prospecção.

4. DOS REQUISITOS DO CONTRATADO

4.1. O CONTRATADO(A) declara possuir CNPJ ativo com CNAE compatível com as atividades de representação comercial, incluindo:
- 7319-0/02 - Promoção de vendas
- 7319-0/99 - Outras atividades de publicidade
- 4619-2/00 - Representantes comerciais
- 7311-4/00 - Agências de publicidade
- 8299-7/99 - Outras atividades de serviços

4.2. O CONTRATADO(A) é responsável por manter seu CNPJ ativo e regular durante toda a vigência deste contrato.

5. DAS COMISSÕES

5.1. O CONTRATADO(A) receberá comissão de {comissao_percentual}% sobre o valor de cada venda efetivada através de seu link de indicação.

5.2. As comissões são devidas apenas sobre a PRIMEIRA mensalidade paga pelo cliente indicado.

5.3. O pagamento será realizado mensalmente, até o dia 10 do mês subsequente, mediante emissão de Nota Fiscal pelo CONTRATADO(A).

6. DOS BÔNUS

6.1. O CONTRATADO(A) poderá receber bônus trimestrais conforme metas atingidas:

{tabela_bonus}

6.2. Os bônus são cumulativos dentro do trimestre e pagos junto com a comissão do mês em que a meta for atingida.

7. DAS OBRIGAÇÕES DO CONTRATADO

7.1. Representar a CONTRATANTE com ética e profissionalismo.
7.2. Fornecer informações precisas sobre os produtos e serviços.
7.3. Emitir Nota Fiscal para cada pagamento recebido.
7.4. Manter sigilo sobre informações confidenciais.
7.5. Não realizar promessas além das especificações oficiais dos produtos.

8. DA PROPRIEDADE INTELECTUAL

8.1. Todos os materiais, marcas e conteúdos fornecidos pela CONTRATANTE permanecem de sua propriedade exclusiva.

8.2. O CONTRATADO(A) está autorizado a utilizar os materiais apenas para fins de representação comercial.

9. DA VIGÊNCIA E RESCISÃO

9.1. Este contrato tem vigência indeterminada, podendo ser rescindido por qualquer das partes mediante comunicação prévia de 30 dias.

9.2. A rescisão não afeta o direito às comissões sobre vendas já efetivadas.

10. DA CONFIDENCIALIDADE

10.1. O CONTRATADO(A) compromete-se a manter sigilo sobre todas as informações comerciais, técnicas e estratégicas da CONTRATANTE.

11. DISPOSIÇÕES GERAIS

11.1. Fica eleito o foro da comarca de {cidade}/{estado} para dirimir quaisquer questões oriundas deste contrato.

11.2. Este contrato será regido pelas leis brasileiras.

---

DECLARAÇÃO DE ACEITE ELETRÔNICO

Ao aceitar este contrato eletronicamente, o CONTRATADO(A) declara:

✓ Ter lido e compreendido todas as cláusulas
✓ Possuir CNPJ ativo com CNAE compatível
✓ Concordar com os termos de comissionamento
✓ Estar ciente da natureza autônoma da relação
✓ Aceitar o foro eleito para questões contratuais

Data do aceite: {data_aceite}
IP do aceite: {ip_aceite}
Hash de verificação: {hash_verificacao}',
  true
);