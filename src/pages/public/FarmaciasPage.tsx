import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, Menu, X, ChevronRight, Smartphone, Package, MessageCircle, 
  BarChart3, Tag, Clock, ShoppingCart, Palette, MapPin, Users, 
  Image, AlertTriangle, Check, ArrowRight, Star, Shield, Database,
  Heart, Target, Zap, TrendingUp, CreditCard, Copy, Search, Instagram,
  Globe, Percent, Calendar, Gift, Camera, Share2, Pill, Moon, FileText,
  Stethoscope, Truck, Baby, Dumbbell, Droplets, Phone, Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DashboardFooter } from '@/components/admin/DashboardFooter';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useMasterWhatsApp } from '@/hooks/useMasterWhatsApp';

const sections = [
  { id: 'dor-farmacia', title: 'A Dor da Farmácia', icon: AlertTriangle },
  { id: 'farmacia-online', title: 'Sua Farmácia Online', icon: Store },
  { id: 'catalogo', title: 'Catálogo Digital', icon: Pill },
  { id: 'whatsapp', title: 'Pedidos WhatsApp', icon: MessageCircle },
  { id: 'clientes', title: 'Base de Clientes', icon: Users },
  { id: 'divulgacao', title: 'Divulgação', icon: Share2 },
  { id: 'google-shopping', title: 'Google & Instagram', icon: Search },
  { id: 'delivery', title: 'Delivery', icon: Truck },
  { id: 'retire-loja', title: 'Retire na Loja', icon: Building2 },
  { id: 'fidelizacao', title: 'Fidelização', icon: Heart },
  { id: 'pagamentos', title: 'Pagamentos', icon: CreditCard },
  { id: 'fotos', title: 'Fotos que Vendem', icon: Camera },
  { id: 'localizacao', title: 'Localização', icon: MapPin },
  { id: 'plantao', title: 'Plantão 24h', icon: Moon },
  { id: 'comparativo', title: 'Comparativo', icon: Target },
  { id: 'depoimentos', title: 'Depoimentos', icon: Star },
  { id: 'calculadora', title: 'Economia', icon: Percent },
  { id: 'comecar', title: 'Começar', icon: Zap },
];

export default function FarmaciasPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Hook para buscar configurações de WhatsApp
  const { getWhatsAppLink } = useMasterWhatsApp();

  const heroRef = useScrollReveal();
  const dorRef = useScrollReveal();
  const solucaoRef = useScrollReveal();
  const catalogoRef = useScrollReveal();
  const whatsappRef = useScrollReveal();
  const clientesRef = useScrollReveal();
  const divulgacaoRef = useScrollReveal();
  const googleRef = useScrollReveal();
  const deliveryRef = useScrollReveal();
  const retireRef = useScrollReveal();
  const fidelizacaoRef = useScrollReveal();
  const pagamentosRef = useScrollReveal();
  const fotosRef = useScrollReveal();
  const localizacaoRef = useScrollReveal();
  const plantaoRef = useScrollReveal();
  const comparativoRef = useScrollReveal();
  const depoimentosRef = useScrollReveal();
  const calculadoraRef = useScrollReveal();
  const comecarRef = useScrollReveal();

  const copyPageText = async () => {
    const pageText = `# GUIA COMPLETO MOSTRALO PARA FARMÁCIAS E DROGARIAS

## A DOR DA FARMÁCIA DE BAIRRO

### O Problema:
- 🏪 Grandes redes dominam: Droga Raia, Pacheco, Drogasil têm apps e delivery
- 📱 Cliente pesquisa online: "Farmácia perto de mim" - se você não aparece, perdeu a venda
- 🚴 Delivery das redes: iFood e Rappi entregam das grandes em 30 minutos
- 💸 Margens apertadas: Medicamentos regulados, precisa vender mais perfumaria
- 🗒️ Clientes não voltam: Compram onde aparece primeiro
- ⏰ Plantão sem divulgação: Está de plantão mas ninguém sabe
- 👴 Clientes idosos fiéis: Mas filhos compram online pra eles

### Estatísticas:
- 82% dos consumidores pesquisam preço de medicamentos online
- 67% preferem farmácias que oferecem delivery
- Grandes redes cresceram 35% com apps próprios
- Farmácias independentes perderam 22% de mercado em 5 anos

## SUA FARMÁCIA ONLINE - A SOLUÇÃO

✅ Delivery próprio: Entregue na casa do cliente sem iFood
✅ Apareça nas buscas: "Farmácia [bairro]" → Sua farmácia aparece
✅ Catálogo completo: Medicamentos + Perfumaria + Higiene
✅ WhatsApp integrado: Cliente manda receita, você atende
✅ Base de clientes: Histórico de compras, avisar reposição
✅ Plantão divulgado: Cliente sabe que você está aberto
✅ Concorra com redes: Visual profissional como grandes farmácias

## CATÁLOGO DIGITAL POR CATEGORIA

💊 MEDICAMENTOS (Catálogo - não venda direta):
- Genéricos, referência, similares
- Princípio ativo destacado
- Badge: "Necessita receita" quando aplicável
- Preço informativo (cliente confirma na loja)

🧴 PERFUMARIA E COSMÉTICOS:
- Shampoos, condicionadores, cremes
- Maquiagem e skincare
- Protetor solar (alto giro no verão)
- Dermocosméticos

🧼 HIGIENE PESSOAL:
- Sabonetes, desodorantes
- Absorventes, fraldas
- Papel higiênico, lenços

👶 LINHA INFANTIL:
- Fraldas (P, M, G, XG, XXG)
- Pomadas, shampoos baby
- Mamadeiras, chupetas
- Suplementos infantis

🏃 SUPLEMENTOS E VITAMINAS:
- Vitaminas A a Z
- Whey, creatina, BCAA
- Colágeno, ômega 3
- Polivitamínicos

🩺 EQUIPAMENTOS:
- Medidores de pressão
- Glicosímetros
- Termômetros
- Nebulizadores

## GOOGLE SHOPPING + INSTAGRAM SHOPPING

🔍 GOOGLE SHOPPING:
- Seus produtos aparecem quando cliente pesquisa "farmácia [bairro]"
- Perfumaria com foto, preço e link direto
- Feed XML automático gerado pelo sistema
- R$ 0 de taxa por clique

📸 INSTAGRAM SHOPPING:
- Poste promoções de perfumaria com preço
- Stories de "Chegou!" novos produtos
- Marque produtos nas fotos
- Feed CSV automático

📊 ESTATÍSTICAS:
- "Farmácia perto de mim" cresce 150% ao ano
- 76% buscam farmácia no Google antes de ir
- 58% compram perfumaria por impulso no Instagram

## PLANTÃO 24H DIVULGADO

🌙 DIFERENCIAL ÚNICO:
- Calendário de plantão no site
- Notificação: "Hoje estamos de plantão!"
- Cliente encontra você às 3h da manhã
- Emergência? Sua farmácia aparece!
- Grandes redes fecham às 22h. Você não.

## COMPARATIVO: SEM MOSTRALO vs COM MOSTRALO

| Situação | Sem Mostralo | Com Mostralo |
|----------|--------------|--------------|
| Cliente pesquisa | Vai pra Droga Raia | Encontra SUA farmácia |
| Delivery | Só presencial | Entrega no bairro todo |
| Base de clientes | Depende da memória | Sistema completo |
| Plantão | Ninguém sabe | Divulgado online |
| Perfumaria | Só quem entra vê | Instagram + Google Shopping |
| Lembretes | Não existe | "Hora de repor remédio" |

## CALCULADORA DE ECONOMIA

Se você usa iFood/Rappi para delivery:
- Faturamento delivery: R$ 8.000/mês

COM IFOOD/RAPPI:
- Taxa média (27%): R$ 2.160
- Taxa de entrega: R$ 400
- Total de taxas: R$ 2.560/mês

COM MOSTRALO + ENTREGADOR PRÓPRIO:
- Mensalidade: R$ 397,90/mês
- Taxas: R$ 0

💰 ECONOMIA: R$ 2.162/mês = R$ 25.944/ano

Com apenas 3 entregas a mais por dia, você já paga o investimento!

## PLANOS

### Essencial: R$ 397,90/mês
- Catálogo digital completo
- Pedidos por WhatsApp
- Google Shopping integrado
- Instagram Shopping integrado

### Profissional: R$ 597,90/mês (Mais Popular)
- Tudo do Essencial +
- WhatsApp Marketing
- Lembretes de reposição
- Marketing digital integrado

### Empresarial: R$ 997,90/mês
- Tudo do Profissional +
- Multi-lojas
- API completa
- Suporte prioritário

---
Conteúdo do Mostralo - Plataforma para Farmácias e Drogarias
Site: mostralo.com.br`;

    try {
      await navigator.clipboard.writeText(pageText);
      setCopied(true);
      toast.success("Texto copiado para área de transferência!");
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error("Erro ao copiar texto");
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                Para Farmácias
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
              <span className="block text-green-600 dark:text-green-400 font-medium">Para Farmácias</span>
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
              {section.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-20">
        {/* Hero Section */}
        <section ref={heroRef.ref} className="bg-gradient-to-br from-green-500/10 via-background to-primary/10 dark:from-green-500/5 dark:to-primary/5 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
              <Pill className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Para Farmácias e Drogarias</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Sua Farmácia de Bairro Competindo com Grandes Redes
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              <span className="text-red-500 font-semibold">Droga Raia, Pacheco e Drogasil</span> dominam o online. 
              Seus clientes precisam de você, mas não te encontram na internet.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Delivery próprio • Plantão 24h divulgado • Google Shopping • WhatsApp
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
                  Criar Minha Farmácia Online <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" onClick={() => scrollToSection('plantao')}>
                Ver Plantão 24h
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
              <Card className="bg-background/50 border-green-500/20">
                <CardContent className="p-4 text-center">
                  <Search className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">82%</p>
                  <p className="text-xs text-muted-foreground">pesquisam medicamentos online</p>
                </CardContent>
              </Card>
              <Card className="bg-background/50 border-blue-500/20">
                <CardContent className="p-4 text-center">
                  <Truck className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">67%</p>
                  <p className="text-xs text-muted-foreground">preferem delivery</p>
                </CardContent>
              </Card>
              <Card className="bg-background/50 border-purple-500/20">
                <CardContent className="p-4 text-center">
                  <Moon className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">24h</p>
                  <p className="text-xs text-muted-foreground">plantão divulgado</p>
                </CardContent>
              </Card>
              <Card className="bg-background/50 border-primary/20">
                <CardContent className="p-4 text-center">
                  <Percent className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">0%</p>
                  <p className="text-xs text-muted-foreground">de taxa por venda</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 1: A Dor da Farmácia */}
        <section id="dor-farmacia" ref={dorRef.ref} className="py-16 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">A Dor da Farmácia de Bairro</h2>
                <p className="text-muted-foreground">Por que você está perdendo clientes para as grandes redes?</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="bg-destructive/5 border-destructive/20 dark:bg-destructive/10">
                <CardContent className="p-6">
                  <Building2 className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Grandes Redes Dominam</h3>
                  <p className="text-sm text-muted-foreground">
                    Droga Raia, Pacheco e Drogasil têm <span className="font-semibold">apps próprios e delivery</span>. 
                    Você não compete mais só com a farmácia do lado.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20 dark:bg-destructive/10">
                <CardContent className="p-6">
                  <Search className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Cliente Pesquisa Online</h3>
                  <p className="text-sm text-muted-foreground">
                    "Farmácia perto de mim" - se você não aparece no Google, 
                    <span className="font-semibold"> perdeu a venda pro concorrente.</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20 dark:bg-destructive/10">
                <CardContent className="p-6">
                  <Truck className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Delivery das Redes</h3>
                  <p className="text-sm text-muted-foreground">
                    iFood e Rappi entregam das grandes redes em <span className="font-semibold">30 minutos</span>. 
                    O cliente nem precisa mais ir até você.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20 dark:bg-destructive/10">
                <CardContent className="p-6">
                  <CreditCard className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Margens Apertadas</h3>
                  <p className="text-sm text-muted-foreground">
                    Medicamentos são regulados. Precisa vender mais <span className="font-semibold">perfumaria e higiene</span> 
                    para ter margem, mas ninguém sabe que você vende.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20 dark:bg-destructive/10">
                <CardContent className="p-6">
                  <Moon className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Plantão Sem Divulgação</h3>
                  <p className="text-sm text-muted-foreground">
                    Está de <span className="font-semibold">plantão às 3h da manhã</span> mas ninguém sabe. 
                    Cliente vai na emergência ou espera até amanhecer.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20 dark:bg-destructive/10">
                <CardContent className="p-6">
                  <Users className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Clientes Idosos Fiéis</h3>
                  <p className="text-sm text-muted-foreground">
                    Seus clientes mais fiéis são idosos, mas os <span className="font-semibold">filhos compram online pra eles</span> 
                    - e escolhem a primeira farmácia que aparece.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-destructive">82%</p>
                  <p className="text-xs text-muted-foreground">pesquisam medicamentos online</p>
                </CardContent>
              </Card>
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-destructive">67%</p>
                  <p className="text-xs text-muted-foreground">preferem farmácias com delivery</p>
                </CardContent>
              </Card>
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-destructive">+35%</p>
                  <p className="text-xs text-muted-foreground">crescimento das redes com apps</p>
                </CardContent>
              </Card>
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-destructive">-22%</p>
                  <p className="text-xs text-muted-foreground">mercado das farmácias independentes</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 2: Sua Farmácia Online */}
        <section id="farmacia-online" ref={solucaoRef.ref} className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Store className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Sua Farmácia Online - A Solução</h2>
                <p className="text-muted-foreground">Tudo que você precisa para competir com as grandes redes</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-green-500/5 border-green-500/20 dark:bg-green-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="h-6 w-6 text-green-600" />
                    <h3 className="font-bold text-foreground">Delivery Próprio</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Entregue na casa do cliente <span className="font-semibold text-green-600">sem iFood, sem taxas</span>. 
                    Você controla a entrega e o relacionamento.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20 dark:bg-green-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="h-6 w-6 text-green-600" />
                    <h3 className="font-bold text-foreground">Apareça nas Buscas</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    "Farmácia [seu bairro]" → <span className="font-semibold text-green-600">Sua farmácia aparece no Google</span>. 
                    Pare de perder clientes para as redes.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20 dark:bg-green-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="h-6 w-6 text-green-600" />
                    <h3 className="font-bold text-foreground">Catálogo Completo</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Medicamentos + Perfumaria + Higiene + Suplementos. 
                    <span className="font-semibold text-green-600"> Cliente vê tudo que você vende.</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20 dark:bg-green-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="h-6 w-6 text-green-600" />
                    <h3 className="font-bold text-foreground">WhatsApp Integrado</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cliente manda <span className="font-semibold text-green-600">foto da receita pelo WhatsApp</span>, 
                    você verifica e confirma disponibilidade.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20 dark:bg-green-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="h-6 w-6 text-green-600" />
                    <h3 className="font-bold text-foreground">Base de Clientes</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Histórico de compras completo. <span className="font-semibold text-green-600">"Hora de repor seu medicamento!"</span> - 
                    avise clientes de uso contínuo.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20 dark:bg-green-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="h-6 w-6 text-green-600" />
                    <h3 className="font-bold text-foreground">Plantão Divulgado</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-green-600">Cliente sabe que você está aberto às 3h</span>. 
                    Grandes redes fecham às 22h - você não.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 3: Catálogo Digital */}
        <section id="catalogo" ref={catalogoRef.ref} className="py-16 bg-muted/30 dark:bg-muted/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Pill className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Catálogo Digital por Categoria</h2>
                <p className="text-muted-foreground">Organize todos os seus produtos por tipo</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <Pill className="h-5 w-5 text-red-500" />
                    </div>
                    <h3 className="font-bold text-foreground">💊 Medicamentos</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Genéricos, referência, similares</li>
                    <li>• Princípio ativo destacado</li>
                    <li>• Badge: "Necessita receita"</li>
                    <li>• Indicação: "Consulte farmacêutico"</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center">
                      <Droplets className="h-5 w-5 text-pink-500" />
                    </div>
                    <h3 className="font-bold text-foreground">🧴 Perfumaria</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Shampoos, condicionadores, cremes</li>
                    <li>• Maquiagem e skincare</li>
                    <li>• Protetor solar (alto giro)</li>
                    <li>• Dermocosméticos</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                      <Droplets className="h-5 w-5 text-cyan-500" />
                    </div>
                    <h3 className="font-bold text-foreground">🧼 Higiene Pessoal</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Sabonetes, desodorantes</li>
                    <li>• Absorventes, fraldas adulto</li>
                    <li>• Papel higiênico, lenços</li>
                    <li>• Escova, pasta, fio dental</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                      <Baby className="h-5 w-5 text-yellow-500" />
                    </div>
                    <h3 className="font-bold text-foreground">👶 Linha Infantil</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Fraldas (P, M, G, XG, XXG)</li>
                    <li>• Pomadas, shampoos baby</li>
                    <li>• Mamadeiras, chupetas</li>
                    <li>• Suplementos infantis</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-orange-500" />
                    </div>
                    <h3 className="font-bold text-foreground">🏃 Suplementos</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Vitaminas A a Z</li>
                    <li>• Whey, creatina, BCAA</li>
                    <li>• Colágeno, ômega 3</li>
                    <li>• Polivitamínicos</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="font-bold text-foreground">🩺 Equipamentos</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Medidores de pressão</li>
                    <li>• Glicosímetros</li>
                    <li>• Termômetros</li>
                    <li>• Nebulizadores</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 4: WhatsApp */}
        <section id="whatsapp" ref={whatsappRef.ref} className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Pedidos pelo WhatsApp</h2>
                <p className="text-muted-foreground">Atendimento humanizado que grandes redes não oferecem</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Card className="bg-background dark:bg-background/50">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-foreground mb-4">Fluxo de Atendimento</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-green-600">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Cliente envia foto da receita</p>
                          <p className="text-sm text-muted-foreground">Pelo WhatsApp, direto pra você</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-green-600">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Você verifica estoque</p>
                          <p className="text-sm text-muted-foreground">Validade, disponibilidade, alternativas</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-green-600">3</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Confirma preço e entrega</p>
                          <p className="text-sm text-muted-foreground">Delivery ou retirada na loja</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-green-600">4</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Orientação farmacêutica</p>
                          <p className="text-sm text-muted-foreground">Seu diferencial: atendimento personalizado</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-green-500/5 border-green-500/20 dark:bg-green-500/10">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">💬 Seu Diferencial</h3>
                  <p className="text-muted-foreground mb-4">
                    Grandes redes têm atendimento automatizado. <span className="font-semibold text-green-600">Você tem farmacêutico de verdade</span> 
                    respondendo, orientando, cuidando do cliente.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-foreground">Tira dúvidas sobre medicamentos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-foreground">Sugere genéricos mais baratos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-foreground">Verifica interações medicamentosas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-foreground">Relacionamento de confiança</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 5: Base de Clientes */}
        <section id="clientes" ref={clientesRef.ref} className="py-16 bg-muted/30 dark:bg-muted/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Base de Clientes + Lembretes</h2>
                <p className="text-muted-foreground">Nunca mais perca clientes de uso contínuo</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Card className="bg-background dark:bg-background/50">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-foreground mb-4">Histórico Completo</h3>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>Nome, WhatsApp e endereço de cada cliente</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>Histórico de todas as compras anteriores</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>Segmentação: diabéticos, hipertensos, idosos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>Data da última compra de cada medicamento</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-blue-500/5 border-blue-500/20 dark:bg-blue-500/10">
                  <CardContent className="p-6">
                    <p className="text-2xl font-bold text-blue-600 mb-2">+45%</p>
                    <p className="text-sm text-muted-foreground">
                      Farmácias com lembretes vendem <span className="font-semibold">45% mais</span> em medicamentos de uso contínuo
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-green-500/5 border-green-500/20 dark:bg-green-500/10">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">🔔 Lembretes Automáticos</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-background rounded-lg dark:bg-background/50">
                      <p className="text-sm font-medium text-foreground mb-1">Exemplo de lembrete:</p>
                      <p className="text-sm text-green-600 italic">
                        "Olá Dona Maria! Faz 28 dias que você comprou Losartana. 
                        Hora de repor? Posso separar pra você retirar ou entregar em casa!"
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Seu cliente nunca mais fica sem medicamento. E você nunca mais perde a venda pro concorrente.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 6: Divulgação */}
        <section id="divulgacao" ref={divulgacaoRef.ref} className="py-16 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Share2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Divulgação Local</h2>
                <p className="text-muted-foreground">Seu link em todos os lugares</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <Globe className="h-8 w-8 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Link Único</h3>
                  <p className="text-sm text-muted-foreground">suafarmacia.mostralo.com.br</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <Tag className="h-8 w-8 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">QR Code</h3>
                  <p className="text-sm text-muted-foreground">No balcão, sacolas e receituários</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-8 w-8 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">WhatsApp Status</h3>
                  <p className="text-sm text-muted-foreground">"Promoção de fraldas!"</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Parcerias</h3>
                  <p className="text-sm text-muted-foreground">Médicos e clínicas locais</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 7: Google Shopping + Instagram */}
        <section id="google-shopping" ref={googleRef.ref} className="py-16 bg-gradient-to-br from-blue-50 to-pink-50 dark:from-blue-950/20 dark:to-pink-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Google & Instagram Shopping</h2>
                <p className="text-muted-foreground">Apareça onde seu cliente pesquisa</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              <Card className="bg-blue-500/5 border-blue-500/20 dark:bg-blue-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Search className="h-8 w-8 text-blue-600" />
                    <h3 className="text-xl font-bold text-foreground">Google Shopping</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>Cliente pesquisa "farmácia [seu bairro]" → você aparece</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>Perfumaria com foto, preço e link direto</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>Feed XML automático gerado pelo sistema</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="font-semibold text-green-600">R$ 0 de taxa por clique</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-pink-500/5 border-pink-500/20 dark:bg-pink-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Instagram className="h-8 w-8 text-pink-600" />
                    <h3 className="text-xl font-bold text-foreground">Instagram Shopping</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-pink-600 mt-0.5" />
                      <span>Poste promoções de perfumaria com preço</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-pink-600 mt-0.5" />
                      <span>Stories de "Chegou!" novos produtos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-pink-600 mt-0.5" />
                      <span>Marque produtos nas suas fotos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-pink-600 mt-0.5" />
                      <span>Feed CSV automático pra Meta Commerce</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">+150%</p>
                  <p className="text-xs text-muted-foreground">"Farmácia perto" cresce/ano</p>
                </CardContent>
              </Card>
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">76%</p>
                  <p className="text-xs text-muted-foreground">buscam no Google antes</p>
                </CardContent>
              </Card>
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-pink-600">58%</p>
                  <p className="text-xs text-muted-foreground">compram por impulso no IG</p>
                </CardContent>
              </Card>
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">R$ 0</p>
                  <p className="text-xs text-muted-foreground">de taxa por venda</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 8: Delivery */}
        <section id="delivery" ref={deliveryRef.ref} className="py-16 bg-muted/30 dark:bg-muted/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Delivery de Medicamentos</h2>
                <p className="text-muted-foreground">Entregue sem depender de iFood ou Rappi</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">Seu Delivery, Suas Regras</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Entrega própria no bairro</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Motoboy parceiro ou funcionário</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Cliente rastreia pelo WhatsApp</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Entrega em 30-60 minutos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Taxa de entrega: você define</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20 dark:bg-green-500/10">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">vs iFood/Rappi</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Taxa por pedido</span>
                      <div className="flex gap-4">
                        <span className="text-sm text-destructive font-medium">iFood: 27%</span>
                        <span className="text-sm text-green-600 font-medium">Você: 0%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Dados do cliente</span>
                      <div className="flex gap-4">
                        <span className="text-sm text-destructive font-medium">iFood: deles</span>
                        <span className="text-sm text-green-600 font-medium">Você: seus</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Relacionamento</span>
                      <div className="flex gap-4">
                        <span className="text-sm text-destructive font-medium">iFood: zero</span>
                        <span className="text-sm text-green-600 font-medium">Você: direto</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 9: Retire na Loja */}
        <section id="retire-loja" ref={retireRef.ref} className="py-16 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Retire na Loja</h2>
                <p className="text-muted-foreground">Cliente pede online, você separa, ele retira sem fila</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">Como Funciona</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-amber-600">1</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Cliente faz pedido online</p>
                        <p className="text-sm text-muted-foreground">Seleciona "Retirar na Loja"</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-amber-600">2</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Você separa o pedido</p>
                        <p className="text-sm text-muted-foreground">Verifica estoque e prepara</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-amber-600">3</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Avisa que está pronto</p>
                        <p className="text-sm text-muted-foreground">WhatsApp automático pro cliente</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-amber-600">4</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Cliente retira sem fila</p>
                        <p className="text-sm text-muted-foreground">Rápido e prático</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-500/5 border-amber-500/20 dark:bg-amber-500/10">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">💡 Oportunidade de Venda</h3>
                  <p className="text-muted-foreground mb-4">
                    Cliente pede 5 itens online. Retira na loja e <span className="font-semibold text-amber-600">leva mais 3 por impulso</span>.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-amber-600" />
                      <span>Ideal para receitas complexas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-amber-600" />
                      <span>Orientação farmacêutica presencial</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-amber-600" />
                      <span>Economia na taxa de entrega</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-amber-600" />
                      <span>Venda adicional no balcão</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 10: Fidelização */}
        <section id="fidelizacao" ref={fidelizacaoRef.ref} className="py-16 bg-muted/30 dark:bg-muted/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center">
                <Heart className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Fidelização de Clientes</h2>
                <p className="text-muted-foreground">Faça seus clientes voltarem sempre</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Programa de Pontos</h3>
                  <p className="text-sm text-muted-foreground">Pontos em perfumaria e higiene</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <Percent className="h-8 w-8 text-green-500 mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Desconto Progressivo</h3>
                  <p className="text-sm text-muted-foreground">"6 meses? 10% off no 7º"</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <Gift className="h-8 w-8 text-pink-500 mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Aniversariantes</h3>
                  <p className="text-sm text-muted-foreground">Mimo especial no aniversário</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <Tag className="h-8 w-8 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Cupons Exclusivos</h3>
                  <p className="text-sm text-muted-foreground">Via WhatsApp direto</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 11: Pagamentos */}
        <section id="pagamentos" ref={pagamentosRef.ref} className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Pagamentos Flexíveis</h2>
                <p className="text-muted-foreground">Aceite como seu cliente preferir pagar</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-bold text-foreground">PIX</h3>
                  <p className="text-xs text-muted-foreground">Instantâneo</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-foreground">Cartão</h3>
                  <p className="text-xs text-muted-foreground">Na entrega</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-foreground">Convênios</h3>
                  <p className="text-xs text-muted-foreground">PBM, descontos</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="font-bold text-foreground">Dinheiro</h3>
                  <p className="text-xs text-muted-foreground">Na retirada</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-6 w-6 text-pink-600" />
                  </div>
                  <h3 className="font-bold text-foreground">Parcelamento</h3>
                  <p className="text-xs text-muted-foreground">Em perfumaria</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 12: Fotos */}
        <section id="fotos" ref={fotosRef.ref} className="py-16 bg-muted/30 dark:bg-muted/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Camera className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Fotos Profissionais</h2>
                <p className="text-muted-foreground">Foto real do seu produto vende mais</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">O Que Fotografar</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-orange-600 mt-0.5" />
                      <span>Embalagem original dos produtos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-orange-600 mt-0.5" />
                      <span>Ambiente limpo e organizado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-orange-600 mt-0.5" />
                      <span>Variedade do seu estoque</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-orange-600 mt-0.5" />
                      <span>Prateleiras de perfumaria</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-orange-500/5 border-orange-500/20 dark:bg-orange-500/10">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">💡 Dica de Ouro</h3>
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-orange-600">"Foto real do SEU produto"</span> passa mais confiança 
                    do que imagem genérica de catálogo. Cliente quer ver exatamente o que vai receber.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 13: Localização */}
        <section id="localizacao" ref={localizacaoRef.ref} className="py-16 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Sua Localização</h2>
                <p className="text-muted-foreground">Fácil de encontrar</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Endereço</h3>
                  <p className="text-sm text-muted-foreground">Completo com mapa</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Horário</h3>
                  <p className="text-sm text-muted-foreground">Funcionamento</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <Moon className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Plantão</h3>
                  <p className="text-sm text-muted-foreground">Destacado</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Referências</h3>
                  <p className="text-sm text-muted-foreground">Como chegar</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6 text-center">
                  <Globe className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Link</h3>
                  <p className="text-sm text-muted-foreground">Waze/Maps</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 14: Plantão 24h */}
        <section id="plantao" ref={plantaoRef.ref} className="py-16 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Moon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Plantão 24h Divulgado</h2>
                <p className="text-muted-foreground">Seu diferencial único contra as grandes redes</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="bg-purple-500/5 border-purple-500/20 dark:bg-purple-500/10">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">🌙 O Problema</h3>
                  <p className="text-muted-foreground mb-4">
                    Você está de plantão às 3h da manhã, mas <span className="font-semibold text-purple-600">ninguém sabe</span>. 
                    O cliente vai na emergência ou espera até amanhecer. Enquanto isso, grandes redes fecham às 22h.
                  </p>
                  <div className="p-4 bg-background rounded-lg dark:bg-background/50">
                    <p className="text-sm font-medium text-purple-600">
                      "Droga Raia fecha às 22h. Você está aberto. Mas ninguém sabe."
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20 dark:bg-green-500/10">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">✅ A Solução</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Calendário de plantão no seu site</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Notificação: "Hoje estamos de plantão!"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Cliente encontra você às 3h da manhã</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Emergência? Sua farmácia aparece!</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="font-semibold text-green-600">Seu diferencial único vs grandes redes</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 15: Comparativo */}
        <section id="comparativo" ref={comparativoRef.ref} className="py-16 bg-muted/30 dark:bg-muted/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Comparativo</h2>
                <p className="text-muted-foreground">Sem Mostralo vs Com Mostralo</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50 dark:bg-muted/20">
                    <th className="text-left p-4 font-bold text-foreground">Situação</th>
                    <th className="text-center p-4 font-bold text-destructive">❌ Sem Mostralo</th>
                    <th className="text-center p-4 font-bold text-green-600">✅ Com Mostralo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="bg-background dark:bg-background/50">
                    <td className="p-4 text-foreground">Cliente pesquisa</td>
                    <td className="p-4 text-center text-muted-foreground">Vai pra Droga Raia</td>
                    <td className="p-4 text-center text-green-600 font-medium">Encontra SUA farmácia</td>
                  </tr>
                  <tr className="bg-background dark:bg-background/50">
                    <td className="p-4 text-foreground">Delivery</td>
                    <td className="p-4 text-center text-muted-foreground">Só presencial</td>
                    <td className="p-4 text-center text-green-600 font-medium">Entrega no bairro todo</td>
                  </tr>
                  <tr className="bg-background dark:bg-background/50">
                    <td className="p-4 text-foreground">Base de clientes</td>
                    <td className="p-4 text-center text-muted-foreground">Depende da memória</td>
                    <td className="p-4 text-center text-green-600 font-medium">Sistema completo</td>
                  </tr>
                  <tr className="bg-background dark:bg-background/50">
                    <td className="p-4 text-foreground">Plantão</td>
                    <td className="p-4 text-center text-muted-foreground">Ninguém sabe</td>
                    <td className="p-4 text-center text-green-600 font-medium">Divulgado online</td>
                  </tr>
                  <tr className="bg-background dark:bg-background/50">
                    <td className="p-4 text-foreground">Perfumaria</td>
                    <td className="p-4 text-center text-muted-foreground">Só quem entra vê</td>
                    <td className="p-4 text-center text-green-600 font-medium">Instagram + Google</td>
                  </tr>
                  <tr className="bg-background dark:bg-background/50">
                    <td className="p-4 text-foreground">Lembretes</td>
                    <td className="p-4 text-center text-muted-foreground">Não existe</td>
                    <td className="p-4 text-center text-green-600 font-medium">"Hora de repor remédio"</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 16: Depoimentos */}
        <section id="depoimentos" ref={depoimentosRef.ref} className="py-16 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Depoimentos</h2>
                <p className="text-muted-foreground">O que farmacêuticos dizem</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "Meus clientes idosos agora pedem pelo WhatsApp. Os filhos me acham no Google!"
                  </p>
                  <p className="font-bold text-foreground">Dr. Carlos</p>
                  <p className="text-sm text-muted-foreground">Farmácia Popular</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "Vendia perfumaria só pra quem entrava. Agora posto no Instagram e vendo 3x mais!"
                  </p>
                  <p className="font-bold text-foreground">Dra. Ana</p>
                  <p className="text-sm text-muted-foreground">Farmácia Central</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "Estava de plantão e ninguém sabia. Com o site, cliente me encontra às 2h da manhã."
                  </p>
                  <p className="font-bold text-foreground">Dr. João</p>
                  <p className="text-sm text-muted-foreground">Farmácia 24h</p>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-background/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "Grandes redes dominavam. Agora concorro de igual com meu catálogo online."
                  </p>
                  <p className="font-bold text-foreground">Dra. Maria</p>
                  <p className="text-sm text-muted-foreground">Farmácia do Bairro</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 17: Calculadora */}
        <section id="calculadora" ref={calculadoraRef.ref} className="py-16 bg-muted/30 dark:bg-muted/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Percent className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Calculadora de Economia</h2>
                <p className="text-muted-foreground">Quanto você economiza saindo do iFood/Rappi</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="bg-destructive/5 border-destructive/20 dark:bg-destructive/10">
                <CardContent className="p-6">
                  <h3 className="font-bold text-destructive mb-4">❌ Com iFood/Rappi</h3>
                  <p className="text-sm text-muted-foreground mb-4">Faturamento delivery: R$ 8.000/mês</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Taxa média (27%)</span>
                      <span className="text-sm font-medium text-destructive">R$ 2.160</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Taxa de entrega</span>
                      <span className="text-sm font-medium text-destructive">R$ 400</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-destructive/20">
                      <span className="font-bold text-foreground">Total de taxas</span>
                      <span className="font-bold text-destructive">R$ 2.560/mês</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20 dark:bg-green-500/10">
                <CardContent className="p-6">
                  <h3 className="font-bold text-green-600 mb-4">✅ Com Mostralo + Entregador Próprio</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Mensalidade</span>
                      <span className="text-sm font-medium text-green-600">R$ 397,90</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Taxas por venda</span>
                      <span className="text-sm font-medium text-green-600">R$ 0</span>
                    </div>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <p className="text-sm font-bold text-green-600">💰 ECONOMIA</p>
                    <p className="text-2xl font-bold text-green-600">R$ 2.162/mês</p>
                    <p className="text-sm text-muted-foreground">= R$ 25.944/ano</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <Card className="bg-primary/5 border-primary/20 inline-block dark:bg-primary/10">
                <CardContent className="p-6">
                  <p className="text-lg font-bold text-foreground">
                    Com apenas <span className="text-primary">3 entregas a mais por dia</span>, você já paga o investimento!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 18: CTA Final */}
        <section id="comecar" ref={comecarRef.ref} className="py-16 bg-gradient-to-br from-green-500/10 via-background to-primary/10 dark:from-green-500/5 dark:to-primary/5">
          <div className="container mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comece Agora
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Sua farmácia online, competindo de igual com as grandes redes. 
              <span className="font-semibold text-green-600"> 7 dias para testar.</span>
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
                  Criar Minha Farmácia Online <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/#plans">
                <Button variant="outline" size="lg" className="gap-2">
                  Ver Planos
                </Button>
              </Link>
              <a href={getWhatsAppLink('farmacias')} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950">
                  <MessageCircle className="h-4 w-4" /> Falar com Consultor
                </Button>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center items-center gap-6 mt-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-5 w-5" />
                <span className="text-sm">7 dias para testar</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-5 w-5" />
                <span className="text-sm">Cancele quando quiser</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm">Suporte via WhatsApp</span>
              </div>
            </div>
          </div>
        </section>

        {/* Copy Button Section */}
        <section className="py-8 bg-muted/30 dark:bg-muted/10">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-semibold text-foreground">Usar com IA</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Copie todo o conteúdo desta página para usar em prompts de IA como ChatGPT ou Claude.
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
                      Copiar Todo o Texto
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <DashboardFooter />
      </main>
    </div>
  );
}
