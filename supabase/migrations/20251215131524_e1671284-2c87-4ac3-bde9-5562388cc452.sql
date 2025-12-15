-- Desativar versão atual do contrato de vendedor
UPDATE salesperson_contract_templates 
SET is_active = false 
WHERE is_active = true;

-- Inserir nova versão 1.1 do contrato de vendedor com cláusula de evolução contratual
INSERT INTO salesperson_contract_templates (
  version,
  company_name,
  company_cnpj,
  company_address,
  company_city,
  company_state,
  contract_text,
  is_active,
  created_by
) VALUES (
  '1.1',
  'Mostralo Tecnologia LTDA',
  '',
  '',
  'São Paulo',
  'SP',
  'CONTRATO DE PARCEIRO COMERCIAL PJ - MOSTRALO

Este contrato estabelece os termos e condições da parceria comercial entre você (Parceiro PJ) e a Mostralo.

CLÁUSULA 1 - DAS PARTES

1.1. CONTRATANTE: {empresa}, inscrita no CNPJ sob o nº {cnpj}, com sede em {endereco}, {cidade}/{estado}.

1.2. CONTRATADO: Pessoa Jurídica devidamente registrada, com CNPJ ativo e CNAE compatível com atividades de representação comercial, vendas ou marketing.

CLÁUSULA 2 - DO OBJETO

2.1. O presente contrato tem por objeto estabelecer os termos da parceria comercial para prospecção e indicação de novos clientes (lojistas) para a plataforma Mostralo.

2.2. O Parceiro PJ atuará como representante comercial independente, sem vínculo empregatício.

CLÁUSULA 3 - DAS OBRIGAÇÕES DO PARCEIRO PJ

3.1. Manter CNPJ ativo com situação cadastral regular junto à Receita Federal.

3.2. Possuir CNAE principal ou secundário compatível com as atividades de prospecção comercial.

3.3. Emitir Nota Fiscal de Serviços (NFS-e) para cada pagamento de comissão recebido.

3.4. Cumprir todas as obrigações fiscais e tributárias relacionadas à sua atividade.

3.5. Representar a Mostralo de forma ética e profissional perante os clientes.

3.6. Manter sigilo sobre informações comerciais e estratégicas da Mostralo.

CLÁUSULA 4 - DAS OBRIGAÇÕES DA MOSTRALO

4.1. Disponibilizar materiais de marketing e suporte para prospecção.

4.2. Fornecer treinamento e orientação sobre os produtos e serviços.

4.3. Efetuar o pagamento das comissões conforme estabelecido neste contrato.

4.4. Manter o Parceiro PJ informado sobre atualizações de produtos e políticas.

CLÁUSULA 5 - DA REMUNERAÇÃO

5.1. O Parceiro PJ receberá comissão de {comissao_percentual}% sobre o valor de cada assinatura dos clientes indicados.

5.2. As comissões serão pagas mensalmente, via PIX, após emissão de NFS-e pelo Parceiro.

5.3. Bônus trimestrais poderão ser concedidos conforme metas atingidas:
   - Bronze ({bonus_bronze_meta} vendas): R$ {bonus_bronze}
   - Prata ({bonus_prata_meta} vendas): R$ {bonus_prata}
   - Ouro ({bonus_ouro_meta} vendas): R$ {bonus_ouro}
   - Diamante ({bonus_diamante_meta} vendas): R$ {bonus_diamante}

CLÁUSULA 6 - DA MANUTENÇÃO DE CARTEIRA

6.1. O Parceiro PJ mantém direito às comissões enquanto os clientes indicados mantiverem assinatura ativa.

6.2. A avaliação de carteira será realizada trimestralmente.

6.3. O percentual de comissão pode ser ajustado conforme quantidade de clientes ativos na carteira.

CLÁUSULA 7 - DA VIGÊNCIA

7.1. Este contrato tem vigência por prazo indeterminado.

7.2. Qualquer das partes pode rescindir mediante aviso prévio de 30 dias.

CLÁUSULA 8 - DA RESCISÃO

8.1. O contrato poderá ser rescindido imediatamente em caso de:
   a) Irregularidade no CNPJ ou situação cadastral;
   b) Conduta antiética ou que prejudique a imagem da Mostralo;
   c) Descumprimento das obrigações fiscais;
   d) Violação de sigilo comercial.

CLÁUSULA 9 - DA NÃO EXCLUSIVIDADE

9.1. Este contrato não estabelece exclusividade territorial ou de atuação.

9.2. O Parceiro PJ pode representar outras empresas, desde que não sejam concorrentes diretos.

CLÁUSULA 10 - DA PROTEÇÃO DE DADOS

10.1. O Parceiro PJ compromete-se a respeitar a LGPD no tratamento de dados de prospects e clientes.

10.2. Dados coletados durante a prospecção devem ser utilizados exclusivamente para fins comerciais da Mostralo.

CLÁUSULA 11 - DO FORO

11.1. Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias.

CLÁUSULA 12 - DA EVOLUÇÃO E ALTERAÇÃO CONTRATUAL

12.1. A Mostralo reserva-se o direito de atualizar os termos deste contrato para:
   a) Adaptar-se a mudanças na legislação aplicável;
   b) Melhorar a segurança e proteção de dados;
   c) Refletir a evolução dos serviços e funcionalidades da plataforma;
   d) Manter a sustentabilidade e viabilidade do negócio.

12.2. As alterações serão comunicadas com antecedência mínima de 30 (trinta) dias.

12.3. O uso continuado da plataforma após o período de notificação será considerado como aceite tácito dos novos termos.

12.4. Caso o Parceiro PJ não concorde com as alterações, poderá rescindir este contrato sem qualquer penalidade, mediante comunicação formal dentro do período de notificação.

12.5. Garantimos que alterações contratuais sempre buscarão o equilíbrio entre as partes, respeitando direitos adquiridos e a boa-fé contratual.

Ao aceitar este contrato digitalmente, o Parceiro PJ declara:
- Ter lido e compreendido todos os termos;
- Possuir capacidade legal para representar a pessoa jurídica;
- Concordar integralmente com as condições estabelecidas.

Data da versão: Dezembro de 2024
Versão do contrato: 1.1',
  true,
  NULL
);