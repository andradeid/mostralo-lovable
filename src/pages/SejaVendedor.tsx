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
} from "lucide-react";

export default function SejaVendedor() {
  const [simulatedSales, setSimulatedSales] = useState(15);
  const avgCommission = 50;
  const monthlyEarnings = simulatedSales * avgCommission;

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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge className="mb-4" variant="secondary">
          <Zap className="w-3 h-3 mr-1" />
          Sistema de Afiliados
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
          Trabalhe no Seu Tempo.<br />Ganhe Renda Recorrente.
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Seja um vendedor Mostralo e construa sua renda mensal indicando 
          lojas para nossa plataforma. Trabalhe quando quiser, de onde quiser.
        </p>
        <div className="flex gap-4 justify-center">
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

      {/* Stats */}
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
          <Card>
            <CardHeader className="text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-2 text-primary" />
              <CardTitle>Renda Recorrente</CardTitle>
              <CardDescription>Ganhe a cada indicação aprovada</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Central de Vendas - Recursos */}
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

          {/* Material de Marketing */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3">
                <Printer className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Material de Marketing</CardTitle>
              <CardDescription>
                Flyers, banners e artes prontas para você baixar e compartilhar com seus leads
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

      {/* Simulador */}
      <section id="simulador" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Simule Seus Ganhos Mensais
        </h2>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Calculadora de Ganhos</CardTitle>
            <CardDescription>
              Veja quanto você pode ganhar baseado no número de vendas mensais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Vendas por mês: {simulatedSales}
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={simulatedSales}
                onChange={(e) => setSimulatedSales(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="bg-muted p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Comissão média por venda:</span>
                <span className="text-2xl font-bold">R$ {avgCommission}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Vendas no mês:</span>
                <span className="text-2xl font-bold">{simulatedSales}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Ganho mensal estimado:</span>
                  <span className="text-3xl font-bold text-primary">
                    R$ {monthlyEarnings.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              * Valores estimados. Comissões variam de acordo com o plano vendido.
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

      {/* Benefícios */}
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
              icon: DollarSign,
              title: "Renda Recorrente",
              description: "Ganhe comissão em cada venda aprovada. Quanto mais vender, mais ganha.",
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

      {/* Requisitos */}
      <section className="container mx-auto px-4 py-16 bg-muted/50 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-8">
          <FileText className="inline w-8 h-8 mr-2 text-primary" />
          Requisitos para Ser Vendedor
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
              a: "Infelizmente, é obrigatório ter CNPJ para ser vendedor Mostralo. Isso garante a legalidade da relação comercial.",
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

      {/* CTA Final */}
      <section id="cadastro" className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-orange-500/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl">Pronto para Começar?</CardTitle>
            <CardDescription className="text-lg">
              Faça seu cadastro agora e comece a ganhar renda recorrente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" asChild className="w-full md:w-auto">
              <Link to="/cadastro-vendedor">
                Fazer Cadastro <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Seu cadastro será analisado pelo nosso time em até 48 horas
            </p>
          </CardContent>
        </Card>
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
