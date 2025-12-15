
UPDATE salesperson_contract_templates 
SET 
  contract_text = 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE REPRESENTAÇÃO COMERCIAL

PARCEIRO PJ - REPRESENTANTE COMERCIAL AUTÔNOMO

1. PARTES CONTRATANTES

CONTRATANTE: {empresa}
CNPJ: {cnpj}
Endereço: {endereco}

CONTRATADO(A): {vendedor_nome}
CPF: {vendedor_cpf}
CNPJ: {vendedor_cnpj}

2. OBJETO DO CONTRATO

2.1. O presente contrato tem por objeto a prestação de serviços de representação comercial autônoma para captação de novos clientes para a plataforma de delivery digital da CONTRATANTE.

2.2. O CONTRATADO(A) atuará de forma independente, sem vínculo empregatício, utilizando seus próprios recursos e métodos de trabalho.

3. DA NATUREZA DA RELAÇÃO

3.1. Fica expressamente estabelecido que NÃO EXISTE vínculo empregatício entre as partes, tratando-se de relação comercial entre pessoas jurídicas.

3.2. O CONTRATADO(A) declara possuir CNPJ ativo com CNAE compatível com atividades de representação comercial, publicidade ou serviços correlatos.

3.3. O CONTRATADO(A) é responsável por todas as suas obrigações fiscais, tributárias e previdenciárias.

3.4. Não há subordinação, exclusividade ou controle de jornada por parte da CONTRATANTE.

4. DOS REQUISITOS DO CONTRATADO

4.1. Para atuar como Parceiro PJ, o CONTRATADO(A) deve:
   a) Possuir CNPJ ativo
   b) Possuir CNAE compatível (7319002, 7319099, 4619200, 7311400, 8299799 ou similares)
   c) Estar em dia com suas obrigações fiscais
   d) Emitir Nota Fiscal para cada pagamento recebido

5. DAS COMISSÕES

5.1. O CONTRATADO(A) receberá comissão de {comissao_percentual}% sobre o valor da mensalidade de cada cliente indicado, durante todo o período em que o cliente mantiver sua assinatura ativa.

5.2. As comissões são RECORRENTES, ou seja, enquanto o cliente indicado mantiver sua assinatura, o CONTRATADO(A) continuará recebendo sua comissão mensalmente.

5.3. O pagamento das comissões será realizado até o dia 10 de cada mês, referente às vendas do mês anterior.

5.4. Para receber o pagamento, o CONTRATADO(A) deverá emitir Nota Fiscal correspondente ao valor das comissões.

6. DOS BÔNUS

6.1. Além das comissões recorrentes, o CONTRATADO(A) pode conquistar bônus trimestrais baseados em metas de vendas:

{tabela_bonus}

6.2. Os bônus são CUMULATIVOS. Ao atingir uma faixa superior, o CONTRATADO(A) recebe todos os bônus das faixas anteriores.

6.3. O ciclo de bônus é trimestral: Jan-Mar, Abr-Jun, Jul-Set, Out-Dez.

6.4. O bônus é pago junto com a comissão do mês em que a meta foi atingida.

7. DA MANUTENÇÃO DE CARTEIRA

7.1. A comissão do CONTRATADO(A) está sujeita ao sistema de Manutenção de Carteira, baseado na quantidade de clientes ativos (com assinatura vigente) indicados.

7.2. As faixas de comissão são:

{faixas_manutencao}

7.3. A avaliação da carteira ocorre TRIMESTRALMENTE, sincronizada com o ciclo de bônus (Jan-Mar, Abr-Jun, Jul-Set, Out-Dez).

7.4. PERÍODO DE GRAÇA: Antes de qualquer rebaixamento de faixa, o CONTRATADO(A) será notificado com antecedência de 15 dias, tendo período de graça de 30 dias para regularização.

7.5. REATIVAÇÃO: Caso rebaixado, o CONTRATADO(A) pode recuperar sua faixa original conquistando novos clientes que atinjam os limites estabelecidos.

7.6. PROTEÇÃO REGIONAL: Enquanto os clientes indicados mantiverem suas assinaturas ativas, a comissão do CONTRATADO(A) permanece protegida, independentemente de novas vendas.

7.7. Os valores configuráveis (limites de clientes, percentuais) podem ser ajustados pela CONTRATANTE, sendo o CONTRATADO(A) notificado com antecedência mínima de 30 dias.

8. DAS OBRIGAÇÕES DO CONTRATADO

8.1. O CONTRATADO(A) se compromete a:
   a) Representar a CONTRATANTE de forma ética e profissional
   b) Fornecer informações precisas sobre os serviços oferecidos
   c) Manter sigilo sobre informações comerciais e estratégicas
   d) Emitir Nota Fiscal para cada pagamento recebido
   e) Manter seus dados cadastrais e bancários atualizados

9. DA PROPRIEDADE INTELECTUAL

9.1. Os materiais de marketing, scripts de vendas e demais recursos fornecidos pela CONTRATANTE são de sua propriedade exclusiva.

9.2. O CONTRATADO(A) está autorizado a utilizá-los apenas para fins de representação comercial durante a vigência deste contrato.

10. DA VIGÊNCIA E RESCISÃO

10.1. Este contrato tem vigência indeterminada, iniciando-se na data de aceite digital.

10.2. Qualquer das partes pode rescindir o contrato a qualquer momento, mediante comunicação prévia de 30 dias.

10.3. Em caso de rescisão, o CONTRATADO(A) manterá o direito às comissões dos clientes já indicados enquanto estes mantiverem suas assinaturas ativas.

11. DA CONFIDENCIALIDADE

11.1. O CONTRATADO(A) compromete-se a manter sigilo sobre todas as informações comerciais, estratégicas e técnicas da CONTRATANTE.

11.2. Esta obrigação permanece válida mesmo após o término do contrato.

12. DISPOSIÇÕES GERAIS

12.1. Fica eleito o foro da comarca de Brasília/DF para dirimir quaisquer questões oriundas deste contrato.

12.2. Este contrato foi aceito digitalmente, tendo a mesma validade jurídica de um contrato físico assinado.

DECLARAÇÃO DE ACEITE

Ao aceitar este contrato digitalmente, o CONTRATADO(A) declara:

✓ Ter lido e compreendido todos os termos deste contrato
✓ Concordar com todas as condições estabelecidas
✓ Possuir CNPJ ativo com CNAE compatível
✓ Ser responsável por suas obrigações fiscais e tributárias
✓ Estar ciente de que não há vínculo empregatício
✓ Estar ciente do sistema de Manutenção de Carteira e suas faixas de comissão

Data do aceite: {data_aceite}
IP do aceite: {ip_aceite}
Hash de verificação: {hash_verificacao}',
  version = '1.1',
  updated_at = NOW()
WHERE id = 'da29ceeb-3a57-45eb-96e0-143c62263c1b';
