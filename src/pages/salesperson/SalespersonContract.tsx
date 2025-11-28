import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SalespersonLayout } from "@/components/salesperson/SalespersonLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const CONTRACT_TEXT = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE REPRESENTAÇÃO COMERCIAL

1. PARTES CONTRATANTES

CONTRATANTE: Mostralo Tecnologia LTDA, CNPJ XX.XXX.XXX/0001-XX
CONTRATADO(A): Vendedor(a) inscrito(a) nesta plataforma

2. OBJETO DO CONTRATO

2.1. O presente contrato tem por objeto a prestação de serviços de representação comercial, mediante o qual o CONTRATADO se compromete a prospectar, indicar e intermediar a venda de planos de assinatura do sistema Mostralo.

2.2. A relação estabelecida é de natureza comercial, não constituindo vínculo empregatício entre as partes.

3. NATUREZA DA RELAÇÃO

3.1. O CONTRATADO declara que:
   a) Possui CNPJ ativo e regular perante a Receita Federal
   b) Exerce atividade econômica compatível com representação comercial
   c) É responsável por todas as obrigações fiscais, tributárias e previdenciárias decorrentes de sua atividade
   d) Não possui subordinação, horário fixo ou controle de jornada pelo CONTRATANTE

3.2. O CONTRATADO reconhece que atua como pessoa jurídica independente, sendo responsável por:
   - Emissão de notas fiscais de serviços (NF-e ou NFS-e)
   - Recolhimento de impostos (ISS, PIS, COFINS, IRPJ, CSLL)
   - Contribuições previdenciárias
   - Demais obrigações legais aplicáveis à sua atividade

4. REQUISITOS PARA PRESTAÇÃO DOS SERVIÇOS

4.1. O CONTRATADO deverá possuir CNPJ com CNAE principal ou secundário compatível com as atividades de:
   - 7319-0/02 - Promoção de vendas
   - 7319-0/99 - Outras atividades de publicidade não especificadas
   - 4619-2/00 - Representantes comerciais e agentes do comércio
   - 7311-4/00 - Agências de publicidade
   - 8299-7/99 - Outras atividades de serviços prestados principalmente às empresas

4.2. O CNPJ deverá estar com situação cadastral "ATIVA" perante a Receita Federal.

5. COMISSÕES E REMUNERAÇÃO

5.1. O CONTRATADO fará jus a comissões sobre as vendas efetivadas através de seu código de referência único.

5.2. As comissões serão calculadas conforme tabela vigente disponível na plataforma.

5.3. O pagamento das comissões será realizado mensalmente, mediante:
   a) Solicitação formal do CONTRATADO através da plataforma
   b) Apresentação de nota fiscal de serviços correspondente ao valor
   c) Aprovação do CONTRATANTE
   d) Pagamento via PIX em até 5 dias úteis após aprovação

6. BÔNUS POR DESEMPENHO

6.1. O CONTRATADO poderá fazer jus a bônus trimestrais conforme metas estabelecidas:
   - Bronze: 10 vendas no trimestre = R$ 500,00
   - Prata: 20 vendas no trimestre = R$ 1.000,00
   - Ouro: 30 vendas no trimestre = R$ 2.000,00
   - Diamante: 50 vendas no trimestre = R$ 5.000,00

6.2. Os bônus são cumulativos (ao atingir tier superior, recebe todos os anteriores).

6.3. O pagamento do bônus será realizado junto à comissão mensal do mês em que a meta foi atingida.

7. OBRIGAÇÕES DO CONTRATADO

7.1. Prospectar clientes de forma ética e profissional
7.2. Representar adequadamente a marca Mostralo
7.3. Fornecer informações verídicas aos prospects
7.4. Emitir nota fiscal para cada pagamento recebido
7.5. Manter seu CNPJ ativo e regular
7.6. Cumprir com todas as obrigações fiscais e tributárias

8. PROPRIEDADE INTELECTUAL

8.1. Todos os materiais promocionais, marca, logo e conteúdos fornecidos pelo CONTRATANTE permanecem de sua propriedade exclusiva.

8.2. O CONTRATADO não poderá utilizar a marca Mostralo após o término deste contrato.

9. VIGÊNCIA E RESCISÃO

9.1. Este contrato entra em vigor na data de seu aceite eletrônico e vigorará por prazo indeterminado.

9.2. Qualquer das partes poderá rescindir este contrato a qualquer momento, sem necessidade de aviso prévio.

9.3. Em caso de rescisão, o CONTRATADO terá direito apenas às comissões já geradas até a data da rescisão.

10. CONFIDENCIALIDADE

10.1. O CONTRATADO compromete-se a manter sigilo sobre informações confidenciais do CONTRATANTE.

11. DISPOSIÇÕES GERAIS

11.1. Este contrato é regido pelas leis brasileiras.

11.2. O aceite eletrônico deste contrato tem validade jurídica equivalente à assinatura manuscrita.

11.3. Fica eleito o foro da comarca de [CIDADE], para dirimir quaisquer dúvidas decorrentes deste contrato.

DECLARAÇÃO DO CONTRATADO:

Ao aceitar este contrato eletronicamente, declaro que:
- Li e compreendi todos os termos
- Possuo CNPJ ativo com CNAE compatível
- Não possuo vínculo empregatício com o CONTRATANTE
- Sou responsável por todas as obrigações fiscais e tributárias
- Concordo em emitir nota fiscal para cada pagamento recebido
`;

export default function SalespersonContract() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [salesperson, setSalesperson] = useState<any>(null);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (user) {
      loadSalespersonData();
    }
  }, [user]);

  const loadSalespersonData = async () => {
    try {
      const { data, error } = await supabase
        .from('salespeople')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setSalesperson(data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do vendedor');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptContract = async () => {
    if (!agreed) {
      toast.error('Você precisa concordar com os termos do contrato');
      return;
    }

    setAccepting(true);
    try {
      const { data, error } = await supabase.functions.invoke('accept-salesperson-contract');

      if (error) throw error;

      if (data?.success) {
        toast.success('Contrato aceito com sucesso!');
        navigate('/vendedor');
      } else {
        throw new Error(data?.error || 'Erro ao aceitar contrato');
      }
    } catch (error: any) {
      console.error('Erro ao aceitar contrato:', error);
      toast.error(error.message || 'Erro ao aceitar contrato');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <SalespersonLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </SalespersonLayout>
    );
  }

  const isContractPending = salesperson?.status === 'pending_contract';
  const isContractAccepted = salesperson?.status === 'active' && salesperson?.contract_accepted_at;

  return (
    <SalespersonLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Contrato de Prestação de Serviços</h1>
          <p className="text-muted-foreground">
            {isContractAccepted ? 'Contrato aceito' : 'Leia atentamente antes de aceitar'}
          </p>
        </div>

        {isContractAccepted && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>
              Contrato aceito em {new Date(salesperson.contract_accepted_at).toLocaleString('pt-BR')}
            </AlertDescription>
          </Alert>
        )}

        {isContractPending && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seu cadastro foi aprovado! Leia e aceite o contrato para ativar sua conta.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Termos do Contrato - Versão 1.0</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {CONTRACT_TEXT}
              </pre>
            </div>

            {isContractPending && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agree"
                    checked={agreed}
                    onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  />
                  <label
                    htmlFor="agree"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Li e concordo com todos os termos deste contrato
                  </label>
                </div>

                <Button
                  onClick={handleAcceptContract}
                  disabled={!agreed || accepting}
                  className="w-full md:w-auto"
                  size="lg"
                >
                  {accepting ? 'Aceitando...' : 'Aceitar Contrato'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SalespersonLayout>
  );
}
