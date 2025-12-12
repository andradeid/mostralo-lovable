import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { toast } from 'sonner';
import {
  Store,
  TrendingUp,
  ShoppingCart,
  MessageCircle,
  Search,
  Instagram,
  Users,
  Star,
  Check,
  X,
  ArrowRight,
  Phone,
  Copy,
  Beef,
  Flame,
  Calendar,
  Calculator,
  Trophy,
  Target,
  DollarSign,
  BarChart3,
  Building2,
  Percent,
  Clock,
  Heart,
  Award,
  Globe,
  ChefHat,
  Utensils,
  Menu
} from 'lucide-react';

const AcouguesPage = () => {
  const [monthlyRevenue, setMonthlyRevenue] = useState([150000]);
  const [deliveryPercent, setDeliveryPercent] = useState([25]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useScrollReveal();

  const deliveryRevenue = (monthlyRevenue[0] * deliveryPercent[0]) / 100;
  const marketplaceFee = deliveryRevenue * 0.27;
  const annualSavings = marketplaceFee * 12;
  const mostraloAnnualCost = 397.9 * 12;
  const netAnnualSavings = annualSavings - mostraloAnnualCost;
  const roi = ((netAnnualSavings / mostraloAnnualCost) * 100).toFixed(0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const copyAllText = () => {
    const textContent = `
# Mostralo para Açougues e Casas de Carnes

## O Mercado de Carnes no Brasil

### Dados do Setor
- Mercado global de carnes online: US$ 37,85 bilhões (2024)
- Produção brasileira 2024: 31,58 milhões de toneladas
- Exportação de carne bovina: US$ 12,8 bilhões (+22%)
- Consumo per capita bovino: 26 kg/ano
- Brasil: 4º maior consumidor mundial de carne
- Cadeia pecuária: R$ 1 trilhão (8,4% do PIB)

### Os Grandes Investem Pesado
- JBS: Receita de R$ 417 bilhões em 2024 (+14,6%)
- Marfrig: Faturamento de R$ 139 bilhões
- BRF: Receita de R$ 53 bilhões
- Swift, Friboi, Sadia: Milhões em marketing digital

### O Problema dos Açougues Locais
- iFood/Rappi cobram até 27% por pedido
- Margem da carne já é apertada (15-25%)
- Clientes são do marketplace, não seus
- Zero dados sobre preferências dos clientes
- Dependência de algoritmos para visibilidade

### A Solução Mostralo
- 0% de taxa por pedido
- 100% dos clientes são SEUS
- 100% dos dados são SEUS
- WhatsApp Marketing automático
- Google Shopping integrado
- Instagram Shopping integrado

## Funcionalidades Específicas para Açougues

### Catálogo Digital Especializado
- Cortes Bovinos (Picanha, Maminha, Fraldinha, Costela, etc.)
- Cortes Suínos (Pernil, Lombo, Costela, Bacon)
- Aves (Frango inteiro, Coxa, Peito, Asa)
- Pescados e Frutos do Mar
- Carnes Temperadas e Marinadas
- Kits Churrasco personalizados
- Espetinhos e Preparados

### WhatsApp Marketing para Açougues
- Recuperação automática de clientes inativos
- Mensagens pré-churrasco (quinta/sexta)
- Promoções de fim de semana
- Avisos de cortes especiais
- Lembrete de encomendas para eventos

### Google Shopping
- Apareça ao lado da Swift e Friboi no Google
- Zero custo por clique
- Feed XML automático atualizado
- Visibilidade para "picanha perto de mim"
- Competição com grandes sem pagar ads

### Instagram Shopping
- Catálogo integrado automaticamente
- Marque produtos nos posts
- Stories vendendo direto
- Conteúdo de carne tem 3x mais engajamento
- Showcase de cortes premium

### Churrasco & Eventos
- Calculadora de carne por pessoa
- Kits pré-montados por número de convidados
- Encomendas antecipadas
- Pacotes para eventos corporativos
- Combos família fim de semana

## Planos e Preços

### Essencial - R$ 397,90/mês
- Catálogo digital ilimitado
- Pedidos via WhatsApp
- 1 perfil de rede social
- Google Shopping integrado
- Suporte por email

### Profissional - R$ 597,90/mês
- Tudo do Essencial
- WhatsApp Marketing automático
- Instagram Shopping
- Programa de fidelidade
- Suporte prioritário

### Empresarial - R$ 997,90/mês
- Tudo do Profissional
- Multi-lojas
- Relatórios avançados
- API de integração
- Gerente de conta dedicado

## Comparativo: iFood vs Mostralo

| Aspecto | iFood | Mostralo |
|---------|-------|----------|
| Taxa por pedido | Até 27% | 0% |
| Dados dos clientes | Do iFood | 100% seus |
| WhatsApp Marketing | Não | Sim |
| Google Shopping | Não | Sim |
| Instagram Shopping | Não | Sim |
| Programa Fidelidade | Não | Sim |

## ROI Calculado

Para um açougue com faturamento de R$ 150.000/mês:
- Delivery representa 25%: R$ 37.500
- Taxa iFood (27%): R$ 10.125/mês
- Economia anual: R$ 121.500
- Custo Mostralo anual: R$ 4.774,80
- Economia líquida: R$ 116.725,20
- ROI: 2.444%

## Próximos Passos

1. Acesse mostralo.com.br
2. Escolha seu plano
3. Configure seu catálogo em 1 dia
4. Comece a vender sem taxas

## Contato

WhatsApp: Fale com um consultor
Site: mostralo.com.br
    `.trim();

    navigator.clipboard.writeText(textContent);
    toast.success('Texto copiado para a área de transferência!');
  };

  const sections = [
    { id: 'hero', label: 'Início', icon: Beef },
    { id: 'mercado', label: 'O Mercado', icon: Globe },
    { id: 'grandes', label: 'Os Grandes', icon: Building2 },
    { id: 'problema', label: 'O Problema', icon: X },
    { id: 'oportunidade', label: 'Oportunidade', icon: TrendingUp },
    { id: 'economia', label: 'Economia', icon: Calculator },
    { id: 'vantagem', label: 'Vantagem Local', icon: Heart },
    { id: 'catalogo', label: 'Catálogo', icon: ShoppingCart },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'google', label: 'Google Shopping', icon: Search },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'churrasco', label: 'Churrasco', icon: Flame },
    { id: 'fidelidade', label: 'Fidelidade', icon: Award },
    { id: 'casos', label: 'Casos', icon: Star },
    { id: 'planos', label: 'Planos', icon: DollarSign },
    { id: 'comparativo', label: 'Comparativo', icon: BarChart3 },
    { id: 'roi', label: 'ROI', icon: Trophy },
    { id: 'contato', label: 'Contato', icon: Phone }
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Mostralo</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Início
              </Link>
              <Link to="/funcionalidades" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Funcionalidades
              </Link>
              <Link to="/#plans" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Planos
              </Link>
              <span className="text-primary font-medium text-sm">
                Para Açougues
              </span>
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/auth" className="hidden md:block">
                <Button variant="outline" size="sm">Entrar</Button>
              </Link>
              <Link to="/signup" className="hidden md:block">
                <Button size="sm">Começar</Button>
              </Link>
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-border mt-3 space-y-3">
              <Link to="/" className="block text-muted-foreground hover:text-foreground">Início</Link>
              <Link to="/funcionalidades" className="block text-muted-foreground hover:text-foreground">Funcionalidades</Link>
              <Link to="/#plans" className="block text-muted-foreground hover:text-foreground">Planos</Link>
              <span className="block text-primary font-medium">Para Açougues</span>
              <div className="flex gap-2 pt-2">
                <Link to="/auth"><Button variant="outline" size="sm" className="flex-1">Entrar</Button></Link>
                <Link to="/signup"><Button size="sm" className="flex-1">Começar</Button></Link>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Sidebar Toggle (Mobile) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-4 right-4 z-50 lg:hidden bg-primary text-primary-foreground p-3 rounded-full shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar Navigation */}
      <aside className={`fixed top-20 left-0 h-[calc(100vh-5rem)] w-64 bg-background border-r border-border overflow-y-auto z-40 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Navegação</p>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors text-left"
            >
              <section.icon className="h-4 w-4" />
              {section.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Conteúdo Principal */}
      <main className="lg:ml-64 pt-20">
        {/* Seção 1: Hero */}
        <section
          id="hero"
          className="min-h-screen flex items-center py-20 px-4"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="scroll-reveal">
                <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Beef className="h-4 w-4" />
                  Para Açougues e Casas de Carnes
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Seu Açougue Online.{' '}
                  <span className="text-primary">Tecnologia de Frigorífico.</span>{' '}
                  Zero Taxas.
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Enquanto JBS fatura R$ 417 bilhões e investe milhões em marketing digital, 
                  seu açougue pode competir com a mesma tecnologia por R$ 397,90/mês.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild className="bg-red-600 hover:bg-red-700">
                    <Link to="/signup">
                      Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="https://wa.me/5561994009368" target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Falar com Consultor
                    </a>
                  </Button>
                </div>
              </div>
              <div className="scroll-reveal relative">
                <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-3xl p-8 border border-red-500/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card rounded-2xl p-6 text-center border border-border">
                      <Beef className="h-10 w-10 text-red-500 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-red-500">26kg</div>
                      <div className="text-sm text-muted-foreground">Consumo per capita/ano</div>
                    </div>
                    <div className="bg-card rounded-2xl p-6 text-center border border-border">
                      <Globe className="h-10 w-10 text-primary mx-auto mb-3" />
                      <div className="text-3xl font-bold text-primary">US$ 37,85 BI</div>
                      <div className="text-sm text-muted-foreground">Mercado online global</div>
                    </div>
                    <div className="bg-card rounded-2xl p-6 text-center border border-border">
                      <TrendingUp className="h-10 w-10 text-green-500 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-green-500">+22%</div>
                      <div className="text-sm text-muted-foreground">Crescimento exportações</div>
                    </div>
                    <div className="bg-card rounded-2xl p-6 text-center border border-border">
                      <Trophy className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-amber-500">4º</div>
                      <div className="text-sm text-muted-foreground">Maior consumidor mundial</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 2: O Mercado */}
        <section
          id="mercado"
          className="py-20 px-4 bg-muted/30"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 scroll-reveal">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                O Mercado de Carnes no Brasil
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Brasil é potência mundial em produção e consumo de carnes. O mercado online 
                de carnes cresce exponencialmente e seu açougue pode fazer parte dessa revolução.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { value: 'US$ 37,85 BI', label: 'Mercado global de carnes online', icon: Globe, color: 'text-blue-500', source: 'Get Commerce 2024' },
                { value: '31,58 M ton', label: 'Produção brasileira 2024', icon: Beef, color: 'text-red-500', source: 'Conab' },
                { value: 'US$ 12,8 BI', label: 'Exportação carne bovina', icon: TrendingUp, color: 'text-green-500', source: 'ABIEC' },
                { value: '26 kg/ano', label: 'Consumo per capita bovino', icon: Users, color: 'text-amber-500', source: 'Agrifatto' },
                { value: 'R$ 1 trilhão', label: 'Cadeia pecuária (8,4% PIB)', icon: DollarSign, color: 'text-primary', source: 'Giro do Boi' },
                { value: '+22%', label: 'Crescimento exportações', icon: BarChart3, color: 'text-emerald-500', source: 'ABIEC 2024' }
              ].map((stat, index) => (
                <Card key={index} className="scroll-reveal border-border">
                  <CardContent className="p-6">
                    <stat.icon className={`h-10 w-10 ${stat.color} mb-4`} />
                    <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                    <div className="text-foreground font-medium mb-1">{stat.label}</div>
                    <div className="text-xs text-muted-foreground">Fonte: {stat.source}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seção 3: Os Grandes Investem */}
        <section
          id="grandes"
          className="py-20 px-4"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 scroll-reveal">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Os Grandes Investem Bilhões em Digital
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Enquanto frigoríficos investem fortunas em marketing digital, 
                você pode ter a mesma visibilidade online por uma fração do custo.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { name: 'JBS', revenue: 'R$ 417 BI', growth: '+14,6%', brands: 'Friboi, Swift, Seara', marketingEstimate: 'R$ 500k+/mês em ads' },
                { name: 'Marfrig', revenue: 'R$ 139 BI', growth: '+8%', brands: 'National Beef, Bassi', marketingEstimate: 'R$ 300k+/mês em ads' },
                { name: 'BRF', revenue: 'R$ 53 BI', growth: '+12%', brands: 'Sadia, Perdigão, Qualy', marketingEstimate: 'R$ 400k+/mês em ads' }
              ].map((company, index) => (
                <Card key={index} className="scroll-reveal bg-gradient-to-br from-red-500/5 to-orange-500/5 border-red-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold">{company.name}</h3>
                      <span className="text-green-500 font-medium">{company.growth}</span>
                    </div>
                    <div className="text-3xl font-bold text-red-500 mb-2">{company.revenue}</div>
                    <div className="text-sm text-muted-foreground mb-3">Receita 2024</div>
                    <div className="text-sm mb-2">
                      <span className="text-muted-foreground">Marcas:</span>{' '}
                      <span className="text-foreground">{company.brands}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Marketing estimado:</span>{' '}
                      <span className="text-amber-500 font-medium">{company.marketingEstimate}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="scroll-reveal bg-gradient-to-r from-primary/10 to-red-500/10 border-primary/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">
                  Com Mostralo, seu açougue aparece AO LADO da Swift e Friboi no Google
                </h3>
                <p className="text-lg text-muted-foreground mb-4">
                  Investimento: <span className="text-primary font-bold">R$ 397,90/mês</span> vs{' '}
                  <span className="text-red-500">R$ 500.000+/mês</span> dos grandes
                </p>
                <div className="text-4xl font-bold text-green-500">
                  1.255x mais barato
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Seção 4: O Problema */}
        <section
          id="problema"
          className="py-20 px-4 bg-destructive/5"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 scroll-reveal">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                O Problema dos Açougues nos Marketplaces
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                A margem da carne já é apertada. Pagar 27% de taxa é insustentável.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Percent, title: 'Taxa de 27%', description: 'iFood/Rappi consomem sua margem já apertada de 15-25%' },
                { icon: Users, title: 'Cliente é Deles', description: 'Você não tem acesso aos dados nem contato direto' },
                { icon: Target, title: 'Algoritmo Decide', description: 'Sua visibilidade depende do humor da plataforma' },
                { icon: BarChart3, title: 'Zero Dados', description: 'Não sabe preferências, frequência nem histórico' }
              ].map((problem, index) => (
                <Card key={index} className="scroll-reveal bg-destructive/10 border-destructive/20">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                      <problem.icon className="h-8 w-8 text-destructive" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{problem.title}</h3>
                    <p className="text-muted-foreground text-sm">{problem.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12 scroll-reveal">
              <Card className="bg-card border-destructive/30">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-6 text-center">Exemplo Real: Açougue com R$ 150.000/mês</h3>
                  <div className="grid md:grid-cols-4 gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold text-foreground">R$ 37.500</div>
                      <div className="text-sm text-muted-foreground">Delivery (25%)</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-destructive">- R$ 10.125</div>
                      <div className="text-sm text-muted-foreground">Taxa iFood (27%)</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-destructive">- R$ 121.500</div>
                      <div className="text-sm text-muted-foreground">Perdido por ANO</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-amber-500">R$ 0</div>
                      <div className="text-sm text-muted-foreground">Dados do cliente</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Seção 5: Oportunidade Digital */}
        <section
          id="oportunidade"
          className="py-20 px-4"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 scroll-reveal">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                A Oportunidade Digital é Agora
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                O mercado de carnes online está explodindo. Quem não entrar agora, ficará para trás.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { value: 'US$ 37,85 BI', label: 'Mercado global carnes online', growth: 'Crescendo 15% ao ano', icon: Globe },
                { value: '79,2%', label: 'Empresas já vendem online', growth: 'IBGE 2024', icon: Store },
                { value: '+1.200%', label: 'Crescimento e-commerce MPEs', growth: '2019-2024', icon: TrendingUp },
                { value: '1,9 milhão', label: 'E-commerces ativos no Brasil', growth: 'ABComm', icon: ShoppingCart }
              ].map((stat, index) => (
                <Card key={index} className="scroll-reveal bg-gradient-to-br from-primary/5 to-green-500/5 border-primary/20">
                  <CardContent className="p-6 text-center">
                    <stat.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                    <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                    <div className="font-medium mb-1">{stat.label}</div>
                    <div className="text-sm text-green-500">{stat.growth}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seção 6: Calculadora de Economia */}
        <section
          id="economia"
          className="py-20 px-4 bg-muted/30"
        >
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16 scroll-reveal">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Calcule Sua Economia Real
              </h2>
              <p className="text-xl text-muted-foreground">
                Veja quanto você pode economizar saindo dos marketplaces
              </p>
            </div>

            <Card className="scroll-reveal">
              <CardContent className="p-8">
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between mb-4">
                      <label className="font-medium">Faturamento Mensal Total</label>
                      <span className="text-2xl font-bold text-primary">{formatCurrency(monthlyRevenue[0])}</span>
                    </div>
                    <Slider
                      value={monthlyRevenue}
                      onValueChange={setMonthlyRevenue}
                      max={500000}
                      min={30000}
                      step={5000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>R$ 30.000</span>
                      <span>R$ 500.000</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-4">
                      <label className="font-medium">% do Faturamento em Delivery</label>
                      <span className="text-2xl font-bold text-primary">{deliveryPercent[0]}%</span>
                    </div>
                    <Slider
                      value={deliveryPercent}
                      onValueChange={setDeliveryPercent}
                      max={50}
                      min={10}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>10%</span>
                      <span>50%</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-border">
                    <div className="bg-destructive/10 rounded-xl p-6">
                      <h4 className="font-medium text-destructive mb-4">Com Marketplaces</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delivery mensal:</span>
                          <span className="font-medium">{formatCurrency(deliveryRevenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taxa iFood (27%):</span>
                          <span className="font-medium text-destructive">-{formatCurrency(marketplaceFee)}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-destructive/20">
                          <span className="font-bold">Perdido por ano:</span>
                          <span className="font-bold text-destructive">-{formatCurrency(annualSavings)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-500/10 rounded-xl p-6">
                      <h4 className="font-medium text-green-600 dark:text-green-400 mb-4">Com Mostralo</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Economia anual:</span>
                          <span className="font-medium text-green-600 dark:text-green-400">+{formatCurrency(annualSavings)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Custo Mostralo/ano:</span>
                          <span className="font-medium">-{formatCurrency(mostraloAnnualCost)}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-green-500/20">
                          <span className="font-bold">Economia líquida:</span>
                          <span className="font-bold text-green-600 dark:text-green-400">+{formatCurrency(netAnnualSavings)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-6 border-t border-border">
                    <div className="text-sm text-muted-foreground mb-2">Retorno sobre Investimento</div>
                    <div className="text-5xl font-bold text-green-500">{roi}%</div>
                    <div className="text-muted-foreground mt-2">ROI anual garantido</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Seção 7: Vantagem Local */}
        <section
          id="vantagem"
          className="py-20 px-4"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 scroll-reveal">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                A Vantagem do Açougue de Bairro
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                O que os grandes frigoríficos não conseguem oferecer: atendimento personalizado,
                cortes sob medida e a confiança de quem conhece o cliente pelo nome.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: ChefHat, title: 'Cortes Personalizados', description: 'Prepara o corte exatamente como o cliente gosta, com espessura e tempero sob medida' },
                { icon: Heart, title: 'Confiança Local', description: 'Cliente conhece a procedência, confia na qualidade e sabe que pode reclamar se precisar' },
                { icon: Users, title: 'Atendimento pelo Nome', description: 'Sabe as preferências de cada cliente, o que a família gosta, como preparam' },
                { icon: Clock, title: 'Frescor Garantido', description: 'Carne do dia, cortada na hora, sem ficar dias em câmara fria de distribuidor' },
                { icon: Beef, title: 'Seleção de Qualidade', description: 'Açougueiro escolhe as melhores peças, não aceita qualquer fornecedor' },
                { icon: Calendar, title: 'Encomenda Especial', description: 'Prepara kit churrasco sob medida, reserva cortes nobres, entrega no horário combinado' }
              ].map((advantage, index) => (
                <Card key={index} className="scroll-reveal hover:border-red-500/50 transition-colors">
                  <CardContent className="p-6">
                    <advantage.icon className="h-10 w-10 text-red-500 mb-4" />
                    <h3 className="font-bold text-lg mb-2">{advantage.title}</h3>
                    <p className="text-muted-foreground text-sm">{advantage.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seção 8: Catálogo Digital */}
        <section
          id="catalogo"
          className="py-20 px-4 bg-muted/30"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 scroll-reveal">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Catálogo Digital Especializado para Açougues
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Categorias pré-configuradas para o setor de carnes. Configure em minutos.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { category: 'Cortes Bovinos', items: ['Picanha', 'Maminha', 'Fraldinha', 'Costela', 'Alcatra', 'Filé Mignon', 'Contrafilé', 'Patinho'], color: 'red' },
                { category: 'Cortes Suínos', items: ['Pernil', 'Lombo', 'Costela', 'Bacon', 'Panceta', 'Bisteca', 'Copa Lombo'], color: 'pink' },
                { category: 'Aves', items: ['Frango Inteiro', 'Coxa', 'Sobrecoxa', 'Peito', 'Asa', 'Coração', 'Moela'], color: 'amber' },
                { category: 'Pescados', items: ['Tilápia', 'Salmão', 'Camarão', 'Sardinha', 'Bacalhau', 'Merluza'], color: 'blue' },
                { category: 'Temperados', items: ['Carne de Sol', 'Linguiça Caseira', 'Espetinhos', 'Hambúrguer Artesanal', 'Kafta', 'Medalhão'], color: 'orange' },
                { category: 'Kits Churrasco', items: ['Kit Família (4p)', 'Kit Reunião (8p)', 'Kit Festa (15p)', 'Kit Corporativo (30p)'], color: 'green' }
              ].map((cat, index) => (
                <Card key={index} className="scroll-reveal">
                  <CardContent className="p-6">
                    <h3 className={`font-bold text-lg mb-4 text-${cat.color}-500`}>{cat.category}</h3>
                    <ul className="space-y-2">
                      {cat.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className={`h-4 w-4 text-${cat.color}-500`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seção 9: WhatsApp Marketing */}
        <section
          id="whatsapp"
          className="py-20 px-4"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="scroll-reveal">
                <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Marketing Automático
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Recupere Clientes Automaticamente Toda Semana
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  68% dos clientes que compram uma vez nunca mais voltam. 
                  Com WhatsApp automático, você recupera 23% deles - sem esforço.
                </p>

                <div className="space-y-4">
                  {[
                    'Mensagem automática pré-churrasco (quinta/sexta)',
                    'Recuperação de clientes inativos há 15+ dias',
                    'Aviso de promoções e ofertas especiais',
                    'Lembrete de cortes favoritos do cliente',
                    'Confirmação de encomendas automatizada'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-green-500/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-500">23%</div>
                    <div className="text-sm text-muted-foreground">Taxa de recuperação</div>
                  </div>
                  <div className="bg-green-500/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-500">98%</div>
                    <div className="text-sm text-muted-foreground">Taxa de abertura</div>
                  </div>
                </div>
              </div>

              <div className="scroll-reveal">
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl p-6 border border-green-500/20">
                  <div className="space-y-4">
                    {[
                      { time: 'Quinta 10h', message: '🔥 Opa João! Fim de semana chegando... que tal aquela picanha premium que você adora? Separei uma peça especial! 🥩' },
                      { time: 'Sexta 14h', message: '🍖 Família Silva! Kit churrasco pronto: 2kg picanha + 1kg maminha + linguiças = R$ 189,90. Entrega amanhã 10h?' },
                      { time: 'Sábado 9h', message: '✅ João, seu pedido está saindo! Entrega entre 10h-11h. Bom churrasco! 🔥' }
                    ].map((msg, index) => (
                      <div key={index} className="bg-card rounded-2xl p-4 border border-border">
                        <div className="text-xs text-muted-foreground mb-2">{msg.time}</div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 10: Google Shopping */}
        <section
          id="google"
          className="py-20 px-4 bg-muted/30"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="scroll-reveal order-2 lg:order-1">
                <div className="bg-card rounded-3xl p-6 border border-border shadow-lg">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-4 text-sm text-muted-foreground">google.com</span>
                  </div>
                  <div className="bg-muted rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-muted-foreground" />
                      <span className="text-foreground">"picanha perto de mim"</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">Shopping</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted rounded-lg p-3 text-center border-2 border-primary">
                      <div className="w-12 h-12 bg-red-500/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Beef className="h-6 w-6 text-red-500" />
                      </div>
                      <div className="text-xs font-medium">Seu Açougue</div>
                      <div className="text-xs text-primary font-bold">R$ 89,90/kg</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center opacity-60">
                      <div className="w-12 h-12 bg-gray-500/20 rounded-lg mx-auto mb-2"></div>
                      <div className="text-xs font-medium">Swift</div>
                      <div className="text-xs text-muted-foreground">R$ 109,90/kg</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center opacity-60">
                      <div className="w-12 h-12 bg-gray-500/20 rounded-lg mx-auto mb-2"></div>
                      <div className="text-xs font-medium">Friboi</div>
                      <div className="text-xs text-muted-foreground">R$ 99,90/kg</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="scroll-reveal order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-500 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Search className="h-4 w-4" />
                  Google Shopping Integrado
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Apareça ao Lado da Swift e Friboi no Google
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Quando alguém pesquisa "picanha perto de mim" ou "carne delivery", 
                  seu açougue aparece junto com os grandes - sem pagar por clique.
                </p>

                <div className="space-y-4">
                  {[
                    'Feed XML gerado automaticamente',
                    'Atualização em tempo real do catálogo',
                    'Zero custo por clique ou impressão',
                    'Competição direta com grandes frigoríficos',
                    'Visibilidade para buscas locais'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Card className="mt-8 bg-blue-500/10 border-blue-500/20">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-red-500">R$ 500k+/mês</div>
                        <div className="text-xs text-muted-foreground">JBS gasta em Google Ads</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-500">R$ 0</div>
                        <div className="text-xs text-muted-foreground">Seu custo com Mostralo</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 11: Instagram Shopping */}
        <section
          id="instagram"
          className="py-20 px-4"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="scroll-reveal">
                <div className="inline-flex items-center gap-2 bg-pink-500/10 text-pink-500 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Instagram className="h-4 w-4" />
                  Instagram Shopping Automático
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Venda Direto dos Seus Posts e Stories
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Conteúdo de carne gera 3x mais engajamento. Com catálogo integrado, 
                  cada post vira oportunidade de venda.
                </p>

                <div className="space-y-4">
                  {[
                    'Catálogo sincronizado automaticamente',
                    'Marque produtos em fotos e stories',
                    'Link direto para compra via WhatsApp',
                    'Showcase de cortes premium',
                    'Promoções com um clique'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-pink-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-pink-500/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-pink-500">3x</div>
                    <div className="text-sm text-muted-foreground">Mais engajamento</div>
                  </div>
                  <div className="bg-pink-500/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-pink-500">1,9 milhão</div>
                    <div className="text-sm text-muted-foreground">Concorrentes online</div>
                  </div>
                </div>
              </div>

              <div className="scroll-reveal">
                <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-3xl p-6 border border-pink-500/20">
                  <div className="bg-card rounded-2xl overflow-hidden border border-border">
                    <div className="p-4 border-b border-border flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Beef className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">seu_acougue</div>
                        <div className="text-xs text-muted-foreground">Patrocinado</div>
                      </div>
                    </div>
                    <div className="aspect-square bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                      <Beef className="h-24 w-24 text-red-500/50" />
                    </div>
                    <div className="p-4">
                      <div className="flex gap-4 mb-3">
                        <Heart className="h-6 w-6" />
                        <MessageCircle className="h-6 w-6" />
                      </div>
                      <p className="text-sm mb-2">
                        <span className="font-bold">seu_acougue</span> 🔥 Picanha Premium - A rainha do churrasco chegou! Peça agora pelo link na bio.
                      </p>
                      <div className="bg-muted rounded-lg p-3 mt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">Picanha Premium</div>
                            <div className="text-primary font-bold">R$ 89,90/kg</div>
                          </div>
                          <Button size="sm" variant="outline">Ver</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 12: Churrasco & Eventos */}
        <section
          id="churrasco"
          className="py-20 px-4 bg-gradient-to-br from-red-500/5 to-orange-500/5"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 scroll-reveal">
              <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-500 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Flame className="h-4 w-4" />
                Churrasco & Eventos
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Kits Churrasco e Encomendas para Eventos
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Facilite a vida do cliente com kits prontos calculados por número de pessoas.
                Aumente o ticket médio e fidelize com conveniência.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { name: 'Kit Família', pessoas: '4 pessoas', itens: '2kg picanha + 1kg linguiça + temperos', preco: 'R$ 189,90', icon: Users },
                { name: 'Kit Reunião', pessoas: '8 pessoas', itens: '4kg picanha + 2kg maminha + 2kg linguiça', preco: 'R$ 359,90', icon: Users },
                { name: 'Kit Festa', pessoas: '15 pessoas', itens: '6kg picanha + 3kg costela + 3kg linguiça + acompanhamentos', preco: 'R$ 599,90', icon: Star },
                { name: 'Kit Corporativo', pessoas: '30 pessoas', itens: 'Sob consulta - personalizado para sua empresa', preco: 'Sob consulta', icon: Building2 }
              ].map((kit, index) => (
                <Card key={index} className="scroll-reveal hover:border-orange-500/50 transition-colors">
                  <CardContent className="p-6">
                    <kit.icon className="h-10 w-10 text-orange-500 mb-4" />
                    <h3 className="font-bold text-lg mb-1">{kit.name}</h3>
                    <div className="text-sm text-orange-500 font-medium mb-3">{kit.pessoas}</div>
                    <p className="text-sm text-muted-foreground mb-4">{kit.itens}</p>
                    <div className="text-xl font-bold text-primary">{kit.preco}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="scroll-reveal">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-6 text-center">Calculadora de Carne por Pessoa</h3>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div className="bg-muted rounded-xl p-6">
                    <Utensils className="h-8 w-8 text-red-500 mx-auto mb-3" />
                    <div className="font-medium mb-2">Churrasco Leve</div>
                    <div className="text-2xl font-bold text-red-500">300g/pessoa</div>
                    <div className="text-sm text-muted-foreground">Com acompanhamentos</div>
                  </div>
                  <div className="bg-muted rounded-xl p-6">
                    <Flame className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                    <div className="font-medium mb-2">Churrasco Padrão</div>
                    <div className="text-2xl font-bold text-orange-500">400g/pessoa</div>
                    <div className="text-sm text-muted-foreground">Equilíbrio perfeito</div>
                  </div>
                  <div className="bg-muted rounded-xl p-6">
                    <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                    <div className="font-medium mb-2">Churrasco Premium</div>
                    <div className="text-2xl font-bold text-amber-500">500g/pessoa</div>
                    <div className="text-sm text-muted-foreground">Para carnívoros</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Seção 13: Programa de Fidelidade */}
        <section
          id="fidelidade"
          className="py-20 px-4"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="scroll-reveal">
                <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Award className="h-4 w-4" />
                  Programa de Fidelidade
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Seus Dados. Seus Clientes. Seu Programa.
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Diferente dos marketplaces, você tem 100% dos dados dos seus clientes 
                  e pode criar seu próprio programa de fidelidade.
                </p>

                <div className="space-y-4">
                  {[
                    'Histórico completo de compras por cliente',
                    'Preferências de cortes e preparos',
                    'Sistema de pontos personalizável',
                    'Descontos exclusivos para fiéis',
                    'Comunicação direta sem intermediários'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="scroll-reveal">
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                  <CardContent className="p-8 text-center">
                    <Award className="h-16 w-16 text-amber-500 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold mb-4">Cliente VIP</h3>
                    <div className="text-4xl font-bold text-amber-500 mb-2">1.250 pontos</div>
                    <p className="text-muted-foreground mb-6">A cada R$ 1 = 1 ponto</p>
                    <div className="space-y-3 text-left">
                      <div className="flex items-center gap-3 bg-card rounded-lg p-3">
                        <Star className="h-5 w-5 text-amber-500" />
                        <span className="text-sm">10% de desconto permanente</span>
                      </div>
                      <div className="flex items-center gap-3 bg-card rounded-lg p-3">
                        <Beef className="h-5 w-5 text-red-500" />
                        <span className="text-sm">Acesso antecipado a cortes especiais</span>
                      </div>
                      <div className="flex items-center gap-3 bg-card rounded-lg p-3">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <span className="text-sm">Kit churrasco grátis a cada 5.000 pontos</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 14: Casos de Sucesso */}
        <section
          id="casos"
          className="py-20 px-4 bg-muted/30"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 scroll-reveal">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Açougues que Já Transformaram Seus Negócios
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Histórias reais de açougueiros que saíram dos marketplaces e 
                multiplicaram seus resultados.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Carlos Alberto',
                  business: 'Açougue do Carlos - Goiânia',
                  quote: 'Saí do iFood e em 3 meses recuperei 80% dos clientes com WhatsApp. Hoje faturo mais pagando zero de taxa.',
                  result: '+45% faturamento',
                  avatar: 'CA'
                },
                {
                  name: 'Roberto Mendes',
                  business: 'Casa de Carnes Mendes - SP',
                  quote: 'Com Google Shopping aparecemos em buscas junto com Swift. Clientes novos toda semana sem pagar ads.',
                  result: '+60 clientes/mês',
                  avatar: 'RM'
                },
                {
                  name: 'Antônio Silva',
                  business: 'Açougue Sabor da Carne - BH',
                  quote: 'Os kits churrasco automatizados triplicaram meu ticket médio. Clientes adoram a praticidade.',
                  result: '3x ticket médio',
                  avatar: 'AS'
                }
              ].map((case_, index) => (
                <Card key={index} className="scroll-reveal">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
                        {case_.avatar}
                      </div>
                      <div>
                        <div className="font-bold">{case_.name}</div>
                        <div className="text-sm text-muted-foreground">{case_.business}</div>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4 italic">"{case_.quote}"</p>
                    <div className="bg-green-500/10 text-green-600 dark:text-green-400 font-bold text-center py-2 rounded-lg">
                      {case_.result}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seção 15: Planos */}
        <section
          id="planos"
          className="py-20 px-4"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 scroll-reveal">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Planos para Açougues de Todos os Tamanhos
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Escolha o plano ideal para seu negócio. Todos incluem 0% de taxa por pedido.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Essencial',
                  price: 'R$ 397,90',
                  description: 'Para açougues iniciando no digital',
                  features: ['Catálogo digital ilimitado', 'Pedidos via WhatsApp', '1 perfil de rede social', 'Google Shopping integrado', 'Suporte por email'],
                  popular: false
                },
                {
                  name: 'Profissional',
                  price: 'R$ 597,90',
                  description: 'Para açougues em crescimento',
                  features: ['Tudo do Essencial', 'WhatsApp Marketing automático', 'Instagram Shopping', 'Programa de fidelidade', 'Kits churrasco configuráveis', 'Suporte prioritário'],
                  popular: true
                },
                {
                  name: 'Empresarial',
                  price: 'R$ 997,90',
                  description: 'Para redes e grandes operações',
                  features: ['Tudo do Profissional', 'Multi-lojas', 'Relatórios avançados', 'API de integração', 'Gerente de conta dedicado', 'Treinamento presencial'],
                  popular: false
                }
              ].map((plan, index) => (
                <Card 
                  key={index} 
                  className={`scroll-reveal relative ${plan.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Mais Popular
                    </div>
                  )}
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="text-3xl font-bold text-primary mb-2">{plan.price}<span className="text-lg text-muted-foreground">/mês</span></div>
                    <p className="text-muted-foreground mb-6">{plan.description}</p>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-primary' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link to="/signup">Começar Agora</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seção 16: Comparativo */}
        <section
          id="comparativo"
          className="py-20 px-4 bg-muted/30"
        >
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16 scroll-reveal">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                iFood vs Mostralo: Comparativo Real
              </h2>
              <p className="text-xl text-muted-foreground">
                Veja a diferença clara entre pagar taxas e ter seu próprio sistema.
              </p>
            </div>

            <Card className="scroll-reveal overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium">Aspecto</th>
                      <th className="text-center p-4 font-medium text-destructive">iFood</th>
                      <th className="text-center p-4 font-medium text-primary">Mostralo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { aspect: 'Taxa por pedido', ifood: 'Até 27%', mostralo: '0%' },
                      { aspect: 'Dados dos clientes', ifood: 'Do iFood', mostralo: '100% seus' },
                      { aspect: 'WhatsApp Marketing', ifood: 'Não', mostralo: 'Automático' },
                      { aspect: 'Google Shopping', ifood: 'Não', mostralo: 'Integrado' },
                      { aspect: 'Instagram Shopping', ifood: 'Não', mostralo: 'Integrado' },
                      { aspect: 'Programa Fidelidade', ifood: 'Não', mostralo: 'Personalizado' },
                      { aspect: 'Kits Churrasco', ifood: 'Não', mostralo: 'Configurável' },
                      { aspect: 'Contato direto', ifood: 'Bloqueado', mostralo: 'Livre' }
                    ].map((row, index) => (
                      <tr key={index} className="border-b border-border">
                        <td className="p-4 font-medium">{row.aspect}</td>
                        <td className="p-4 text-center">
                          {row.ifood === 'Não' || row.ifood === 'Bloqueado' ? (
                            <X className="h-5 w-5 text-destructive mx-auto" />
                          ) : (
                            <span className="text-destructive">{row.ifood}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {row.mostralo === '0%' || row.mostralo === '100% seus' ? (
                            <span className="text-primary font-bold">{row.mostralo}</span>
                          ) : (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        {/* Seção 17: ROI */}
        <section
          id="roi"
          className="py-20 px-4"
        >
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16 scroll-reveal">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Retorno Sobre Investimento Calculado
              </h2>
              <p className="text-xl text-muted-foreground">
                Números reais para um açougue com faturamento de R$ 150.000/mês
              </p>
            </div>

            <Card className="scroll-reveal">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-destructive">Cenário Atual (iFood)</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Faturamento delivery (25%):</span>
                        <span className="font-medium">R$ 37.500</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxa iFood (27%):</span>
                        <span className="font-medium text-destructive">-R$ 10.125</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-border">
                        <span className="font-bold">Perdido por ano:</span>
                        <span className="font-bold text-destructive">-R$ 121.500</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-green-500">Com Mostralo</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Economia anual:</span>
                        <span className="font-medium text-green-500">+R$ 121.500</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Custo Mostralo/ano:</span>
                        <span className="font-medium">-R$ 4.774,80</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-border">
                        <span className="font-bold">Economia líquida:</span>
                        <span className="font-bold text-green-500">+R$ 116.725,20</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-8 border-t border-border">
                  <div className="text-sm text-muted-foreground mb-2">Retorno sobre Investimento</div>
                  <div className="text-6xl font-bold text-green-500 mb-4">2.444%</div>
                  <p className="text-muted-foreground">
                    Para cada R$ 1 investido, você economiza R$ 24,44
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Seção 18: Contato */}
        <section
          id="contato"
          className="py-20 px-4 bg-gradient-to-br from-red-500/10 to-orange-500/10"
        >
          <div className="container mx-auto max-w-4xl text-center">
            <div className="scroll-reveal">
              <Beef className="h-16 w-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pronto para Transformar Seu Açougue?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Junte-se aos açougueiros que já economizam milhares por mês 
                e têm 100% de controle sobre seus clientes e dados.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button size="lg" className="bg-red-600 hover:bg-red-700" asChild>
                  <Link to="/signup">
                    Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="https://wa.me/5561994009368" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Falar com Consultor
                  </a>
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500">0%</div>
                  <div className="text-sm text-muted-foreground">Taxa por pedido</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">100%</div>
                  <div className="text-sm text-muted-foreground">Seus clientes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">24h</div>
                  <div className="text-sm text-muted-foreground">Para começar</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Botão Copiar Texto */}
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={copyAllText}
            variant="outline"
            className="shadow-lg bg-card"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar Todo o Texto
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border bg-background lg:pl-20 xl:pl-48">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} Mostralo. Todos os direitos reservados.</p>
          <p className="text-sm mt-2">
            Delivery + Marketing Digital em uma só plataforma.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AcouguesPage;
