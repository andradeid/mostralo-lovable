import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, Menu, X, ChevronRight, Smartphone, Package, MessageCircle, 
  BarChart3, Tag, Clock, ShoppingCart, Palette, MapPin, Users, 
  Image, AlertTriangle, Check, ArrowRight, Star, Shield, Database,
  Heart, Target, Zap, TrendingUp, CreditCard, Copy, Search, Instagram,
  Globe, Percent, Calendar, Gift, Camera, Share2, Building2, Gamepad2,
  Shirt, SprayCan, Headphones
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DashboardFooter } from '@/components/admin/DashboardFooter';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useMasterWhatsApp } from '@/hooks/useMasterWhatsApp';

const sections = [
  { id: 'dor-lojista', title: 'A Dor do Lojista', icon: AlertTriangle },
  { id: 'loja-online', title: 'Sua Loja Online', icon: Store },
  { id: 'catalogo', title: 'Catálogo Digital', icon: Smartphone },
  { id: 'whatsapp', title: 'Pedidos WhatsApp', icon: MessageCircle },
  { id: 'clientes', title: 'Base de Clientes', icon: Users },
  { id: 'divulgacao', title: 'Divulgação', icon: Share2 },
  { id: 'google-shopping', title: 'Google & Instagram Shopping', icon: Search },
  { id: 'horario', title: 'Venda 24 Horas', icon: Clock },
  { id: 'reservas', title: 'Reservas', icon: Calendar },
  { id: 'fidelizacao', title: 'Fidelização', icon: Heart },
  { id: 'pagamentos', title: 'Pagamentos', icon: CreditCard },
  { id: 'fotos', title: 'Fotos que Vendem', icon: Camera },
  { id: 'localizacao', title: 'Localização', icon: MapPin },
  { id: 'feira-digital', title: 'Feira Digital', icon: Building2 },
  { id: 'comparativo', title: 'Comparativo', icon: Target },
  { id: 'depoimentos', title: 'Depoimentos', icon: Star },
  { id: 'calculadora', title: 'Economia', icon: Percent },
  { id: 'comecar', title: 'Começar', icon: Zap },
];

export default function FeirantesPage() {
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
  const horarioRef = useScrollReveal();
  const reservasRef = useScrollReveal();
  const fidelizacaoRef = useScrollReveal();
  const pagamentosRef = useScrollReveal();
  const fotosRef = useScrollReveal();
  const localizacaoRef = useScrollReveal();
  const feiraDigitalRef = useScrollReveal();
  const comparativoRef = useScrollReveal();
  const depoimentosRef = useScrollReveal();
  const calculadoraRef = useScrollReveal();
  const comecarRef = useScrollReveal();

  // Helper to get ref object for sections
  const getRef = (scrollRef: ReturnType<typeof useScrollReveal>) => scrollRef.ref;

  const copyPageText = async () => {
    const pageText = `# GUIA COMPLETO MOSTRALO PARA LOJISTAS DE FEIRA

## A DOR DO LOJISTA DA FEIRA

### O Problema:
- ⏰ Horário limitado: Você só vende das 8h às 18h, mas seu cliente quer comprar às 22h
- 🛒 Concorrência online: Mercado Livre, Shopee e Amazon entregam na porta
- 📍 Cliente pesquisa online: "iPhone Brasília" - se você não aparece, perdeu a venda
- 💸 Guerra de preços: Cliente compara no celular enquanto está na sua loja
- 🗒️ Sem cadastro de clientes: Vendeu e perdeu o contato
- 📱 Sem vitrine virtual: Quem não vai à feira não sabe o que você vende

### Estatísticas:
- 85% dos consumidores pesquisam online antes de comprar eletrônicos
- 60% desistem se não encontram informações de preço/estoque
- R$ 147 bilhões movimentados em e-commerce no Brasil (2023)

## SUA LOJA ONLINE - A SOLUÇÃO

✅ Venda 24h: Cliente faz pedido às 23h, você entrega no dia seguinte
✅ Catálogo completo: Todos seus produtos com fotos, preços e variações
✅ Concorra com os grandes: Sua loja aparece profissional como Mercado Livre
✅ Base de clientes: Nome, WhatsApp e histórico de compras
✅ Link próprio: sualoja.mostralo.com.br - compartilha em qualquer lugar
✅ Reservas/Encomendas: Cliente reserva, você separa, ele retira

## CATÁLOGO DIGITAL POR NICHO

📱 CELULARES E SMARTPHONES:
- Todas as marcas (iPhone, Samsung, Xiaomi, Motorola)
- Variações: Cor, Capacidade (64GB, 128GB, 256GB)
- Ficha técnica, fotos reais do produto
- Indicador: "Pronta Entrega" ou "Encomenda"

🎮 GAMES E VIDEOGAMES:
- Consoles (PS5, Xbox, Nintendo Switch)
- Jogos físicos e acessórios
- Categorias: Ação, Aventura, Esportes, Infantil

👕 ROUPAS E MODA:
- Tamanhos: P, M, G, GG, Plus Size
- Cores disponíveis com fotos
- Categorias: Masculino, Feminino, Infantil, Tênis

🧴 PERFUMES E COSMÉTICOS:
- Importados e nacionais
- Masculino e Feminino
- ML do frasco, fotos reais

🔌 ELETRÔNICOS E ACESSÓRIOS:
- Fones, smartwatches, carregadores
- Voltagem: 110V, 220V, Bivolt
- Capas, películas, cabos

## GOOGLE SHOPPING + INSTAGRAM SHOPPING

🔍 GOOGLE SHOPPING:
- Seus produtos aparecem quando cliente pesquisa "iPhone Brasília"
- Foto, preço e link direto para sua loja
- Concorra de igual com Mercado Livre nas buscas
- Feed XML automático gerado pelo sistema

📸 INSTAGRAM SHOPPING:
- Marque produtos nas suas fotos com preço
- Cliente toca na foto → vê o preço → compra
- Integração com catálogo do Facebook/Meta
- Feed CSV automático gerado pelo sistema

📊 ESTATÍSTICAS:
- 55% das buscas de produtos começam no Google
- 130 milhões de usuários tocam em tags de produto no Instagram/mês
- 44% dos compradores usam Instagram para descobrir produtos

💰 DIFERENCIAL:
- Mercado Livre cobra 13% de comissão por venda
- Mostralo: R$ 0 de taxa, só mensalidade fixa
- Você aparece no Google Shopping SEM pagar por clique

## COMPARATIVO: SEM MOSTRALO vs COM MOSTRALO

| Situação | Sem Mostralo | Com Mostralo |
|----------|--------------|--------------|
| Horário | 8h às 18h (10 horas) | 24 horas por dia |
| Cliente pesquisa online | Vai pro Mercado Livre | Encontra SUA loja |
| Base de clientes | Não existe | Cadastro completo |
| Pós-venda | Zero contato | "Chegou o que você queria!" |
| Concorrência | Perde pro online | Compete de igual |
| Google Shopping | ❌ Não aparece | ✅ Seus produtos nas buscas |
| Instagram Shopping | ❌ Não tem | ✅ Tags de preço nas fotos |

## CALCULADORA DE ECONOMIA

Se você vende no Mercado Livre:
- Faturamento: R$ 10.000/mês
- Taxa ML (13%): R$ 1.300
- Taxa de envio: R$ 500
- Total de taxas: R$ 1.800/mês

Com Mostralo:
- Mensalidade: R$ 397,90/mês
- Taxas: R$ 0

💰 ECONOMIA: R$ 1.402/mês = R$ 16.824/ano

Com 4 vendas a mais por mês, você já paga o investimento e ainda lucra!

## PLANOS

### Essencial: R$ 397,90/mês
- Catálogo digital completo
- Pedidos por WhatsApp
- Google Shopping integrado
- Instagram Shopping integrado

### Profissional: R$ 597,90/mês (Mais Popular)
- Tudo do Essencial +
- WhatsApp Marketing
- Relatórios avançados
- Marketing digital integrado

### Empresarial: R$ 997,90/mês
- Tudo do Profissional +
- Multi-lojas
- API completa
- Suporte prioritário

---
Conteúdo do Mostralo - Plataforma para Lojistas de Feira
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
              <span className="text-primary font-medium text-sm">
                Para Feirantes
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
              <span className="block text-primary font-medium">Para Feirantes</span>
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
        <section ref={heroRef.ref} className="bg-gradient-to-br from-blue-500/10 via-background to-primary/10 dark:from-blue-500/5 dark:to-primary/5 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
              <Building2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Para Lojistas de Feira</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Sua Loja da Feira Agora Vende 24 Horas
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              Apareça no <span className="text-blue-500 font-semibold">Google Shopping</span>, <span className="text-pink-500 font-semibold">Instagram</span> e <span className="text-green-500 font-semibold">WhatsApp</span>. 
              Pare de perder vendas pro Mercado Livre.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Ideal para: Feira dos Importados, shoppings populares, galerias comerciais
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="gap-2">
                  Criar Minha Loja Online <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" onClick={() => scrollToSection('google-shopping')}>
                Ver Google Shopping
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
              <Card className="bg-background/50 border-blue-500/20">
                <CardContent className="p-4 text-center">
                  <Search className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">55%</p>
                  <p className="text-xs text-muted-foreground">buscas começam no Google</p>
                </CardContent>
              </Card>
              <Card className="bg-background/50 border-pink-500/20">
                <CardContent className="p-4 text-center">
                  <Instagram className="h-6 w-6 text-pink-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">130M</p>
                  <p className="text-xs text-muted-foreground">tocam tags no Instagram/mês</p>
                </CardContent>
              </Card>
              <Card className="bg-background/50 border-green-500/20">
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">24h</p>
                  <p className="text-xs text-muted-foreground">sua loja sempre aberta</p>
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

        {/* Section 1: A Dor do Lojista */}
        <section id="dor-lojista" ref={dorRef.ref} className="py-16 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">A Dor do Lojista da Feira</h2>
                <p className="text-muted-foreground">Por que a feira não é mais suficiente?</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-6">
                  <Clock className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Horário Limitado</h3>
                  <p className="text-sm text-muted-foreground">
                    Você só vende das <span className="font-semibold">8h às 18h</span>, mas seu cliente quer comprar às 22h, 
                    no sofá de casa, comparando preços.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-6">
                  <ShoppingCart className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Concorrência Online</h3>
                  <p className="text-sm text-muted-foreground">
                    Mercado Livre, Shopee e Amazon entregam na porta do cliente. 
                    <span className="font-semibold"> Você não compete mais só com a loja do lado.</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-6">
                  <Search className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Cliente Pesquisa Online</h3>
                  <p className="text-sm text-muted-foreground">
                    "iPhone Brasília" no Google - se você não aparece, <span className="font-semibold">perdeu a venda</span> pro 
                    concorrente que aparece.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-6">
                  <Percent className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Guerra de Preços</h3>
                  <p className="text-sm text-muted-foreground">
                    Cliente compara no celular <span className="font-semibold">enquanto está na sua loja</span>. 
                    Se achar mais barato online, vai embora.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-6">
                  <Users className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Sem Cadastro de Clientes</h3>
                  <p className="text-sm text-muted-foreground">
                    Vendeu e perdeu o contato. Não sabe quem comprou, o que comprou, 
                    <span className="font-semibold"> não consegue avisar de promoções.</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-6">
                  <Image className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Sem Vitrine Virtual</h3>
                  <p className="text-sm text-muted-foreground">
                    Quem não vai à feira <span className="font-semibold">não sabe o que você vende</span>. 
                    Seu estoque é invisível para milhares de clientes.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            <Card className="bg-background border-destructive/30">
              <CardContent className="p-6">
                <h3 className="font-bold text-destructive mb-4 text-center">📊 Estatísticas que Você Precisa Saber</h3>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-3xl font-bold text-foreground">85%</p>
                    <p className="text-sm text-muted-foreground">dos consumidores pesquisam online antes de comprar eletrônicos</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">60%</p>
                    <p className="text-sm text-muted-foreground">desistem se não encontram informações de preço/estoque</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">R$ 147bi</p>
                    <p className="text-sm text-muted-foreground">movimentados em e-commerce no Brasil (2023)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 2: Sua Loja Online */}
        <section id="loja-online" ref={solucaoRef.ref} className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Store className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Sua Loja Online</h2>
                <p className="text-muted-foreground">O que o Mostralo resolve para você</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Check className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-foreground mb-1">Venda 24 Horas</h3>
                      <p className="text-sm text-muted-foreground">
                        Cliente faz pedido às 23h, você entrega no dia seguinte. Sua loja nunca fecha.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Check className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-foreground mb-1">Catálogo Completo</h3>
                      <p className="text-sm text-muted-foreground">
                        Todos seus produtos com fotos, preços e variações. Profissional como Mercado Livre.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Check className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-foreground mb-1">Concorra com os Grandes</h3>
                      <p className="text-sm text-muted-foreground">
                        Apareça no Google Shopping e Instagram Shopping. Mesma visibilidade que os marketplaces.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Check className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-foreground mb-1">Base de Clientes</h3>
                      <p className="text-sm text-muted-foreground">
                        Nome, WhatsApp e histórico de compras. Avise quando chegar o que ele procura.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Check className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-foreground mb-1">Link Próprio</h3>
                      <p className="text-sm text-muted-foreground">
                        sualoja.mostralo.com.br - compartilha no Instagram, WhatsApp, cartão de visita.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Check className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-foreground mb-1">Reservas e Encomendas</h3>
                      <p className="text-sm text-muted-foreground">
                        Cliente reserva, você separa, ele retira na feira. Organização total.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 3: Catálogo Digital */}
        <section id="catalogo" ref={catalogoRef.ref} className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Catálogo Digital por Nicho</h2>
                <p className="text-muted-foreground">Organizado para cada tipo de produto</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Celulares */}
              <Card className="border-blue-500/30 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="font-bold text-foreground">Celulares e Smartphones</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Todas as marcas (iPhone, Samsung, Xiaomi)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Variações: Cor, Capacidade (64GB, 128GB, 256GB)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Ficha técnica e fotos reais
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Indicador: "Pronta Entrega" ou "Encomenda"
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Games */}
              <Card className="border-purple-500/30 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <Gamepad2 className="h-5 w-5 text-purple-500" />
                    </div>
                    <h3 className="font-bold text-foreground">Games e Videogames</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Consoles (PS5, Xbox, Nintendo Switch)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Jogos físicos e digitais
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Acessórios: controles, headsets
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Categorias: Ação, Aventura, Esportes
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Roupas */}
              <Card className="border-pink-500/30 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center">
                      <Shirt className="h-5 w-5 text-pink-500" />
                    </div>
                    <h3 className="font-bold text-foreground">Roupas e Moda</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Tamanhos: P, M, G, GG, Plus Size
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Cores disponíveis com fotos
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Masculino, Feminino, Infantil
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Tênis, bolsas, acessórios
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Perfumes */}
              <Card className="border-amber-500/30 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                      <SprayCan className="h-5 w-5 text-amber-500" />
                    </div>
                    <h3 className="font-bold text-foreground">Perfumes e Cosméticos</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Importados e nacionais
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Masculino e Feminino
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      ML do frasco, fotos reais
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Kits e combos promocionais
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Eletrônicos */}
              <Card className="border-cyan-500/30 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                      <Headphones className="h-5 w-5 text-cyan-500" />
                    </div>
                    <h3 className="font-bold text-foreground">Eletrônicos e Acessórios</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Fones, smartwatches, carregadores
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Voltagem: 110V, 220V, Bivolt
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Capas, películas, cabos
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Garantia e especificações
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* CTA Card */}
              <Card className="border-primary/30 bg-primary/5 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                  <Store className="h-10 w-10 text-primary mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Qualquer Tipo de Produto</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    O sistema se adapta ao seu nicho. Você cria as categorias que precisar.
                  </p>
                  <Link to="/signup">
                    <Button size="sm">Criar Minha Loja</Button>
                  </Link>
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
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Pedidos Direto no WhatsApp</h2>
                <p className="text-muted-foreground">Do jeito que você já trabalha</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                    <div>
                      <h4 className="font-semibold text-foreground">Cliente escolhe no catálogo</h4>
                      <p className="text-sm text-muted-foreground">Navega pelos produtos, vê fotos, preços e variações</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                    <div>
                      <h4 className="font-semibold text-foreground">Monta o pedido</h4>
                      <p className="text-sm text-muted-foreground">Adiciona ao carrinho, escolhe variações (cor, tamanho)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                    <div>
                      <h4 className="font-semibold text-foreground">Envia pro seu WhatsApp</h4>
                      <p className="text-sm text-muted-foreground">Pedido formatado com todos os detalhes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                    <div>
                      <h4 className="font-semibold text-foreground">Você confirma e combina</h4>
                      <p className="text-sm text-muted-foreground">Confirma estoque, combina entrega ou retirada</p>
                    </div>
                  </div>
                </div>

                <Card className="mt-6 bg-green-500/10 border-green-500/20">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      💡 Pagamento como você já faz: PIX, dinheiro, cartão na entrega. Sem gateway complicado.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-background">
                <CardContent className="p-6">
                  <div className="bg-green-600 text-white p-3 rounded-t-lg flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    <span className="font-medium">WhatsApp</span>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-b-lg space-y-3">
                    <div className="bg-white dark:bg-muted p-3 rounded-lg shadow-sm max-w-[80%]">
                      <p className="text-sm text-foreground">Olá! Tenho interesse no iPhone 15 Pro 256GB Preto que vi no catálogo.</p>
                      <p className="text-xs text-muted-foreground mt-1">10:45</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg shadow-sm max-w-[80%] ml-auto">
                      <p className="text-sm text-foreground">Boa noite! Temos sim, pronta entrega. Quer retirar na feira ou entrego?</p>
                      <p className="text-xs text-muted-foreground mt-1">10:46</p>
                    </div>
                    <div className="bg-white dark:bg-muted p-3 rounded-lg shadow-sm max-w-[80%]">
                      <p className="text-sm text-foreground">Entrega! Aceita PIX?</p>
                      <p className="text-xs text-muted-foreground mt-1">10:47</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 5: Base de Clientes */}
        <section id="clientes" ref={clientesRef.ref} className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Construa Sua Base de Clientes</h2>
                <p className="text-muted-foreground">Nunca mais perca um contato</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <Database className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Cadastro Automático</h4>
                      <p className="text-sm text-muted-foreground">Todo cliente que compra fica cadastrado com nome, telefone e histórico</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Histórico Completo</h4>
                      <p className="text-sm text-muted-foreground">O que comprou, quando comprou, quanto gastou</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <Tag className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Segmentação</h4>
                      <p className="text-sm text-muted-foreground">"Clientes de iPhone", "Compradores de perfume", "Gosta de promoção"</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <MessageCircle className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Comunicação Direta</h4>
                      <p className="text-sm text-muted-foreground">"Chegou iPhone 15! Quer que eu separe?"</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-purple-500/5 border-purple-500/20">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <p className="text-3xl font-bold text-foreground mb-2">Seus Clientes</p>
                  <p className="text-muted-foreground mb-4">
                    Diferente do Mercado Livre onde o cliente é do marketplace, 
                    aqui <span className="font-semibold text-purple-600 dark:text-purple-400">o cliente é SEU</span>.
                  </p>
                  <div className="bg-purple-500/10 rounded-lg p-4">
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      💡 Lojistas com base de clientes vendem <span className="font-bold">3x mais</span> em datas comemorativas
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 6: Divulgação */}
        <section id="divulgacao" ref={divulgacaoRef.ref} className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Divulgação que Funciona</h2>
                <p className="text-muted-foreground">Compartilhe em qualquer lugar</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Globe className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Link Único</h4>
                  <p className="text-sm text-muted-foreground">sualoja.mostralo.com.br</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Image className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">QR Code</h4>
                  <p className="text-sm text-muted-foreground">Cole na vitrine da loja</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Instagram className="h-8 w-8 text-pink-500 mx-auto mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Redes Sociais</h4>
                  <p className="text-sm text-muted-foreground">Instagram, Facebook, TikTok</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">WhatsApp Status</h4>
                  <p className="text-sm text-muted-foreground">"Meu catálogo completo aqui"</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 7: Google Shopping + Instagram Shopping - DESTAQUE */}
        <section id="google-shopping" ref={googleRef.ref} className="py-16 bg-gradient-to-br from-blue-500/10 via-pink-500/5 to-primary/10 dark:from-blue-500/5 dark:via-pink-500/5 dark:to-primary/5">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Search className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Google Shopping + Instagram Shopping</h2>
                <p className="text-muted-foreground">Apareça onde seu cliente pesquisa</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-8">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Feeds gerados automaticamente pelo Mostralo</span>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Google Shopping */}
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white dark:bg-muted rounded-lg flex items-center justify-center shadow">
                      <Search className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Google Shopping</h3>
                      <p className="text-sm text-muted-foreground">Seus produtos nas buscas do Google</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-blue-500 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Cliente pesquisa <span className="font-semibold text-foreground">"iPhone 15 Brasília"</span> → sua loja aparece
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-blue-500 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Foto, preço e link direto para seu catálogo
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-blue-500 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Concorra de igual com Mercado Livre nas buscas
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-blue-500 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Feed XML automático</span> - só conectar no Google Merchant Center
                      </p>
                    </div>
                  </div>

                  <Card className="mt-4 bg-blue-500/10 border-blue-500/20">
                    <CardContent className="p-3">
                      <p className="text-xs font-mono text-blue-700 dark:text-blue-300">
                        sualoja.mostralo.com.br/feed.xml
                      </p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Instagram Shopping */}
              <Card className="border-pink-500/30 bg-pink-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow">
                      <Instagram className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Instagram Shopping</h3>
                      <p className="text-sm text-muted-foreground">Tags de preço nas suas fotos</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-pink-500 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Marque produtos nas fotos com <span className="font-semibold text-foreground">etiquetas de preço</span>
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-pink-500 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Cliente toca na foto → vê o preço → compra
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-pink-500 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Integração com catálogo do Facebook/Meta
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-pink-500 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Feed CSV automático</span> - só importar no Meta Commerce
                      </p>
                    </div>
                  </div>

                  <Card className="mt-4 bg-pink-500/10 border-pink-500/20">
                    <CardContent className="p-3">
                      <p className="text-xs font-mono text-pink-700 dark:text-pink-300">
                        sualoja.mostralo.com.br/feed.csv
                      </p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-background">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-blue-500">55%</p>
                  <p className="text-xs text-muted-foreground">das buscas de produtos começam no Google</p>
                </CardContent>
              </Card>
              <Card className="bg-background">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-pink-500">130M</p>
                  <p className="text-xs text-muted-foreground">tocam em tags de produto no Instagram/mês</p>
                </CardContent>
              </Card>
              <Card className="bg-background">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-purple-500">44%</p>
                  <p className="text-xs text-muted-foreground">usam Instagram para descobrir produtos</p>
                </CardContent>
              </Card>
              <Card className="bg-background">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-green-500">R$ 0</p>
                  <p className="text-xs text-muted-foreground">de taxa por venda (vs 13% do ML)</p>
                </CardContent>
              </Card>
            </div>

            {/* Comparison */}
            <Card className="bg-background border-2 border-green-500/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4 text-center">💰 Diferencial Competitivo</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-red-500/10 rounded-lg">
                    <p className="font-bold text-destructive mb-2">Mercado Livre</p>
                    <p className="text-2xl font-bold text-foreground">13%</p>
                    <p className="text-sm text-muted-foreground">de comissão por venda</p>
                    <p className="text-xs text-muted-foreground mt-2">+ taxa de envio + anúncios pagos</p>
                  </div>
                  <div className="text-center p-4 bg-green-500/10 rounded-lg">
                    <p className="font-bold text-green-600 dark:text-green-400 mb-2">Mostralo</p>
                    <p className="text-2xl font-bold text-foreground">R$ 0</p>
                    <p className="text-sm text-muted-foreground">de taxa por venda</p>
                    <p className="text-xs text-muted-foreground mt-2">Só mensalidade fixa a partir de R$ 397,90</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 8: Venda Fora do Horário */}
        <section id="horario" ref={horarioRef.ref} className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Venda Fora do Horário da Feira</h2>
                <p className="text-muted-foreground">Sua loja online nunca fecha</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Feira fecha às 18h</h4>
                      <p className="text-sm text-muted-foreground">Sua loja online continua recebendo pedidos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Cliente faz pedido às 22h de sábado</h4>
                      <p className="text-sm text-muted-foreground">Você vê domingo de manhã e já separa</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Segunda-feira</h4>
                      <p className="text-sm text-muted-foreground">Entrega ou cliente retira na feira</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <Gift className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Feriados e férias</h4>
                      <p className="text-sm text-muted-foreground">Pedidos continuam chegando, você responde quando puder</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-destructive">10h</p>
                      <p className="text-sm text-muted-foreground">Feira aberta</p>
                      <p className="text-xs text-muted-foreground">(8h às 18h)</p>
                    </div>
                    <ArrowRight className="h-8 w-8 text-amber-500" />
                    <div className="text-center">
                      <p className="text-4xl font-bold text-green-500">24h</p>
                      <p className="text-sm text-muted-foreground">Loja online</p>
                      <p className="text-xs text-muted-foreground">(sempre aberta)</p>
                    </div>
                  </div>
                  <div className="bg-amber-500/10 rounded-lg p-4 text-center">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      <span className="font-bold">+14 horas por dia</span> recebendo pedidos
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 9: Reservas */}
        <section id="reservas" ref={reservasRef.ref} className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Reservas e Encomendas</h2>
                <p className="text-muted-foreground">Cliente reserva, você separa, ele retira</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Package className="h-10 w-10 text-indigo-500 mx-auto mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Cliente Reserva</h4>
                  <p className="text-sm text-muted-foreground">
                    "Quero esse iPhone preto 128GB"
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Check className="h-10 w-10 text-indigo-500 mx-auto mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Você Separa</h4>
                  <p className="text-sm text-muted-foreground">
                    Avisa quando estiver pronto ou quando chegar (encomenda)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <MapPin className="h-10 w-10 text-indigo-500 mx-auto mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Ele Retira</h4>
                  <p className="text-sm text-muted-foreground">
                    Retirada agendada na feira ou entrega combinada
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 bg-indigo-500/5 border-indigo-500/20">
              <CardContent className="p-6 text-center">
                <p className="text-indigo-700 dark:text-indigo-300">
                  💡 Menos produto parado, mais giro. Você já sabe o que preparar antes do cliente chegar.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 10: Fidelização */}
        <section id="fidelizacao" ref={fidelizacaoRef.ref} className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Fidelização de Clientes</h2>
                <p className="text-muted-foreground">Faça o cliente voltar sempre</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <Tag className="h-8 w-8 text-red-500 mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Cupons de Desconto</h4>
                  <p className="text-sm text-muted-foreground">
                    "Na próxima compra, 5% off"
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Zap className="h-8 w-8 text-red-500 mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Promoções Relâmpago</h4>
                  <p className="text-sm text-muted-foreground">
                    Avise clientes VIP primeiro
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Star className="h-8 w-8 text-red-500 mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Cliente VIP</h4>
                  <p className="text-sm text-muted-foreground">
                    Tratamento especial para quem compra sempre
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Gift className="h-8 w-8 text-red-500 mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Programa de Indicação</h4>
                  <p className="text-sm text-muted-foreground">
                    "Indique um amigo e ganhe"
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 11: Pagamentos */}
        <section id="pagamentos" ref={pagamentosRef.ref} className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Pagamentos Flexíveis</h2>
                <p className="text-muted-foreground">Do jeito que você já trabalha</p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-6 w-6 text-green-500" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">PIX</h4>
                  <p className="text-sm text-muted-foreground">Instantâneo, sem taxa</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-6 w-6 text-green-500" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">Cartão</h4>
                  <p className="text-sm text-muted-foreground">Na sua maquininha</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Package className="h-6 w-6 text-green-500" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">Dinheiro</h4>
                  <p className="text-sm text-muted-foreground">Na entrega/retirada</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-6 w-6 text-green-500" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">Parcelado</h4>
                  <p className="text-sm text-muted-foreground">Se tiver maquininha</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 bg-green-500/5 border-green-500/20">
              <CardContent className="p-6 text-center">
                <p className="text-green-700 dark:text-green-300">
                  💡 Sem gateway complicado. Combina direto com o cliente, do jeito que você já faz.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 12: Fotos */}
        <section id="fotos" ref={fotosRef.ref} className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                <Camera className="h-6 w-6 text-cyan-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Fotos que Vendem</h2>
                <p className="text-muted-foreground">Cliente vê exatamente o que vai comprar</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-cyan-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Tire fotos com seu celular</h4>
                      <p className="text-sm text-muted-foreground">Sistema aceita qualquer formato</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <Image className="h-5 w-5 text-cyan-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Múltiplas fotos por produto</h4>
                      <p className="text-sm text-muted-foreground">Frente, verso, detalhes, embalagem</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <Check className="h-5 w-5 text-cyan-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Fotos reais do produto</h4>
                      <p className="text-sm text-muted-foreground">Cliente confia mais em foto real que foto de internet</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-cyan-500/5 border-cyan-500/20">
                <CardContent className="p-6">
                  <h4 className="font-bold text-foreground mb-4">📸 Dicas de Fotos</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Fundo neutro (branco ou cinza claro)</li>
                    <li>• Boa iluminação natural</li>
                    <li>• Produto limpo e organizado</li>
                    <li>• Mostre a embalagem original</li>
                    <li>• Tire foto dos detalhes importantes</li>
                  </ul>
                  <div className="mt-4 bg-cyan-500/10 rounded-lg p-3">
                    <p className="text-xs text-cyan-700 dark:text-cyan-300">
                      💡 "Foto real do produto que você vai receber" vale mais que mil palavras!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 13: Localização */}
        <section id="localizacao" ref={localizacaoRef.ref} className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Sua Localização na Feira</h2>
                <p className="text-muted-foreground">Cliente novo te encontra fácil</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="font-medium text-foreground">Box 247, Bloco C, Corredor 5</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">Segunda a Sábado, 8h às 18h</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">Feira dos Importados - Brasília/DF</span>
                    </div>
                  </div>
                  <div className="mt-6 bg-primary/10 rounded-lg p-4">
                    <p className="text-sm text-primary">
                      📍 Integração com Google Maps - cliente abre a rota direto no celular
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <Search className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Pontos de Referência</h4>
                      <p className="text-sm text-muted-foreground">"Em frente à praça de alimentação"</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <Image className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Foto da Fachada</h4>
                      <p className="text-sm text-muted-foreground">Cliente reconhece sua loja de longe</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">WhatsApp Direto</h4>
                      <p className="text-sm text-muted-foreground">"Tô perdido, onde fica?" → você manda localização</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Section 14: Feira Digital */}
        <section id="feira-digital" ref={feiraDigitalRef.ref} className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-violet-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Ideia: Feira Digital Coletiva</h2>
                <p className="text-muted-foreground">A feira inteira na palma da mão</p>
              </div>
            </div>

            <Card className="bg-violet-500/5 border-violet-500/20">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-foreground">Para Associações e Administradores</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-violet-500 mt-0.5" />
                        <p className="text-muted-foreground">Página unificada da feira inteira</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-violet-500 mt-0.5" />
                        <p className="text-muted-foreground">Cada lojista com sua loja individual</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-violet-500 mt-0.5" />
                        <p className="text-muted-foreground">Cliente busca "tênis" → vê todas as lojas que vendem</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-violet-500 mt-0.5" />
                        <p className="text-muted-foreground">Divulgação conjunta, força coletiva</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <Building2 className="h-16 w-16 text-violet-500 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-foreground mb-2">
                      "A Feira dos Importados na palma da mão"
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Fale com sua associação sobre essa possibilidade
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 15: Comparativo */}
        <section id="comparativo" ref={comparativoRef.ref} className="py-16 bg-gradient-to-br from-primary/5 to-green-500/5">
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

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-semibold text-foreground">Situação</th>
                      <th className="text-center p-4 font-semibold text-destructive">❌ Sem Mostralo</th>
                      <th className="text-center p-4 font-semibold text-green-600 dark:text-green-400">✅ Com Mostralo</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-border">
                      <td className="p-4 font-medium text-foreground">Horário de vendas</td>
                      <td className="p-4 text-center text-muted-foreground">8h às 18h (10 horas)</td>
                      <td className="p-4 text-center text-green-600 dark:text-green-400 font-semibold">24 horas por dia</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4 font-medium text-foreground">Cliente pesquisa online</td>
                      <td className="p-4 text-center text-muted-foreground">Vai pro Mercado Livre</td>
                      <td className="p-4 text-center text-green-600 dark:text-green-400 font-semibold">Encontra SUA loja</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4 font-medium text-foreground">Base de clientes</td>
                      <td className="p-4 text-center text-muted-foreground">Não existe</td>
                      <td className="p-4 text-center text-green-600 dark:text-green-400 font-semibold">Cadastro completo</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4 font-medium text-foreground">Pós-venda</td>
                      <td className="p-4 text-center text-muted-foreground">Zero contato</td>
                      <td className="p-4 text-center text-green-600 dark:text-green-400 font-semibold">"Chegou o que você queria!"</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4 font-medium text-foreground">Concorrência online</td>
                      <td className="p-4 text-center text-muted-foreground">Perde pro marketplace</td>
                      <td className="p-4 text-center text-green-600 dark:text-green-400 font-semibold">Compete de igual</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4 font-medium text-foreground">Google Shopping</td>
                      <td className="p-4 text-center text-muted-foreground">❌ Não aparece</td>
                      <td className="p-4 text-center text-green-600 dark:text-green-400 font-semibold">✅ Seus produtos nas buscas</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-foreground">Instagram Shopping</td>
                      <td className="p-4 text-center text-muted-foreground">❌ Não tem</td>
                      <td className="p-4 text-center text-green-600 dark:text-green-400 font-semibold">✅ Tags de preço nas fotos</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 16: Depoimentos */}
        <section id="depoimentos" ref={depoimentosRef.ref} className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Depoimentos de Lojistas</h2>
                <p className="text-muted-foreground">Quem já usa, recomenda</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">
                    "Cliente de Goiânia me achou pelo Instagram e comprou! Nunca teria vendido sem a loja online."
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-pink-500">A</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Ana</p>
                      <p className="text-xs text-muted-foreground">Perfumes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">
                    "Vendo videogame até de madrugada pelo WhatsApp. A feira fecha mas minha loja não!"
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-purple-500">L</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Lucas</p>
                      <p className="text-xs text-muted-foreground">Games</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">
                    "Não perco mais cliente pro Mercado Livre. Agora apareço no Google igual a eles!"
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-500">R</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Roberto</p>
                      <p className="text-xs text-muted-foreground">Celulares</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">
                    "Meu cliente já chega sabendo o que quer. Viu no catálogo, escolheu, só vem buscar."
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-cyan-500">P</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Pedro</p>
                      <p className="text-xs text-muted-foreground">Eletrônicos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 17: Calculadora */}
        <section id="calculadora" ref={calculadoraRef.ref} className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Percent className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Calculadora de Economia</h2>
                <p className="text-muted-foreground">Compare com o Mercado Livre</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-red-500/5 border-red-500/20">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-destructive mb-4">Se você vende no Mercado Livre:</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Faturamento mensal:</span>
                      <span className="font-semibold text-foreground">R$ 10.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa ML (13%):</span>
                      <span className="font-semibold text-destructive">- R$ 1.300</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa de envio:</span>
                      <span className="font-semibold text-destructive">- R$ 500</span>
                    </div>
                    <hr className="border-border" />
                    <div className="flex justify-between">
                      <span className="font-bold text-foreground">Total de taxas:</span>
                      <span className="font-bold text-destructive">R$ 1.800/mês</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">Com Mostralo:</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Faturamento mensal:</span>
                      <span className="font-semibold text-foreground">R$ 10.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mensalidade:</span>
                      <span className="font-semibold text-foreground">R$ 397,90</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxas por venda:</span>
                      <span className="font-semibold text-green-600">R$ 0</span>
                    </div>
                    <hr className="border-border" />
                    <div className="flex justify-between">
                      <span className="font-bold text-foreground">Total de custos:</span>
                      <span className="font-bold text-green-600">R$ 397,90/mês</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 bg-primary text-primary-foreground">
              <CardContent className="p-8 text-center">
                <p className="text-2xl font-bold mb-2">💰 ECONOMIA: R$ 1.402/mês</p>
                <p className="text-lg opacity-90 mb-4">= R$ 16.824 por ano no seu bolso</p>
                <p className="text-sm opacity-80">
                  Com apenas 4 vendas a mais por mês, você já paga o investimento e ainda lucra!
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 18: Começar */}
        <section id="comecar" ref={comecarRef.ref} className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Zap className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Comece Agora
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Sua loja online pronta em minutos. Apareça no Google Shopping e Instagram hoje mesmo.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link to="/signup">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Criar Minha Loja Online <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to={getWhatsAppLink('feirantes')} target="_blank">
                  <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950">
                    <MessageCircle className="h-4 w-4" /> Falar com Consultor
                  </Button>
                </Link>
              </div>

              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✅ 7 dias para testar • ✅ Suporte via WhatsApp • ✅ Configuração assistida
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Copy Button */}
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <Button 
              variant="outline" 
              onClick={copyPageText}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copiado!' : 'Copiar Todo o Texto'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Use em ChatGPT, Claude ou materiais de venda
            </p>
          </div>
        </section>

        {/* Footer */}
        <DashboardFooter />
      </main>
    </div>
  );
}
