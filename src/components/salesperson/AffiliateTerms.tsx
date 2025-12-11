import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Shield, DollarSign, Clock, AlertTriangle } from "lucide-react";

interface AffiliateTermsProps {
  salespersonName?: string;
  salespersonCpf?: string;
  commissionPercentage?: number;
}

export function AffiliateTerms({ 
  salespersonName = '[Seu Nome]', 
  salespersonCpf = '[Seu CPF]',
  commissionPercentage = 7
}: AffiliateTermsProps) {
  return (
    <div className="space-y-6 text-sm">
      <div className="text-center border-b pb-4">
        <h2 className="text-xl font-bold">TERMOS DE INDICAÇÃO</h2>
        <h3 className="text-lg font-semibold text-primary">PROGRAMA DE AFILIADOS MOSTRALO</h3>
        <p className="text-muted-foreground mt-2">Versão 1.0 - {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <Alert className="bg-amber-500/10 border-amber-500/30">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700">
          <strong>Importante:</strong> Este programa é destinado a pessoas físicas que desejam 
          indicar clientes de forma eventual e voluntária, sem vínculo empregatício.
        </AlertDescription>
      </Alert>

      {/* Identificação */}
      <section>
        <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
          <Badge variant="outline">AFILIADO</Badge>
        </h4>
        <div className="bg-muted/50 p-3 rounded-lg space-y-1">
          <p><strong>Nome:</strong> {salespersonName}</p>
          <p><strong>CPF:</strong> {salespersonCpf}</p>
        </div>
      </section>

      {/* Cláusula 1 */}
      <section>
        <h4 className="font-bold mb-2 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          1. NATUREZA DA RELAÇÃO
        </h4>
        <div className="space-y-2 text-muted-foreground">
          <p>
            1.1. Este programa de indicação é de natureza <strong>eventual e voluntária</strong>, 
            não configurando relação de emprego, prestação de serviços continuada ou qualquer 
            outro vínculo trabalhista.
          </p>
          <p>
            1.2. O AFILIADO atuará de forma <strong>autônoma e independente</strong>, sem 
            subordinação, horário fixo ou exclusividade com a MOSTRALO.
          </p>
          <p>
            1.3. A participação no programa pode ser encerrada a qualquer momento por 
            qualquer das partes, sem multas, aviso prévio ou indenizações.
          </p>
        </div>
      </section>

      {/* Cláusula 2 */}
      <section>
        <h4 className="font-bold mb-2 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          2. COMISSIONAMENTO
        </h4>
        <div className="space-y-2 text-muted-foreground">
          <p>
            2.1. O AFILIADO receberá comissão de <strong>{commissionPercentage}%</strong> sobre 
            o valor do primeiro pagamento de cada cliente indicado que efetuar a assinatura.
          </p>
          <p>
            2.2. Os pagamentos serão realizados via <strong>PIX</strong> até o dia 5 do mês 
            subsequente à aprovação da venda.
          </p>
          <p>
            2.3. O AFILIADO reconhece que os valores recebidos são de natureza eventual e 
            não constituem salário ou remuneração fixa.
          </p>
        </div>
      </section>

      {/* Cláusula 3 - LIMITE */}
      <section>
        <h4 className="font-bold mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          3. LIMITE DE GANHOS
        </h4>
        <Alert className="bg-amber-500/10 border-amber-500/30 mb-3">
          <AlertDescription>
            <strong>Limite mensal: R$ 1.900,00</strong> (mil e novecentos reais)
          </AlertDescription>
        </Alert>
        <div className="space-y-2 text-muted-foreground">
          <p>
            3.1. O AFILIADO está sujeito a um limite máximo de ganhos mensais de 
            <strong> R$ 1.900,00</strong> (mil e novecentos reais).
          </p>
          <p>
            3.2. Comissões que excederem este limite <strong>não serão pagas</strong>, 
            acumuladas ou transferidas para o mês seguinte.
          </p>
          <p>
            3.3. Este limite existe para manter a natureza eventual das indicações 
            conforme legislação vigente.
          </p>
          <p>
            3.4. Caso deseje ganhos ilimitados, o AFILIADO poderá realizar upgrade 
            para <strong>Parceiro PJ</strong>, mediante abertura de MEI ou CNPJ com 
            CNAE compatível.
          </p>
        </div>
      </section>

      {/* Cláusula 4 */}
      <section>
        <h4 className="font-bold mb-2 flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          4. BÔNUS TRIMESTRAIS
        </h4>
        <div className="space-y-2 text-muted-foreground">
          <p>
            4.1. O AFILIADO <strong>NÃO</strong> é elegível para os bônus trimestrais 
            do programa de vendedores.
          </p>
          <p>
            4.2. Os bônus trimestrais (Bronze, Prata, Ouro, Diamante) são exclusivos 
            para <strong>Parceiros PJ</strong>.
          </p>
        </div>
      </section>

      {/* Cláusula 5 */}
      <section>
        <h4 className="font-bold mb-2">5. RESPONSABILIDADES DO AFILIADO</h4>
        <div className="space-y-2 text-muted-foreground">
          <p>
            5.1. Declarar os rendimentos recebidos conforme exigido pela legislação fiscal.
          </p>
          <p>
            5.2. Não se apresentar como funcionário, preposto ou representante da MOSTRALO.
          </p>
          <p>
            5.3. Respeitar as políticas comerciais e diretrizes de comunicação da MOSTRALO.
          </p>
          <p>
            5.4. Manter seus dados cadastrais atualizados, especialmente a chave PIX.
          </p>
        </div>
      </section>

      {/* Cláusula 6 */}
      <section>
        <h4 className="font-bold mb-2">6. UPGRADE PARA PARCEIRO PJ</h4>
        <div className="space-y-2 text-muted-foreground">
          <p>
            6.1. O AFILIADO pode, a qualquer momento, fazer upgrade para <strong>Parceiro PJ</strong> 
            mediante apresentação de MEI ou CNPJ com CNAE compatível.
          </p>
          <p>
            6.2. Benefícios do upgrade:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Comissão de <strong>10%</strong> (ao invés de {commissionPercentage}%)</li>
            <li>Ganhos <strong>ilimitados</strong> (sem teto mensal)</li>
            <li>Elegibilidade para <strong>bônus trimestrais</strong></li>
            <li>Contrato formal de prestação de serviços</li>
          </ul>
        </div>
      </section>

      {/* Cláusula 7 */}
      <section>
        <h4 className="font-bold mb-2">7. RESCISÃO</h4>
        <div className="space-y-2 text-muted-foreground">
          <p>
            7.1. Qualquer das partes pode encerrar a participação no programa a qualquer 
            momento, sem necessidade de aviso prévio.
          </p>
          <p>
            7.2. Não haverá multas, penalidades ou indenizações em caso de rescisão.
          </p>
          <p>
            7.3. Comissões pendentes referentes a vendas já concluídas serão pagas 
            normalmente no próximo ciclo de pagamento.
          </p>
        </div>
      </section>

      {/* Declaração */}
      <section className="border-t pt-4">
        <h4 className="font-bold mb-2">8. DECLARAÇÃO DO AFILIADO</h4>
        <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-muted-foreground">
          <p>
            Ao aceitar estes termos, o AFILIADO declara que:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Leu e compreendeu integralmente este documento</li>
            <li>Aceita a natureza eventual e voluntária das indicações</li>
            <li>Reconhece que não há vínculo empregatício com a MOSTRALO</li>
            <li>Concorda com o limite mensal de R$ 1.900,00</li>
            <li>Assume responsabilidade pela declaração fiscal dos rendimentos</li>
          </ul>
        </div>
      </section>

      {/* Informação sobre MEI */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Quer ganhar mais?</strong> Abra um MEI gratuitamente em{' '}
          <a 
            href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            gov.br/empreendedor
          </a>
          {' '}e faça upgrade para Parceiro PJ com comissões de 10% e ganhos ilimitados!
        </AlertDescription>
      </Alert>
    </div>
  );
}
