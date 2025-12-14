import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Target,
  CheckCircle2,
  Gift,
  Zap,
  FileText,
  ArrowRight,
  Info,
  LayoutDashboard,
  Link2,
  Printer,
  Bot,
  Crosshair,
  ClipboardList,
  BarChart3,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";

export default function SejaVendedor() {
  const [simulatedSales, setSimulatedSales] = useState(30);
  const [copied, setCopied] = useState(false);
  const avgCommission = 50;
  const monthlyEarnings = simulatedSales * avgCommission;
  
  // Cálculo do bônus trimestral cumulativo
  const calculateTrimestralBonus = (salesPerMonth: number) => {
    const trimestralSales = salesPerMonth * 3;
    let bonus = 0;
    let tierName = "";
    
    if (trimestralSales >= 50) {
      bonus = 500 + 1000 + 2000 + 5000; // Bronze + Prata + Ouro + Diamante
      tierName = "Diamante";
    } else if (trimestralSales >= 30) {
      bonus = 500 + 1000 + 2000; // Bronze + Prata + Ouro
      tierName = "Ouro";
    } else if (trimestralSales >= 20) {
      bonus = 500 + 1000; // Bronze + Prata
      tierName = "Prata";
    } else if (trimestralSales >= 10) {
      bonus = 500; // Bronze
      tierName = "Bronze";
    }
    
    return { bonus, tierName, trimestralSales };
  };
  
  const { bonus: tierBonus, tierName, trimestralSales } = calculateTrimestralBonus(simulatedSales);
  const totalTrimestral = (monthlyEarnings * 3) + tierBonus;

  // 🎯 Capturar código de referência do vendedor
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    
    if (refCode) {
      localStorage.setItem('mostralo_referral_code', refCode);
      localStorage.setItem('mostralo_referral_timestamp', Date.now().toString());
      console.log('✅ Código de referência capturado:', refCode);
    }
  }, []);

  const copyPageText = async () => {
    const pageContent = `
# SEJA VENDEDOR MOSTRALO

## Venda Uma Vez. Receba Todo Mês.
Enquanto seu cliente usar a Mostralo, a comissão cai na sua conta.
Seja o primeiro a vender a "Libertação do iFood" na sua cidade.

## COMO FUNCIONA

### 💵 Recorrência Real
Venda uma vez, receba todo mês. Enquanto o cliente pagar, você ganha.

### ⏰ Sem Horário Fixo
Trabalhe quando e onde quiser, sem compromisso de horário.

### 🎨 Kit de Vendas Completo
Você não precisa ser Designer nem Copywriter.
✅ Artes prontas por nicho (Pizzarias, Pet Shops, Açougues...)
✅ Scripts de WhatsApp que fecham vendas

### 📊 Dashboard Exclusivo
Acompanhe suas vendas, comissões e metas em tempo real.

## VOCÊ NÃO PRECISA SER "NERD" DE COMPUTADOR
Seu trabalho é abrir a porta. Nós cuidamos do resto.

1. Você encontra a loja - Te ensinamos onde e como prospectar
2. Você mostra a solução - Te damos o vídeo e material pronto
3. O cliente fecha - Nós cuidamos do suporte e treinamento

Zero técnico: Instalação, configuração e treinamento do lojista são 100% por nossa conta. Você foca apenas em vender.

## SIMULADOR DE GANHOS
Meta: 1 venda por dia (30 vendas/mês)
- Comissão mensal: R$ 1.500
- Comissão trimestral (3 meses): R$ 4.500
- Bônus Trimestral (Ouro): R$ 3.500
- TOTAL NO TRIMESTRE: R$ 8.000

Isso é mais do que muitos empregos CLT - trabalhando no seu horário, sem chefe.

## BÔNUS TRIMESTRAIS (CUMULATIVOS)
| Tier | Vendas | Bônus |
|------|--------|-------|
| 🥉 Bronze | 10 vendas | R$ 500 |
| 🥈 Prata | 20 vendas | R$ 1.000 |
| 🥇 Ouro | 30 vendas | R$ 2.000 |
| 💎 Diamante | 50 vendas | R$ 5.000 |

Os bônus são CUMULATIVOS! Se atingir Ouro, recebe Bronze + Prata + Ouro = R$ 3.500

## FERRAMENTAS EXCLUSIVAS
- Dashboard: Acompanhe vendas, comissões e clientes em tempo real
- Link de Indicação: Seu link pessoal para compartilhar
- Material Impresso: Artes prontas para imprimir e distribuir
- Prompts de IA: Scripts de vendas prontos para usar
- Guia de Prospecção: Aprenda as melhores técnicas de vendas
- Formulário de Leads: Colete dados de potenciais clientes

## BENEFÍCIOS
- 💵 Renda Recorrente de Verdade: Venda uma vez, receba todo mês
- 🎁 Bônus Trimestrais: Até R$ 8.500 em bônus por trimestre
- 📈 Comissões Competitivas: Até 15% de comissão por venda
- 🎓 Treinamento Completo: Material e suporte para você vender

## CNAES COMPATÍVEIS (Para Parceiros PJ)
- 7319-0/02 - Promoção de vendas
- 7319-0/99 - Outras atividades de publicidade
- 4619-2/00 - Representação comercial
- 7311-4/00 - Agências de publicidade
- 8299-7/99 - Outras atividades de serviços

## FAQ

### Preciso ter experiência em vendas?
Não! Fornecemos todo o treinamento e material necessário para você começar.

### Qual é o valor da comissão?
A comissão média é de R$ 50 por venda aprovada, podendo variar conforme o plano vendido.

### Como recebo meus pagamentos?
Pagamentos são feitos via PIX até o dia 10 de cada mês, referente às vendas do mês anterior.

### Posso ser afiliado e parceiro ao mesmo tempo?
Não. Você deve escolher uma modalidade no momento do cadastro.

## CADASTRE-SE AGORA
Link: ${window.location.origin}/cadastro-vendedor
    `.trim();

    try {
      await navigator.clipboard.writeText(pageContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary">
            Mostralo
          </Link>
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild>
              <a href="#cadastro">Começar Agora</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - ATUALIZADO */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge className="mb-4" variant="secondary">
          <Zap className="w-3 h-3 mr-1" />
          Sistema de Afiliados
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
          Venda Uma Vez.<br />Receba Todo Mês.
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Enquanto seu cliente usar a Mostralo, a comissão cai na sua conta.
          <br />
          <strong className="text-foreground">Seja o primeiro a vender a "Libertação do iFood" na sua cidade.</strong>
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" asChild>
            <a href="#cadastro">
              Começar Agora <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#beneficios">Ver Benefícios</a>
          </Button>
        </div>
      </section>

      {/* Vídeo Apresentação */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Veja Como Funciona
            </h2>
            <p className="text-muted-foreground">
              Assista ao vídeo e entenda como você pode começar a ganhar dinheiro hoje mesmo
            </p>
          </div>
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-border">
            <iframe
              src="https://www.youtube.com/embed/BtX6j7hHwJ4"
              title="Como ser vendedor Mostralo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* Stats - ATUALIZADO */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="text-center">
              <Users className="w-12 h-12 mx-auto mb-2 text-primary" />
              <CardTitle>100% Remoto</CardTitle>
              <CardDescription>Trabalhe de qualquer lugar</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-2 text-primary" />
              <CardTitle>Sem Horário Fixo</CardTitle>
              <CardDescription>Você controla seu tempo</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-2 border-green-500/30 bg-green-500/5">
            <CardHeader className="text-center">
              <RefreshCw className="w-12 h-12 mx-auto mb-2 text-green-600" />
              <CardTitle className="text-green-600">💰 Recorrência Real</CardTitle>
              <CardDescription className="text-base">
                Venda uma vez, receba todo mês. Enquanto seu cliente pagar, você ganha.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* NOVA SEÇÃO: Quebra de Objeção Técnica */}
      <section className="container mx-auto px-4 py-12">
        <Card className="max-w-3xl mx-auto border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-orange-500/5">
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">🤝</div>
            <CardTitle className="text-2xl">
              Não Precisa Ser "Nerd" de Computador
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Seu trabalho é abrir a porta. Nós cuidamos do resto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold">Você encontra a loja</p>
                <p className="text-sm text-muted-foreground">
                  Te ensinamos onde e como prospectar
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-semibold">Você mostra a solução</p>
                <p className="text-sm text-muted-foreground">
                  Te damos o vídeo e material pronto
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-semibold">O cliente fecha</p>
                <p className="text-sm text-muted-foreground">
                  Nós cuidamos do suporte e treinamento
                </p>
              </div>
            </div>
            <Alert className="mt-6 bg-blue-500/10 border-blue-500/20">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong>Zero técnico:</strong> Instalação, configuração e treinamento do lojista são 100% por nossa conta. Você foca apenas em vender.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>

      {/* Central de Vendas - Recursos - ATUALIZADO */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <Badge className="mb-4" variant="outline">
            <Sparkles className="w-3 h-3 mr-1" />
            Exclusivo para Vendedores
          </Badge>
          <h2 className="text-3xl font-bold mb-4">
            Sua Central de Vendas Completa
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ao se cadastrar, você terá acesso a um painel exclusivo com todas as ferramentas 
            que precisa para vender com eficiência e acompanhar seus resultados.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Dashboard */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                <LayoutDashboard className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Dashboard de Vendas</CardTitle>
              <CardDescription>
                Acompanhe suas vendas, comissões e progresso do bônus trimestral em tempo real
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Link de Indicação */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-3">
                <Link2 className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Link Personalizado</CardTitle>
              <CardDescription>
                Seu link exclusivo para indicar clientes. Cada venda é automaticamente rastreada
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Material de Marketing - ATUALIZADO */}
          <Card className="border-2 border-primary/30 hover:border-primary/50 transition-colors bg-gradient-to-br from-primary/5 to-orange-500/5">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                <Printer className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">🎨 Kit de Vendas Completo</CardTitle>
              <CardDescription className="space-y-1">
                <strong className="block text-foreground">Você não precisa ser Designer nem Copywriter.</strong>
                <span className="block">✅ Artes prontas por nicho (Pizzarias, Pet Shops, Açougues...)</span>
                <span className="block">✅ Scripts de WhatsApp que fecham vendas</span>
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Gestão de Leads */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Gestão de Leads</CardTitle>
              <CardDescription>
                Veja todos os leads que acessaram seu link e acompanhe o status de cada um
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Prompts de IA */}
          <Card className="border-2 hover:border-primary/50 transition-colors relative overflow-hidden">
            <Badge className="absolute top-2 right-2 bg-gradient-to-r from-primary to-orange-500 text-primary-foreground">
              IA
            </Badge>
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-orange-500/10 rounded-lg flex items-center justify-center mb-3">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Prompts de Vendas com IA</CardTitle>
              <CardDescription>
                Scripts de vendas inteligentes: consultivo, persuasivo e urgência - prontos para usar no ChatGPT
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Guia de Prospecção */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mb-3">
                <Crosshair className="w-6 h-6 text-amber-600" />
              </div>
              <CardTitle className="text-lg">Guia de Prospecção</CardTitle>
              <CardDescription>
                Onde encontrar clientes, como abordar, quebra de objeções e técnicas de fechamento
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Guia de Cadastro */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-teal-500/10 rounded-lg flex items-center justify-center mb-3">
                <ClipboardList className="w-6 h-6 text-teal-600" />
              </div>
              <CardTitle className="text-lg">Roteiro de Onboarding</CardTitle>
              <CardDescription>
                Guia passo a passo para coletar os dados do cliente e fazer o cadastro corretamente
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Métricas */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-rose-500/10 rounded-lg flex items-center justify-center mb-3">
                <BarChart3 className="w-6 h-6 text-rose-600" />
              </div>
              <CardTitle className="text-lg">Métricas em Tempo Real</CardTitle>
              <CardDescription>
                Veja suas vendas, comissões pendentes e quanto falta para o próximo nível de bônus
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Contrato e Pagamentos */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle className="text-lg">Contrato & Pagamentos</CardTitle>
              <CardDescription>
                Contrato digital, histórico de versões e solicitação de pagamentos via PIX
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA secundário */}
        <div className="text-center mt-10">
          <p className="text-muted-foreground mb-4">
            Tudo isso <strong>gratuitamente</strong> para você começar a vender ainda hoje!
          </p>
          <Button size="lg" variant="outline" asChild>
            <a href="#cadastro">
              Quero Ter Acesso <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* Simulador - REFORMULADO PARA FOCO TRIMESTRAL */}
      <section id="simulador" className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4">
            <DollarSign className="w-3 h-3 mr-1" />
            Simulador de Ganhos
          </Badge>
          <h2 className="text-3xl font-bold mb-2">
            Quanto Vale o Seu Esforço?
          </h2>
          <p className="text-muted-foreground">
            Veja o que acontece quando você faz <strong>1 venda por dia</strong>
          </p>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 space-y-6">
            {/* Slider para vendas mensais */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Vendas por mês: <span className="text-primary font-bold text-lg">{simulatedSales}</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={simulatedSales}
                onChange={(e) => setSimulatedSales(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1/mês</span>
                <span className="font-medium text-primary">30/mês (1/dia)</span>
                <span>50+/mês</span>
              </div>
            </div>
            
            {/* Cálculos */}
            <div className="bg-muted p-6 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Comissão mensal:</span>
                <span className="text-xl font-bold">R$ {monthlyEarnings.toLocaleString('pt-BR')}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Comissão trimestral (3 meses):</span>
                <span className="text-xl font-bold">R$ {(monthlyEarnings * 3).toLocaleString('pt-BR')}</span>
              </div>
              
              {tierName && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    + Bônus Trimestral ({tierName}):
                  </span>
                  <span className="text-xl font-bold">R$ {tierBonus.toLocaleString('pt-BR')}</span>
                </div>
              )}
              
              <div className="border-t-2 border-primary pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">TOTAL NO TRIMESTRE:</span>
                  <span className="text-4xl font-bold text-primary">
                    R$ {totalTrimestral.toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Isso é <strong className="text-foreground">R$ {Math.round(totalTrimestral / 3).toLocaleString('pt-BR')}/mês</strong> de média
                </p>
              </div>
            </div>
            
            {/* Comparativo impactante */}
            {simulatedSales >= 30 && (
              <Alert className="bg-green-500/10 border-green-500/30">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  <strong>💡 Perspectiva:</strong> Com 1 venda por dia, você ganha mais do que muitos empregos CLT - trabalhando no seu horário, sem chefe.
                </AlertDescription>
              </Alert>
            )}
            
            <p className="text-xs text-muted-foreground text-center">
              * Valores estimados com comissão média de R$ 50. Varia conforme o plano vendido.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Bônus Trimestral */}
      <section className="container mx-auto px-4 py-16 bg-muted/50 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-4">
          <Gift className="inline w-8 h-8 mr-2 text-primary" />
          Bônus Trimestral Cumulativo
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Além das comissões mensais, você ganha bônus extras ao atingir metas trimestrais.
          <br />E o melhor: <strong>os bônus são cumulativos!</strong>
        </p>
        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="border-2 border-amber-700/20">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-amber-700/10 rounded-full flex items-center justify-center mx-auto mb-2">
                🥉
              </div>
              <CardTitle>Bronze</CardTitle>
              <CardDescription>10 vendas no trimestre</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-3xl font-bold text-amber-700">R$ 500</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-400/20">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gray-400/10 rounded-full flex items-center justify-center mx-auto mb-2">
                🥈
              </div>
              <CardTitle>Prata</CardTitle>
              <CardDescription>20 vendas no trimestre</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-3xl font-bold text-gray-600">R$ 1.000</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-500/20">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                🥇
              </div>
              <CardTitle>Ouro</CardTitle>
              <CardDescription>30 vendas no trimestre</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-3xl font-bold text-yellow-600">R$ 2.000</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-500/20">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                💎
              </div>
              <CardTitle>Diamante</CardTitle>
              <CardDescription>50 vendas no trimestre</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-3xl font-bold text-blue-600">R$ 5.000</p>
            </CardContent>
          </Card>
        </div>
        <Alert className="max-w-2xl mx-auto mt-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Cumulativo:</strong> Se você fizer 30 vendas, ganha Bronze (R$ 500) + Prata (R$ 1.000) + Ouro (R$ 2.000) = <strong>R$ 3.500 de bônus!</strong>
          </AlertDescription>
        </Alert>
      </section>

      {/* Benefícios - ATUALIZADO */}
      <section id="beneficios" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Por Que Ser Vendedor Mostralo?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Clock,
              title: "Autonomia Total",
              description: "Trabalhe quando e onde quiser. Sem horário fixo, sem escritório.",
            },
            {
              icon: RefreshCw,
              title: "💵 Renda Recorrente de Verdade",
              description: "Venda uma vez, receba todo mês. Enquanto o cliente pagar, você ganha.",
            },
            {
              icon: Gift,
              title: "Bônus Trimestrais",
              description: "Metas atingidas = bônus extras cumulativos todo trimestre.",
            },
            {
              icon: Target,
              title: "Sem Investimento",
              description: "Não precisa comprar nada. Apenas um CNPJ com CNAE compatível.",
            },
            {
              icon: Zap,
              title: "Suporte Completo",
              description: "Material de vendas, treinamento e suporte direto da equipe Mostralo.",
            },
            {
              icon: TrendingUp,
              title: "Mercado em Crescimento",
              description: "Delivery e e-commerce estão em alta. Lojas precisam do Mostralo.",
            },
          ].map((benefit, idx) => (
            <Card key={idx}>
              <CardHeader>
                <benefit.icon className="w-10 h-10 text-primary mb-2" />
                <CardTitle>{benefit.title}</CardTitle>
                <CardDescription>{benefit.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Duas Opções - Afiliado vs Parceiro PJ */}
      <section id="opcoes" className="container mx-auto px-4 py-16 bg-muted/50 rounded-lg">
        <div className="text-center mb-10">
          <Badge className="mb-4" variant="outline">
            <Users className="w-3 h-3 mr-1" />
            Duas Formas de Participar
          </Badge>
          <h2 className="text-3xl font-bold mb-4">
            Escolha Como Quer Vender
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Não tem CNPJ? Sem problema! Oferecemos opções para todos os perfis.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Afiliado */}
          <Card className="border-2">
            <CardHeader className="text-center">
              <Badge variant="secondary" className="w-fit mx-auto mb-2">Sem CNPJ</Badge>
              <CardTitle className="text-2xl">Afiliado</CardTitle>
              <div className="text-4xl font-bold text-primary mt-2">5-7%</div>
              <CardDescription className="text-base">de comissão por venda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Cadastro apenas com CPF</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Início rápido em 2 etapas</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Pagamento via PIX</span>
                </li>
                <li className="flex items-center gap-2 text-amber-600">
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <span>Limite: R$ 1.900/mês</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-5 h-5 flex-shrink-0 text-center">-</span>
                  <span>Sem bônus trimestral</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline" size="lg" asChild>
                <Link to="/cadastro-vendedor?type=affiliate">
                  Começar como Afiliado <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Parceiro PJ */}
          <Card className="border-2 border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-orange-500 text-white px-4 py-1 text-xs font-bold rounded-bl-lg">
              RECOMENDADO
            </div>
            <CardHeader className="text-center">
              <Badge className="w-fit mx-auto mb-2">Com MEI/CNPJ</Badge>
              <CardTitle className="text-2xl">Parceiro PJ</CardTitle>
              <div className="text-4xl font-bold text-primary mt-2">10%</div>
              <CardDescription className="text-base">de comissão por venda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>CNPJ ativo + CNAE compatível</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span><strong>Ganhos ilimitados</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Bônus até R$ 8.500/trimestre</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Contrato formal PJ</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Pode emitir Nota Fiscal</span>
                </li>
              </ul>
              <Button className="w-full" size="lg" asChild>
                <Link to="/cadastro-vendedor?type=partner">
                  Começar como Parceiro <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* CTA MEI */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground mb-2">
            Não tem MEI mas quer ganhar mais?
          </p>
          <Button variant="link" asChild>
            <a href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor" target="_blank" rel="noopener noreferrer">
              Abrir MEI Gratuitamente →
            </a>
          </Button>
        </div>
      </section>

      {/* Requisitos Parceiro PJ */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          <FileText className="inline w-8 h-8 mr-2 text-primary" />
          Requisitos para Parceiro PJ
        </h2>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">CNPJ Ativo</p>
                <p className="text-sm text-muted-foreground">
                  Você precisa ter um CNPJ ativo na Receita Federal
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">CNAE Compatível</p>
                <p className="text-sm text-muted-foreground">
                  Seu CNPJ deve ter um dos CNAEs aceitos:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
                  <li>• 7319-0/02 - Promoção de vendas</li>
                  <li>• 7319-0/99 - Outras atividades de publicidade</li>
                  <li>• 4619-2/00 - Representantes comerciais e agentes</li>
                  <li>• 7311-4/00 - Agências de publicidade</li>
                  <li>• 8299-7/99 - Outras atividades de serviços prestados</li>
                </ul>
                {/* NOTA TRANQUILIZADORA SOBRE CNAE */}
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                  💡 <strong>Não sabe qual é o seu CNAE?</strong> Não se preocupe! 
                  Nosso time te ajuda a verificar isso após o cadastro.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Chave PIX</p>
                <p className="text-sm text-muted-foreground">
                  Para receber seus pagamentos mensalmente
                </p>
              </div>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> A relação é estritamente comercial (B2B), sem vínculo empregatício. 
                Você precisará emitir Nota Fiscal de Serviços para receber os pagamentos.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Perguntas Frequentes
        </h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              q: "Quanto posso ganhar por venda?",
              a: "As comissões variam de R$ 30 a R$ 100 por venda, dependendo do plano que o cliente escolher. Quanto maior o plano, maior sua comissão.",
            },
            {
              q: "Como recebo os pagamentos?",
              a: "Você solicita o pagamento a partir do dia 1º de cada mês. Emite uma Nota Fiscal e recebe via PIX em até 5 dias úteis após aprovação.",
            },
            {
              q: "Preciso ter experiência em vendas?",
              a: "Não! Fornecemos todo o material de vendas, treinamento e suporte. Você só precisa ter vontade de trabalhar.",
            },
            {
              q: "E se eu não tiver CNPJ?",
              a: "Você pode se cadastrar como Afiliado usando apenas seu CPF! A comissão é de 5-7% com limite de R$ 1.900/mês. Se quiser ganhar mais, pode abrir um MEI gratuitamente e fazer upgrade para Parceiro PJ.",
            },
            {
              q: "Posso vender para qualquer loja?",
              a: "Sim! Qualquer loja que precise de uma plataforma de delivery ou e-commerce pode usar o Mostralo.",
            },
          ].map((faq, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-lg">{faq.q}</CardTitle>
                <CardDescription>{faq.a}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id="cadastro" className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-orange-500/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl">Pronto para Começar?</CardTitle>
            <CardDescription className="text-lg">
              Escolha como quer participar e comece a ganhar renda recorrente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="outline" asChild>
                <Link to="/cadastro-vendedor?type=affiliate">
                  Afiliado (CPF) <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" asChild>
                <Link to="/cadastro-vendedor?type=partner">
                  Parceiro PJ (CNPJ) <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Seu cadastro será analisado pelo nosso time em até 48 horas
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Copiar Texto para IA */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold text-foreground">Usar com IA</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Copie todo o conteúdo desta página para usar em prompts de IA como ChatGPT, Claude ou outros assistentes.
              </p>
              <Button 
                onClick={copyPageText}
                variant={copied ? "secondary" : "outline"}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    Texto Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar Todo o Texto da Página
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Mostralo. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
