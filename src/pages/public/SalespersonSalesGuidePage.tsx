import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Store, Menu, X, TrendingUp, DollarSign, Users, Target, MapPin, 
  MessageSquare, Shield, Calculator, Award, Briefcase, Clock, 
  CheckCircle2, ArrowRight, Phone, Instagram, Map, Building2,
  Percent, Gift, FileText, BarChart3, Zap, Heart, Star,
  ChevronRight, Play, Download, BookOpen, HelpCircle, Rocket,
  Trophy, Crown, Gem, Medal, UserPlus, CreditCard, Calendar,
  TrendingDown, AlertTriangle, Lightbulb, Quote, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardFooter } from "@/components/admin/DashboardFooter";

const SalespersonGuidePage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  
  // Simulador de Ganhos
  const [salesPerMonth, setSalesPerMonth] = useState(15);
  const [sellerType, setSellerType] = useState<"affiliate" | "partner">("partner");
  const [selectedPlan, setSelectedPlan] = useState(597.90);
  
  // Calculadora de Economia do Cliente
  const [clientOrders, setClientOrders] = useState(300);
  const [clientTicket, setClientTicket] = useState(45);
  
  const commissionRate = sellerType === "affiliate" ? 0.06 : 0.10;
  const monthlyCommission = salesPerMonth * selectedPlan * commissionRate;
  const quarterSales = salesPerMonth * 3;
  
  const getBonusAmount = () => {
    if (sellerType === "affiliate") return 0;
    let bonus = 0;
    if (quarterSales >= 10) bonus += 500;
    if (quarterSales >= 20) bonus += 1000;
    if (quarterSales >= 30) bonus += 2000;
    if (quarterSales >= 50) bonus += 5000;
    return bonus;
  };
  
  const quarterlyEarnings = (monthlyCommission * 3) + getBonusAmount();
  const annualEarnings = (monthlyCommission * 12) + (getBonusAmount() * 4);
  
  // Economia do cliente
  const clientMonthlyRevenue = clientOrders * clientTicket;
  const ifoodTax = clientMonthlyRevenue * 0.25;
  const mostraloPrice = 597.90;
  const clientSavings = ifoodTax - mostraloPrice;
  const clientAnnualSavings = clientSavings * 12;

  const sections = [
    { id: "hero", label: "Início", icon: Rocket },
    { id: "market", label: "Mercado", icon: TrendingUp },
    { id: "simulator", label: "Simulador", icon: Calculator },
    { id: "audience", label: "Público-Alvo", icon: Target },
    { id: "prospecting", label: "Prospecção", icon: MapPin },
    { id: "scripts", label: "Scripts", icon: MessageSquare },
    { id: "objections", label: "Objeções", icon: Shield },
    { id: "calculator", label: "Economia", icon: DollarSign },
    { id: "features", label: "Ferramentas", icon: Briefcase },
    { id: "bonus", label: "Bônus", icon: Gift },
    { id: "comparison", label: "Comparativo", icon: Users },
    { id: "workflow", label: "Fluxo", icon: Clock },
    { id: "tips", label: "Dicas", icon: Lightbulb },
    { id: "results", label: "Resultados", icon: BarChart3 },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "cta", label: "Cadastro", icon: UserPlus },
  ];

  const targetAudience = [
    { icon: "🍕", name: "Pizzarias", pain: "Taxa alta no iFood (27%)", argument: "Com 500 pedidos/mês de R$50, você paga R$6.750 ao iFood. Conosco: R$597,90. Economia: R$6.152/mês", potential: "Alto" },
    { icon: "🍔", name: "Hamburguerias", pain: "Margem apertada, concorrência alta", argument: "Cada % economizado vai direto pro lucro. Sem taxa = mais margem para investir", potential: "Alto" },
    { icon: "🍣", name: "Sushi/Japonês", pain: "Ticket alto = taxa alta", argument: "Ticket médio R$80 = R$20 de taxa por pedido no iFood. 100 pedidos = R$2.000/mês de economia", potential: "Muito Alto" },
    { icon: "🥐", name: "Padarias", pain: "Encomendas e fidelização", argument: "Pedidos agendados + WhatsApp Marketing = clientes fiéis que compram todo mês", potential: "Médio" },
    { icon: "🍝", name: "Restaurantes", pain: "Pratos feitos, marmitas", argument: "Clientes de almoço são fiéis. Com seu app, eles pedem direto sem intermediário", potential: "Alto" },
    { icon: "🛒", name: "Mercados", pain: "Delivery de conveniência crescendo", argument: "Mercado de conveniência explodiu. Seu app próprio = margem total", potential: "Crescente" },
    { icon: "🍦", name: "Açaiterias", pain: "Sazonalidade, promoções", argument: "Promoções automáticas + Happy Hour = movimento nos dias fracos", potential: "Médio" },
    { icon: "🥗", name: "Marmitas Fit", pain: "Público específico, recorrência", argument: "WhatsApp Marketing perfeito: lembra cliente toda semana de pedir", potential: "Alto" },
  ];

  const objections = [
    { objection: "Já uso iFood", response: "Ótimo! Você não precisa sair do iFood. O Mostralo é complementar. Com o tempo, seus clientes migram para seu app próprio e você para de pagar 27%." },
    { objection: "Não tenho tempo", response: "A gente configura tudo pra você. Em 48h sua loja está no ar. Você só precisa receber os pedidos." },
    { objection: "É caro", response: "O plano custa R$ 397,90/mês. Se você tem 50 pedidos/mês no iFood com ticket de R$50 e paga 27%, são R$675 de taxa. Economia de R$277/mês desde o primeiro mês." },
    { objection: "Meus clientes só usam iFood", response: "Seus clientes usam iFood porque você não tem alternativa. Com seu app próprio + WhatsApp Marketing, você recupera 23% dos inativos." },
    { objection: "Vou pensar", response: "Entendo! Enquanto você pensa, posso te mandar um cálculo personalizado de quanto você economizaria? Qual seu volume de pedidos mensal?" },
    { objection: "Não sei usar tecnologia", response: "O sistema é mais fácil que o WhatsApp. Pedido chega, você aceita, pronto. Se precisar, temos suporte em português." },
  ];

  const sellerFeatures = [
    { icon: BarChart3, title: "Dashboard de Vendas", desc: "KPIs em tempo real: vendas, comissões, progresso de metas" },
    { icon: ExternalLink, title: "Link Personalizado", desc: "Seu link único com rastreamento automático de indicações" },
    { icon: FileText, title: "Material de Marketing", desc: "Flyers, banners, apresentações prontas para usar" },
    { icon: Users, title: "Gestão de Leads", desc: "Acompanhe cada contato do primeiro ao fechamento" },
    { icon: Zap, title: "Prompts de IA", desc: "3 tipos de scripts de venda gerados por inteligência artificial" },
    { icon: BookOpen, title: "Guia de Prospecção", desc: "Onde e como encontrar clientes potenciais" },
    { icon: MessageSquare, title: "Roteiro de Onboarding", desc: "Perguntas certas para fechar a venda" },
    { icon: TrendingUp, title: "Métricas em Tempo Real", desc: "Acompanhe seus resultados ao vivo" },
    { icon: Shield, title: "Contrato Digital", desc: "Segurança jurídica com assinatura digital" },
    { icon: CreditCard, title: "Histórico de Pagamentos", desc: "Transparência total em suas comissões" },
  ];

  const bonusTiers = [
    { tier: "Bronze", icon: Medal, sales: 10, bonus: 500, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
    { tier: "Prata", icon: Award, sales: 20, bonus: 1000, color: "text-slate-500", bgColor: "bg-slate-100 dark:bg-slate-800/50" },
    { tier: "Ouro", icon: Trophy, sales: 30, bonus: 2000, color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
    { tier: "Diamante", icon: Gem, sales: 50, bonus: 5000, color: "text-cyan-500", bgColor: "bg-cyan-100 dark:bg-cyan-900/30" },
  ];

  const faqItems = [
    { q: "Quanto posso ganhar por venda?", a: "Afiliados ganham 5-7% e Parceiros PJ ganham 10% do valor do plano. Ex: Plano Profissional (R$597,90) = R$59,79 por venda como Parceiro." },
    { q: "Como funciona o pagamento?", a: "Solicite pagamento a partir do dia 1 de cada mês. Parceiros PJ emitem NF, Afiliados não precisam. PIX em até 5 dias úteis." },
    { q: "Preciso de experiência em vendas?", a: "Não! Fornecemos todos os materiais, scripts e treinamento. Qualquer pessoa pode começar." },
    { q: "Posso vender para qualquer segmento?", a: "Sim! Restaurantes, pizzarias, hamburguerias, mercados, padarias... qualquer negócio com delivery." },
    { q: "O que acontece se o cliente cancelar?", a: "Você recebe comissão apenas de clientes ativos. Se cancelar no primeiro mês, a comissão é estornada." },
    { q: "Como funciona o bônus trimestral?", a: "Apenas Parceiros PJ são elegíveis. Os bônus são cumulativos: 10 vendas = Bronze (R$500), 20 = +Prata (R$1.000), etc." },
    { q: "Posso começar como Afiliado e virar PJ?", a: "Sim! Muitos começam como Afiliado para testar e depois fazem upgrade para Parceiro PJ." },
    { q: "Preciso emitir nota fiscal?", a: "Apenas Parceiros PJ precisam emitir NF. Afiliados recebem como pessoa física." },
    { q: "Qual o prazo para receber?", a: "Após solicitar pagamento e (se PJ) enviar NF, o PIX cai em até 5 dias úteis." },
    { q: "Posso indicar de qualquer cidade do Brasil?", a: "Sim! O sistema é 100% online. Você pode indicar clientes de qualquer lugar do país." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 bg-primary rounded-lg">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Mostralo</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Início
              </Link>
              <Link to="/funcionalidades" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Funcionalidades
              </Link>
              <Link to="/seja-vendedor" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Seja Vendedor
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/seja-vendedor?type=affiliate" className="hidden md:block">
                <Button variant="outline" size="sm">Cadastrar Afiliado</Button>
              </Link>
              <Link to="/seja-vendedor?type=partner" className="hidden md:block">
                <Button size="sm">Cadastrar Parceiro PJ</Button>
              </Link>
              <button 
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border">
            <div className="container mx-auto px-4 py-4 space-y-3">
              <Link to="/" className="block text-muted-foreground hover:text-foreground">Início</Link>
              <Link to="/funcionalidades" className="block text-muted-foreground hover:text-foreground">Funcionalidades</Link>
              <Link to="/seja-vendedor" className="block text-muted-foreground hover:text-foreground">Seja Vendedor</Link>
              <Separator />
              <Link to="/seja-vendedor?type=affiliate">
                <Button variant="outline" className="w-full">Cadastrar Afiliado</Button>
              </Link>
              <Link to="/seja-vendedor?type=partner">
                <Button className="w-full">Cadastrar Parceiro PJ</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-56 bg-card/50 border-r border-border overflow-y-auto">
        <nav className="p-4 space-y-1">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSection === section.id 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <section.icon className="h-4 w-4" />
              {section.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="pt-16 lg:pl-56">
        {/* Hero Section */}
        <section id="hero" className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-orange-50/50 dark:from-primary/10 dark:via-background dark:to-orange-950/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <TrendingUp className="h-3 w-3 mr-1" />
                Mercado de R$ 110+ bilhões/ano
              </Badge>
              
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Seja Vendedor Mostralo: <br />
                <span className="text-primary">Construa Sua Renda Recorrente</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                O mercado de delivery no Brasil movimenta <strong>R$ 110+ bilhões/ano</strong>. 
                Ajude restaurantes a economizar até <strong>27%</strong> e ganhe comissões mensais 
                enquanto constrói uma renda que cresce todo mês.
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <Badge variant="outline" className="px-4 py-2">
                  <Building2 className="h-4 w-4 mr-2" />
                  1.6 milhão de estabelecimentos
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  7% crescimento anual
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Até R$ 8.500 em bônus/trimestre
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a href="#simulator">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Calculator className="h-5 w-5 mr-2" />
                    Calcular Meus Ganhos
                  </Button>
                </a>
                <Link to="/seja-vendedor">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Quero Me Cadastrar
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Market Numbers */}
        <section id="market" className="py-16 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">📈 Dados do Mercado</Badge>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                O Mercado de Delivery no Brasil
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Números que provam: <strong>existe demanda gigante</strong> e restaurantes precisam de ajuda.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Mercado 2025", value: "US$ 21+ bi", sub: "~R$ 110 bilhões", icon: DollarSign },
                { label: "Crescimento", value: "7,05%", sub: "ao ano", icon: TrendingUp },
                { label: "Projeção 2029", value: "US$ 27,8 bi", sub: "~R$ 146 bilhões", icon: Target },
                { label: "Estabelecimentos", value: "1,6 mi", sub: "food service", icon: Building2 },
              ].map((stat, i) => (
                <Card key={i} className="text-center bg-white/80 dark:bg-card">
                  <CardContent className="pt-6">
                    <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.sub}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    O Problema dos Restaurantes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="destructive">27%</Badge>
                    <p className="text-sm">Taxa cobrada pelo iFood por pedido</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="destructive">29 mil</Badge>
                    <p className="text-sm">Restaurantes fecharam em 2024 (custos altos)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="destructive">68%</Badge>
                    <p className="text-sm">Clientes nunca voltam a comprar</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    A Solução que Você Oferece
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-green-600">0%</Badge>
                    <p className="text-sm">Taxa por pedido no Mostralo</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-green-600">23%</Badge>
                    <p className="text-sm">Clientes inativos recuperados via WhatsApp</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-green-600">100%</Badge>
                    <p className="text-sm">Dados do cliente pertencem ao lojista</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 bg-primary/5 border-primary/20">
              <CardContent className="py-6 text-center">
                <p className="text-lg font-medium">
                  💡 <strong>Seu papel:</strong> Ser o consultor que traz a solução. 
                  Restaurantes estão buscando alternativas ao iFood. Você será quem apresenta.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Earnings Simulator */}
        <section id="simulator" className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                💰 Simulador Interativo
              </Badge>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Quanto Você Pode Ganhar?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Ajuste os valores e veja seu potencial de ganhos em tempo real.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="bg-white/90 dark:bg-card">
                <CardContent className="pt-6 space-y-8">
                  {/* Tipo de Vendedor */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Tipo de Vendedor</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setSellerType("affiliate")}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          sellerType === "affiliate" 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <p className="font-semibold">Afiliado (CPF)</p>
                        <p className="text-sm text-muted-foreground">5-7% comissão</p>
                        <p className="text-xs text-muted-foreground">Limite R$ 1.900/mês</p>
                      </button>
                      <button
                        onClick={() => setSellerType("partner")}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          sellerType === "partner" 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <p className="font-semibold">Parceiro PJ (CNPJ)</p>
                        <p className="text-sm text-primary font-medium">10% comissão</p>
                        <p className="text-xs text-green-600">+ Bônus trimestrais</p>
                      </button>
                    </div>
                  </div>

                  {/* Vendas por Mês */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-base font-semibold">Vendas por Mês</Label>
                      <span className="text-2xl font-bold text-primary">{salesPerMonth}</span>
                    </div>
                    <Slider
                      value={[salesPerMonth]}
                      onValueChange={(v) => setSalesPerMonth(v[0])}
                      min={1}
                      max={50}
                      step={1}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 venda</span>
                      <span>50 vendas</span>
                    </div>
                  </div>

                  {/* Plano Médio */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Plano Médio Vendido</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { name: "Essencial", price: 397.90 },
                        { name: "Profissional", price: 597.90 },
                        { name: "Empresarial", price: 997.90 },
                      ].map((plan) => (
                        <button
                          key={plan.name}
                          onClick={() => setSelectedPlan(plan.price)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            selectedPlan === plan.price 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <p className="font-semibold text-sm">{plan.name}</p>
                          <p className="text-primary font-bold">R$ {plan.price.toFixed(2).replace('.', ',')}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Resultados */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">📊 Seus Ganhos</h3>
                      
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Comissão por venda ({(commissionRate * 100).toFixed(0)}%)</p>
                        <p className="text-2xl font-bold text-primary">
                          R$ {(selectedPlan * commissionRate).toFixed(2).replace('.', ',')}
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Ganho Mensal ({salesPerMonth} vendas)</p>
                        <p className="text-2xl font-bold text-primary">
                          R$ {monthlyCommission.toFixed(2).replace('.', ',')}
                        </p>
                      </div>

                      {sellerType === "partner" && getBonusAmount() > 0 && (
                        <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30">
                          <p className="text-sm text-green-700 dark:text-green-400">Bônus Trimestral ({quarterSales} vendas)</p>
                          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                            + R$ {getBonusAmount().toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">🎯 Projeções</h3>
                      
                      <div className="p-4 rounded-lg bg-primary/10">
                        <p className="text-sm text-muted-foreground">Ganho Trimestral</p>
                        <p className="text-3xl font-bold text-primary">
                          R$ {quarterlyEarnings.toFixed(2).replace('.', ',')}
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-primary/20">
                        <p className="text-sm text-muted-foreground">Projeção Anual</p>
                        <p className="text-3xl font-bold text-primary">
                          R$ {annualEarnings.toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ≈ {(annualEarnings / 1412).toFixed(1)} salários mínimos
                        </p>
                      </div>
                    </div>
                  </div>

                  {sellerType === "affiliate" && (
                    <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
                      <CardContent className="py-4">
                        <p className="text-sm text-amber-800 dark:text-amber-400">
                          💡 <strong>Dica:</strong> Como Afiliado você tem limite de R$ 1.900/mês. 
                          Considere virar <strong>Parceiro PJ</strong> para ganhos ilimitados + bônus trimestrais!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Target Audience */}
        <section id="audience" className="py-16 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">🎯 Público-Alvo</Badge>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Para Quem Vender?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Cada segmento tem suas dores específicas. Use os argumentos certos para cada cliente.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {targetAudience.map((audience, i) => (
                <Card key={i} className="bg-white/80 dark:bg-card hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{audience.icon}</span>
                      <Badge variant="outline" className="text-xs">
                        {audience.potential}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{audience.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Dor Principal</p>
                      <p className="text-sm text-red-600 dark:text-red-400">{audience.pain}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Argumento</p>
                      <p className="text-sm text-green-700 dark:text-green-400">{audience.argument}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Where to Prospect */}
        <section id="prospecting" className="py-16 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">🔍 Prospecção</Badge>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Onde Encontrar Clientes
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Guia prático de onde buscar restaurantes que precisam da sua ajuda.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Map, title: "Google Maps", desc: "Pesquise 'restaurante delivery [cidade]' e veja quem não tem site próprio", tip: "Foque em quem tem avaliação boa mas não tem presença digital" },
                { icon: Instagram, title: "Instagram", desc: "Busque hashtags como #deliverybrasilia #pizzariasp #hamburgueria", tip: "Procure perfis comerciais com WhatsApp no bio" },
                { icon: Building2, title: "iFood", desc: "Veja quem paga 27% de taxa e não tem sistema próprio", tip: "Restaurantes com muitos pedidos sentem mais a dor da taxa" },
                { icon: MapPin, title: "Visita Local", desc: "Caminhe pelo bairro e converse com donos de restaurante", tip: "Presença física gera mais confiança" },
                { icon: MessageSquare, title: "WhatsApp Business", desc: "Muitos restaurantes usam só WhatsApp - ofereça upgrade", tip: "Veja se o número tem status comercial" },
                { icon: Users, title: "Eventos", desc: "Feiras gastronômicas, eventos do setor, encontros de empreendedores", tip: "Networking presencial converte muito" },
                { icon: Building2, title: "Grupos Facebook", desc: "Grupos de empreendedores de restaurantes da sua cidade", tip: "Ofereça valor antes de vender" },
                { icon: Heart, title: "Indicações", desc: "Cada cliente satisfeito indica 2-3 outros", tip: "Peça indicação após ativação do cliente" },
              ].map((item, i) => (
                <Card key={i} className="bg-white/80 dark:bg-card">
                  <CardContent className="pt-6">
                    <item.icon className="h-8 w-8 mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
                    <div className="p-2 bg-primary/5 rounded text-xs">
                      💡 {item.tip}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Sales Scripts */}
        <section id="scripts" className="py-16 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">💬 Scripts de Venda</Badge>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Como Abordar
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Scripts prontos para cada situação. Copie e adapte para seu estilo.
              </p>
            </div>

            <Tabs defaultValue="whatsapp" className="max-w-4xl mx-auto">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                <TabsTrigger value="presencial">Presencial</TabsTrigger>
                <TabsTrigger value="ligacao">Ligação</TabsTrigger>
              </TabsList>

              <TabsContent value="whatsapp">
                <Card className="bg-white/90 dark:bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                      Script WhatsApp
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-500">
                      <p className="text-sm leading-relaxed">
                        "Olá! 👋 Vi que vocês fazem delivery pelo iFood. 
                        Sabia que existe uma forma de <strong>economizar até 27% em taxas</strong> e ter seu próprio aplicativo de delivery?
                        <br /><br />
                        Sou consultor da Mostralo e posso te mostrar como funciona. 
                        <strong>Tem 5 minutos?</strong> 
                        <br /><br />
                        A gente ajuda restaurantes a economizarem mais de R$ 2.000/mês em taxas. 📊"
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      💡 Use emojis com moderação. Seja direto e mostre o benefício logo de cara.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="presencial">
                <Card className="bg-white/90 dark:bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Script Presencial
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm leading-relaxed">
                        "Boa tarde! Meu nome é <strong>[seu nome]</strong>, sou consultor da Mostralo, uma plataforma de delivery próprio.
                        <br /><br />
                        Vocês usam iFood? <em>[Aguarde resposta]</em>
                        <br /><br />
                        <strong>[Se sim]</strong> Então vocês pagam até 27% de taxa por pedido. A gente oferece <strong>0% de taxa</strong> - você fica com 100% do dinheiro.
                        <br /><br />
                        Posso mostrar em 2 minutos como funciona?"
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      💡 Faça perguntas para engajar. Deixe o cliente falar sobre suas dores.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ligacao">
                <Card className="bg-white/90 dark:bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-purple-600" />
                      Script Ligação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-500">
                      <p className="text-sm leading-relaxed">
                        "Olá, falo com <strong>[nome do responsável]</strong>? Tudo bem?
                        <br /><br />
                        Meu nome é <strong>[seu nome]</strong>, sou consultor da Mostralo. 
                        A gente ajuda restaurantes a <strong>economizar até R$ 3.000 por mês</strong> em taxas de delivery.
                        <br /><br />
                        Você tem <strong>2 minutos</strong> para eu explicar como funciona? 
                        Prometo ser rápido e direto."
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      💡 Peça tempo específico (2 min). Se der ocupado, pergunte melhor horário para ligar.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Objection Handling */}
        <section id="objections" className="py-16 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">🛡️ Quebra de Objeções</Badge>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Argumentos de Venda
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Respostas prontas para as objeções mais comuns. Esteja preparado!
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {objections.map((item, i) => (
                <Card key={i} className="bg-white/80 dark:bg-card overflow-hidden">
                  <div className="grid md:grid-cols-2">
                    <div className="p-4 bg-red-50 dark:bg-red-950/30">
                      <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">OBJEÇÃO</p>
                      <p className="font-medium text-red-700 dark:text-red-300">"{item.objection}"</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950/30">
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold mb-1">RESPOSTA</p>
                      <p className="text-sm text-green-700 dark:text-green-300">{item.response}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Client Economy Calculator */}
        <section id="calculator" className="py-16 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                🧮 Ferramenta de Vendas
              </Badge>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Calculadora de Economia do Cliente
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Use essa calculadora para mostrar ao cliente quanto ele vai economizar.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Card className="bg-white/90 dark:bg-card">
                <CardContent className="pt-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-base font-semibold mb-3 block">
                        Pedidos por mês do cliente
                      </Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[clientOrders]}
                          onValueChange={(v) => setClientOrders(v[0])}
                          min={50}
                          max={1000}
                          step={10}
                          className="flex-1"
                        />
                        <span className="text-xl font-bold w-16 text-right">{clientOrders}</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-3 block">
                        Ticket médio (R$)
                      </Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[clientTicket]}
                          onValueChange={(v) => setClientTicket(v[0])}
                          min={20}
                          max={150}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-xl font-bold w-16 text-right">R$ {clientTicket}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="p-6 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
                    <h3 className="text-lg font-bold mb-4 text-center">📊 QUANTO SEU CLIENTE ECONOMIZA</h3>
                    
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-white/50 dark:bg-card/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Faturamento/mês</p>
                        <p className="text-xl font-bold">R$ {clientMonthlyRevenue.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <p className="text-xs text-red-600 dark:text-red-400">Taxa iFood (25%)</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">- R$ {ifoodTax.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <p className="text-xs text-green-600 dark:text-green-400">Mostralo (Profissional)</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">R$ {mostraloPrice.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-200 dark:bg-green-800/50 rounded-xl">
                        <p className="text-sm text-green-700 dark:text-green-300">🎉 ECONOMIA MENSAL</p>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                          R$ {clientSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-300 dark:bg-green-700/50 rounded-xl">
                        <p className="text-sm text-green-800 dark:text-green-200">🎉 ECONOMIA ANUAL</p>
                        <p className="text-3xl font-bold text-green-800 dark:text-green-200">
                          R$ {clientAnnualSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-sm text-muted-foreground">
                    💡 Mostre esses números ao cliente. Economia real convence!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Seller Features */}
        <section id="features" className="py-16 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">🛠️ Suas Ferramentas</Badge>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Funcionalidades para Vendedores
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Tudo que você precisa para vender mais e acompanhar seus resultados.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {sellerFeatures.map((feature, i) => (
                <Card key={i} className="bg-white/80 dark:bg-card text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-3">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Bonus System */}
        <section id="bonus" className="py-16 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                🏆 Sistema de Bônus
              </Badge>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Bônus Trimestrais (Parceiros PJ)
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Quanto mais você vende, mais você ganha. <strong>Bônus são cumulativos!</strong>
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                {bonusTiers.map((tier, i) => (
                  <Card key={i} className={`${tier.bgColor} border-2`}>
                    <CardContent className="pt-6 text-center">
                      <tier.icon className={`h-12 w-12 mx-auto mb-3 ${tier.color}`} />
                      <h3 className={`text-xl font-bold ${tier.color}`}>{tier.tier}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{tier.sales} vendas/trimestre</p>
                      <p className="text-2xl font-bold">R$ {tier.bonus.toLocaleString('pt-BR')}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30">
                <CardContent className="py-6">
                  <h3 className="font-bold text-lg mb-4 text-center">📊 Exemplo: 30 vendas no trimestre</h3>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-center">
                    <Badge className="bg-amber-600 text-white">Bronze R$ 500</Badge>
                    <span>+</span>
                    <Badge className="bg-slate-500 text-white">Prata R$ 1.000</Badge>
                    <span>+</span>
                    <Badge className="bg-yellow-500 text-white">Ouro R$ 2.000</Badge>
                    <span>=</span>
                    <Badge className="bg-green-600 text-white text-lg px-4 py-1">
                      R$ 3.500 de bônus!
                    </Badge>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    💡 Bônus pagos junto com a comissão mensal no mês que atingir a meta.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section id="comparison" className="py-16 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">👤 Tipos de Vendedor</Badge>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Afiliado vs Parceiro PJ
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Compare os dois modelos e escolha o melhor para você.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="overflow-hidden bg-white/90 dark:bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-4 text-left">Característica</th>
                        <th className="p-4 text-center bg-blue-50 dark:bg-blue-950/30">
                          <Badge variant="outline">Afiliado (CPF)</Badge>
                        </th>
                        <th className="p-4 text-center bg-green-50 dark:bg-green-950/30">
                          <Badge className="bg-green-600">Parceiro PJ</Badge>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Documentação", affiliate: "CPF", partner: "CNPJ + CNAE" },
                        { label: "Comissão", affiliate: "5-7%", partner: "10%", partnerHighlight: true },
                        { label: "Limite mensal", affiliate: "R$ 1.900", partner: "Ilimitado", partnerHighlight: true },
                        { label: "Bônus trimestral", affiliate: "❌", partner: "✅ Até R$ 8.500", partnerHighlight: true },
                        { label: "Nota Fiscal", affiliate: "Não precisa", partner: "Emite NF" },
                        { label: "Ideal para", affiliate: "Iniciantes, renda extra", partner: "Profissionais" },
                      ].map((row, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-4 font-medium">{row.label}</td>
                          <td className="p-4 text-center bg-blue-50/50 dark:bg-blue-950/20">{row.affiliate}</td>
                          <td className={`p-4 text-center bg-green-50/50 dark:bg-green-950/20 ${row.partnerHighlight ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                            {row.partner}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="mt-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200">
                <CardContent className="py-4 flex items-center gap-4">
                  <Lightbulb className="h-8 w-8 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Não tem CNPJ?</p>
                    <p className="text-sm text-muted-foreground">
                      Abra MEI gratuitamente em{" "}
                      <a href="https://gov.br/empreendedor" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        gov.br/empreendedor
                      </a>
                      . É rápido e gratuito!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="py-16 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">📅 Passo a Passo</Badge>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Fluxo de Trabalho do Vendedor
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Do cadastro ao recebimento: como funciona na prática.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { step: 1, title: "Cadastro", desc: "Preencha o formulário (5 min)", icon: UserPlus },
                  { step: 2, title: "Aprovação", desc: "Análise em até 48h", icon: Clock },
                  { step: 3, title: "Contrato", desc: "Aceite digital", icon: FileText },
                  { step: 4, title: "Dashboard", desc: "Acesse suas ferramentas", icon: BarChart3 },
                  { step: 5, title: "Link", desc: "Pegue seu link personalizado", icon: ExternalLink },
                  { step: 6, title: "Prospecção", desc: "Use scripts e materiais", icon: Target },
                  { step: 7, title: "Cadastro Cliente", desc: "Cliente usa seu link", icon: Users },
                  { step: 8, title: "Pagamento", desc: "Cliente paga o plano", icon: CreditCard },
                  { step: 9, title: "Comissão", desc: "Sua comissão é creditada", icon: DollarSign },
                  { step: 10, title: "Solicitação", desc: "Peça pagamento (dia 1)", icon: Calendar },
                  { step: 11, title: "NF (PJ)", desc: "Emita nota fiscal", icon: FileText },
                  { step: 12, title: "Recebimento", desc: "PIX em até 5 dias", icon: CheckCircle2 },
                ].map((item, i) => (
                  <Card key={i} className="bg-white/80 dark:bg-card relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-8 h-8 bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {item.step}
                    </div>
                    <CardContent className="pt-10 pb-4 text-center">
                      <item.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section id="tips" className="py-16 bg-gradient-to-br from-lime-50 to-green-50 dark:from-lime-950/20 dark:to-green-950/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400">
                💡 Dicas de Ouro
              </Badge>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Para Vender Mais
              </h2>
            </div>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-4">
              {[
                { tip: "Foque em restaurantes com delivery ativo", why: "Já têm demanda comprovada" },
                { tip: "Calcule a economia ANTES de abordar", why: "Números convencem mais que palavras" },
                { tip: "Mostre o WhatsApp Marketing", why: "É o diferencial único do Mostralo" },
                { tip: "Ofereça demonstração ao vivo", why: "Ver é acreditar - mostre o sistema" },
                { tip: "Acompanhe o cliente após cadastro", why: "Garanta ativação para não perder comissão" },
                { tip: "Peça indicações", why: "Cliente satisfeito indica 2-3 outros" },
                { tip: "Use material visual", why: "Flyers e apresentações aumentam credibilidade" },
                { tip: "Responda rápido", why: "Timing é tudo - interesse esfria rápido" },
              ].map((item, i) => (
                <Card key={i} className="bg-white/80 dark:bg-card">
                  <CardContent className="py-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">{item.tip}</p>
                      <p className="text-sm text-muted-foreground">{item.why}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        <section id="results" className="py-16 bg-gradient-to-br from-primary/5 to-orange-50/50 dark:from-primary/10 dark:to-orange-950/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">📊 Resultados Comprovados</Badge>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                O Mostralo Funciona
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Números reais para você usar como argumento de vendas.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { value: "23%", label: "Clientes inativos recuperados", sub: "via WhatsApp Marketing" },
                { value: "R$ 2.400", label: "Aumento médio em vendas", sub: "por mês" },
                { value: "8h", label: "Economizadas em trabalho", sub: "por mês" },
                { value: "98%", label: "Taxa de abertura", sub: "mensagens WhatsApp" },
              ].map((stat, i) => (
                <Card key={i} className="text-center bg-white/80 dark:bg-card">
                  <CardContent className="pt-6">
                    <p className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</p>
                    <p className="text-sm font-medium">{stat.label}</p>
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">❓ FAQ</Badge>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Perguntas Frequentes
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqItems.map((item, i) => (
                <Card key={i} className="bg-white/80 dark:bg-card">
                  <CardContent className="py-4">
                    <h3 className="font-semibold mb-2 flex items-start gap-2">
                      <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      {item.q}
                    </h3>
                    <p className="text-sm text-muted-foreground pl-7">{item.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="cta" className="py-16 md:py-24 bg-gradient-to-br from-primary to-orange-600 dark:from-primary dark:to-orange-700">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <Badge className="mb-6 bg-white/20 text-white border-white/30">
                <Rocket className="h-4 w-4 mr-1" />
                Comece Agora
              </Badge>

              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Pronto para Construir Sua Renda Recorrente?
              </h2>

              <p className="text-lg text-white/90 mb-8">
                O mercado está aquecido. Restaurantes precisam de ajuda. 
                <strong> Você pode ser o consultor deles.</strong>
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <Link to="/seja-vendedor?type=affiliate">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    <Users className="h-5 w-5 mr-2" />
                    Cadastrar como Afiliado (CPF)
                  </Button>
                </Link>
                <Link to="/seja-vendedor?type=partner">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Cadastrar como Parceiro (CNPJ)
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-white/70">
                ✓ Análise em até 48 horas &nbsp;•&nbsp; ✓ Suporte em português &nbsp;•&nbsp; ✓ Materiais inclusos
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <DashboardFooter />
      </main>
    </div>
  );
};

export default SalespersonGuidePage;
