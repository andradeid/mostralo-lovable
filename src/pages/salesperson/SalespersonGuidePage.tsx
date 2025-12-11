import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  DollarSign, 
  CreditCard, 
  Trophy, 
  ArrowUpCircle, 
  HelpCircle,
  Link2,
  CheckCircle,
  Clock,
  FileText,
  AlertTriangle,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SalespersonGuidePage() {
  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" />
          Guia Completo do Vendedor
        </h1>
        <p className="text-muted-foreground mt-2">
          Tudo que você precisa saber para maximizar seus ganhos
        </p>
      </div>

      {/* Seção 1: Bem-vindo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Bem-vindo ao Programa de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Você faz parte do nosso programa de vendas! Como vendedor, você tem a oportunidade de 
            ganhar comissões indicando novos clientes para nossa plataforma.
          </p>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Existem dois tipos de vendedores com regras diferentes. 
              Leia atentamente para entender qual se aplica a você.
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                    Afiliado (CPF)
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Comissão de <strong>5%</strong> sobre vendas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Limite de R$ 1.900/mês</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Não precisa de CNPJ</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Sem bônus trimestrais</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    Parceiro PJ (CNPJ)
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Comissão de <strong>10%</strong> sobre vendas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Sem limite de ganhos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Bônus trimestrais até R$ 8.500</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Requer CNPJ e emissão de NF</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Seção 2: Como Ganhar Dinheiro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Como Ganhar Dinheiro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              Seu Link de Indicação
            </h3>
            <p className="text-muted-foreground text-sm">
              Você possui um link único de indicação. Quando alguém se cadastra usando seu link 
              e realiza uma assinatura, você ganha comissão!
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">📍 Onde encontrar seu link:</p>
              <p className="text-muted-foreground">
                Menu lateral → <strong>"Meu Link"</strong> → Copie e compartilhe
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold">💰 Quando a Venda é Contabilizada?</h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Cliente acessa seu link</p>
                  <p className="text-sm text-muted-foreground">O código de indicação fica registrado automaticamente</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Cliente realiza o cadastro</p>
                  <p className="text-sm text-muted-foreground">Preenche os dados e escolhe um plano</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Pagamento é aprovado</p>
                  <p className="text-sm text-muted-foreground">Após a confirmação do pagamento pelo admin, a venda é creditada para você</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold">📅 Ciclo de Pagamento</h3>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-blue-600">Mensal</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Você pode solicitar pagamento a partir do <strong>dia 1º de cada mês</strong> referente 
                às vendas do mês anterior. O pagamento é processado em até <strong>5 dias úteis</strong> após aprovação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção 3: Como Solicitar Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Como Solicitar Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Para Afiliados */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                Para Afiliados (CPF)
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-orange-500/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-orange-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Verifique seu PIX</p>
                  <p className="text-sm text-muted-foreground">
                    Acesse "Perfil" no menu lateral e certifique-se que sua chave PIX está cadastrada corretamente.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-orange-500/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-orange-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Acesse Pagamentos</p>
                  <p className="text-sm text-muted-foreground">
                    Vá em "Pagamentos" no menu lateral para ver seu saldo disponível.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-orange-500/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-orange-600">3</span>
                </div>
                <div>
                  <p className="font-medium">Solicite o Pagamento</p>
                  <p className="text-sm text-muted-foreground">
                    Clique em "Solicitar Pagamento" para enviar a solicitação.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-orange-500/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-orange-600">4</span>
                </div>
                <div>
                  <p className="font-medium">Aguarde a Aprovação</p>
                  <p className="text-sm text-muted-foreground">
                    O pagamento será processado via PIX em até <strong>5 dias úteis</strong>.
                  </p>
                </div>
              </div>
            </div>

            <Alert className="border-orange-500/30 bg-orange-500/5">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-sm">
                <strong>Limite Mensal:</strong> Afiliados têm limite de R$ 1.900/mês. 
                Valores acima disso serão resetados no início do próximo mês.
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          {/* Para Parceiros PJ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                Para Parceiros PJ (CNPJ)
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-green-500/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Verifique seu PIX</p>
                  <p className="text-sm text-muted-foreground">
                    Acesse "Perfil" e confirme que a chave PIX do seu CNPJ está cadastrada.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-green-500/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Prepare a Nota Fiscal</p>
                  <p className="text-sm text-muted-foreground">
                    Emita uma NFS-e (Nota Fiscal de Serviço Eletrônica) com o valor a ser solicitado.
                    Descrição sugerida: "Serviços de intermediação comercial".
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-green-500/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-600">3</span>
                </div>
                <div>
                  <p className="font-medium">Acesse Pagamentos</p>
                  <p className="text-sm text-muted-foreground">
                    Vá em "Pagamentos" para visualizar seu saldo e solicitar.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-green-500/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-600">4</span>
                </div>
                <div>
                  <p className="font-medium">Anexe a NF e Solicite</p>
                  <p className="text-sm text-muted-foreground">
                    Faça upload do PDF da Nota Fiscal junto com a solicitação de pagamento.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-green-500/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-600">5</span>
                </div>
                <div>
                  <p className="font-medium">Aguarde Verificação</p>
                  <p className="text-sm text-muted-foreground">
                    A NF será verificada e o pagamento processado em até <strong>5 dias úteis</strong>.
                  </p>
                </div>
              </div>
            </div>

            <Alert className="border-green-500/30 bg-green-500/5">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-sm">
                <strong>Sem Limite!</strong> Parceiros PJ não têm limite de ganhos mensais. 
                Quanto mais você vende, mais você ganha!
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Seção 4: Bônus Trimestrais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Bônus Trimestrais
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 ml-2">
              Só Parceiros PJ
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Parceiros PJ têm acesso ao sistema de bônus trimestrais! Alcance metas de vendas 
            e receba recompensas extras.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Tier</th>
                  <th className="text-center py-3 px-2">Meta</th>
                  <th className="text-right py-3 px-2">Bônus</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-2">
                    <Badge className="bg-amber-700 text-white">🥉 Bronze</Badge>
                  </td>
                  <td className="text-center py-3 px-2">10 vendas</td>
                  <td className="text-right py-3 px-2 font-semibold text-green-600">R$ 500</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2">
                    <Badge className="bg-gray-400 text-white">🥈 Prata</Badge>
                  </td>
                  <td className="text-center py-3 px-2">20 vendas</td>
                  <td className="text-right py-3 px-2 font-semibold text-green-600">R$ 1.000</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2">
                    <Badge className="bg-yellow-500 text-white">🥇 Ouro</Badge>
                  </td>
                  <td className="text-center py-3 px-2">30 vendas</td>
                  <td className="text-right py-3 px-2 font-semibold text-green-600">R$ 2.000</td>
                </tr>
                <tr>
                  <td className="py-3 px-2">
                    <Badge className="bg-blue-500 text-white">💎 Diamante</Badge>
                  </td>
                  <td className="text-center py-3 px-2">50 vendas</td>
                  <td className="text-right py-3 px-2 font-semibold text-green-600">R$ 5.000</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold">📊 Como Funciona o Cálculo</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Trimestres:</strong> Jan-Mar, Abr-Jun, Jul-Set, Out-Dez</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Cumulativo:</strong> Ao atingir um tier superior, você recebe TODOS os bônus dos tiers anteriores</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Exemplo:</strong> Se atingir Ouro (30 vendas), você recebe: R$ 500 + R$ 1.000 + R$ 2.000 = <strong>R$ 3.500</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Pagamento:</strong> Bônus é pago junto com a comissão do mês em que a meta foi atingida</span>
              </li>
            </ul>
          </div>

          <Alert className="border-yellow-500/30 bg-yellow-500/5">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-sm">
              <strong>Potencial Máximo:</strong> Um Parceiro PJ que atinge Diamante (50 vendas) no trimestre 
              ganha <strong>R$ 8.500</strong> em bônus, além das comissões de 10%!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Seção 5: Upgrade para PJ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-primary" />
            Upgrade para Parceiro PJ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Se você é Afiliado e quer desbloquear ganhos ilimitados e bônus trimestrais, 
            considere fazer o upgrade para Parceiro PJ!
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600">✅ Benefícios do Upgrade</h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Comissão dobrada (5% → 10%)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Sem limite de ganhos mensais</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Acesso aos bônus trimestrais</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Potencial de até R$ 8.500/trimestre em bônus</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-blue-600">📋 Requisitos</h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>CNPJ ativo (MEI é aceito!)</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>CNAE compatível com atividade comercial</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>Capacidade de emitir NFS-e</span>
                </li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-semibold">🚀 Como Abrir um MEI</h4>
            <p className="text-sm text-muted-foreground">
              A forma mais simples de se tornar PJ é abrindo um MEI (Microempreendedor Individual). 
              É gratuito e leva poucos minutos!
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Acesse o Portal do Empreendedor</p>
                  <Button variant="link" className="h-auto p-0 text-primary" asChild>
                    <a href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor" target="_blank" rel="noopener noreferrer">
                      gov.br/mei <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Faça login com sua conta Gov.br</p>
                  <p className="text-sm text-muted-foreground">Nível prata ou ouro necessário</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Escolha as atividades (CNAEs)</p>
                  <p className="text-sm text-muted-foreground">
                    Recomendados: <strong>7319-0/02</strong> (Promoção de vendas) ou <strong>7311-4/00</strong> (Agências de publicidade)
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                  <span className="text-sm font-bold text-primary">4</span>
                </div>
                <div>
                  <p className="font-medium">Conclua o cadastro</p>
                  <p className="text-sm text-muted-foreground">Seu CNPJ é gerado na hora!</p>
                </div>
              </div>
            </div>
          </div>

          <Alert className="border-primary/30 bg-primary/5">
            <ArrowUpCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              Após abrir seu MEI, entre em contato conosco para atualizar seu cadastro 
              e começar a aproveitar todos os benefícios de Parceiro PJ!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Seção 6: FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-500" />
            Perguntas Frequentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border-b pb-4">
              <p className="font-medium">Quanto tempo leva para o pagamento cair?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Após aprovação da solicitação, o pagamento é processado em até 5 dias úteis via PIX.
              </p>
            </div>

            <div className="border-b pb-4">
              <p className="font-medium">O que acontece se eu ultrapassar R$ 1.900 como Afiliado?</p>
              <p className="text-sm text-muted-foreground mt-1">
                O valor excedente não é pago no mês atual. No início do próximo mês, seu contador de ganhos 
                é resetado e você pode continuar ganhando até o limite novamente.
              </p>
            </div>

            <div className="border-b pb-4">
              <p className="font-medium">Posso ter mais de um link de indicação?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Não. Cada vendedor possui um único código de indicação vinculado à sua conta.
              </p>
            </div>

            <div className="border-b pb-4">
              <p className="font-medium">Quando a venda aparece no meu painel?</p>
              <p className="text-sm text-muted-foreground mt-1">
                A venda aparece assim que o pagamento do cliente é aprovado pelo administrador.
              </p>
            </div>

            <div className="border-b pb-4">
              <p className="font-medium">Preciso emitir nota fiscal como Afiliado?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Não. Afiliados (CPF) não precisam emitir NF. Apenas Parceiros PJ precisam.
              </p>
            </div>

            <div className="border-b pb-4">
              <p className="font-medium">Posso indicar amigos e familiares?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Sim! Você pode indicar qualquer pessoa que tenha interesse em usar nossa plataforma.
              </p>
            </div>

            <div>
              <p className="font-medium">Como entro em contato com o suporte?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Utilize o WhatsApp disponível na página principal ou entre em contato através do 
                e-mail de suporte informado no seu contrato.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
