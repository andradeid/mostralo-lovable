import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useMasterWhatsApp } from '@/hooks/useMasterWhatsApp';
import { toast } from '@/hooks/use-toast';
import { 
  Store, ShoppingBag, Smartphone, MessageCircle, Users, Megaphone,
  Search, Clock, MapPin, Heart, CreditCard, Camera, Navigation,
  Building2, BarChart3, Quote, Calculator, Rocket, ChevronRight,
  CheckCircle2, XCircle, TrendingUp, AlertTriangle, Star, Package,
  Shirt, Tv, Home, Baby, Pill, Wrench, Instagram, ShoppingCart,
  Globe, QrCode, Calendar, Gift, ArrowRight, Play, Zap, Target,
  DollarSign, Percent, Timer, Eye, MousePointer, Tag, Menu, X,
  Copy, Check, FileText
} from 'lucide-react';

const LojistasLocaisPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [faturamento, setFaturamento] = useState([15000]);
  const [copied, setCopied] = useState(false);
  
  // Hook para buscar configurações de WhatsApp
  const { getWhatsAppLink } = useMasterWhatsApp();

  // Scroll reveal hooks for each section
  const heroRef = useScrollReveal({ threshold: 0.1 });
  const dorRef = useScrollReveal({ threshold: 0.1 });
  const solucaoRef = useScrollReveal({ threshold: 0.1 });
  const catalogoRef = useScrollReveal({ threshold: 0.1 });
  const whatsappRef = useScrollReveal({ threshold: 0.1 });
  const clientesRef = useScrollReveal({ threshold: 0.1 });
  const divulgacaoRef = useScrollReveal({ threshold: 0.1 });
  const shoppingRef = useScrollReveal({ threshold: 0.1 });
  const horariosRef = useScrollReveal({ threshold: 0.1 });
  const retireRef = useScrollReveal({ threshold: 0.1 });
  const fidelizacaoRef = useScrollReveal({ threshold: 0.1 });
  const pagamentosRef = useScrollReveal({ threshold: 0.1 });
  const fotosRef = useScrollReveal({ threshold: 0.1 });
  const localizacaoRef = useScrollReveal({ threshold: 0.1 });
  const multiBairrosRef = useScrollReveal({ threshold: 0.1 });
  const comparativoRef = useScrollReveal({ threshold: 0.1 });
  const depoimentosRef = useScrollReveal({ threshold: 0.1 });
  const economiaRef = useScrollReveal({ threshold: 0.1 });
  const ctaRef = useScrollReveal({ threshold: 0.1 });

  const sections = [
    { id: 'dor', label: 'A Dor do Lojista', icon: AlertTriangle },
    { id: 'solucao', label: 'Sua Loja Online', icon: Store },
    { id: 'catalogo', label: 'Catálogo Digital', icon: Package },
    { id: 'whatsapp', label: 'Pedidos WhatsApp', icon: MessageCircle },
    { id: 'clientes', label: 'Base de Clientes', icon: Users },
    { id: 'divulgacao', label: 'Divulgação', icon: Megaphone },
    { id: 'shopping', label: 'Google & Instagram', icon: Search },
    { id: 'horarios', label: 'Venda 24 Horas', icon: Clock },
    { id: 'retire', label: 'Retire na Loja', icon: Store },
    { id: 'fidelizacao', label: 'Fidelização', icon: Heart },
    { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
    { id: 'fotos', label: 'Fotos que Vendem', icon: Camera },
    { id: 'localizacao', label: 'Localização', icon: MapPin },
    { id: 'multibairros', label: 'Multi-Bairros', icon: Building2 },
    { id: 'comparativo', label: 'Comparativo', icon: BarChart3 },
    { id: 'depoimentos', label: 'Depoimentos', icon: Quote },
    { id: 'economia', label: 'Economia', icon: Calculator },
    { id: 'cta', label: 'Começar', icon: Rocket },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id)
      }));

      for (const section of sectionElements.reverse()) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSidebarOpen(false);
    }
  };

  // Cálculos da calculadora
  const taxaMarketplace = faturamento[0] * 0.18;
  const taxaFrete = faturamento[0] * 0.04;
  const totalTaxas = taxaMarketplace + taxaFrete;
  const mensalidadeMostralo = 397.90;
  const economia = totalTaxas - mensalidadeMostralo;
  const economiaAnual = economia * 12;

  const copyPageText = () => {
    const content = `# MOSTRALO PARA LOJISTAS LOCAIS
Sua Loja do Bairro Agora Alcança a Cidade Inteira

## ESTATÍSTICAS DE MERCADO
- 73% pesquisam online antes de comprar local
- 46% das buscas têm intenção local
- 78% compram em 24h após busca mobile
- 100x mais alcance com loja online

## A DOR DO LOJISTA LOCAL
1. Grandes redes dominam - Magazine Luiza, Americanas, Amazon entregam no mesmo dia
2. Cliente pesquisa online - "Loja de roupas perto de mim" - você não aparece
3. Menos movimento na rua - preferem comprar de casa
4. Custos fixos altos - Aluguel, funcionário, luz... e vendas caindo
5. Clientes antigos sumindo - Foram pro online sem contato
6. Horário limitado - Loja fecha às 19h, cliente compra às 23h
7. Só vende pro bairro - Cliente do bairro vizinho nem sabe que você existe

## DADOS QUE COMPROVAM A URGÊNCIA
- 73% dos consumidores pesquisam online antes de comprar localmente
- 46% das buscas no Google têm intenção local ("perto de mim")
- 78% das buscas mobile locais resultam em compra em 24 horas
- Pequenos varejistas perderam 30% de vendas para e-commerce em 5 anos

## A SOLUÇÃO: SUA LOJA ONLINE PROFISSIONAL
- Alcance a cidade inteira (não só o bairro)
- Apareça nas buscas do Google
- Venda 24 horas (site vende às 23h)
- Retire na loja (Click & Collect)
- Fidelize clientes com base de dados
- Concorra com grandes redes
- Custos previsíveis (mensalidade fixa)

## CATÁLOGO DIGITAL POR TIPO DE LOJA
1. Roupas e Moda - Tamanhos, cores, provador virtual
2. Eletrônicos - Especificações técnicas, garantia
3. Casa e Decoração - Ambientes, medidas, combinações
4. Infantil - Faixa etária, segurança, durabilidade
5. Farmácia - Princípio ativo, dosagem, receita
6. Serviços - Agendamento, orçamento, portfólio

## GOOGLE SHOPPING + INSTAGRAM SHOPPING
- Apareça no Google Shopping gratuitamente
- Produtos aparecem quando cliente pesquisa
- Conecte direto ao Instagram Shop
- Venda pelo Instagram sem sair do app
- Feed XML automático para Google Merchant Center

## RETIRE NA LOJA (CLICK & COLLECT)
Benefícios:
- Economia de frete para o cliente
- Cliente conhece sua loja física
- Oportunidade de venda adicional
- Estoque unificado online/físico

## COMPARATIVO: SEM LOJA ONLINE vs COM MOSTRALO
| Sem Loja Online | Com Mostralo |
|-----------------|--------------|
| Só vende no horário comercial | Vende 24 horas por dia |
| Alcance limitado ao bairro | Alcança cidade/região toda |
| Cliente não te encontra online | Aparece no Google e Instagram |
| Perde cliente pro marketplace | Cliente compra direto de você |
| Sem dados dos clientes | Base completa para remarketing |
| Depende de movimento na rua | Vende mesmo sem movimento |

## CALCULADORA DE ECONOMIA
Faturamento: R$ ${faturamento[0].toLocaleString('pt-BR')}
- Taxa marketplace (18%): R$ ${taxaMarketplace.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Taxa frete (4%): R$ ${taxaFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Total taxas: R$ ${totalTaxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Mensalidade Mostralo: R$ ${mensalidadeMostralo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- ECONOMIA MENSAL: R$ ${economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- ECONOMIA ANUAL: R$ ${economiaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

## CTA
Pronto para transformar sua loja?
- 7 dias para testar
- Suporte no WhatsApp
- Não gostou? Devolvemos

Cadastre-se: ${window.location.origin}/signup
WhatsApp: 5561994009368
`;
    
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      toast({
        title: "Texto copiado!",
        description: "Cole em ChatGPT, Claude ou outra IA para usar como contexto.",
      });
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Mostralo</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/funcionalidades" className="text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </Link>
            <Link to="/para-feirantes" className="text-muted-foreground hover:text-foreground transition-colors">
              Para Feirantes
            </Link>
            <Link to="/para-lojistas" className="text-primary font-medium">
              Para Lojistas
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <Link to="/signup">
              <Button className="hidden sm:flex">
                Criar Minha Loja
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar de Navegação */}
      <aside className={`fixed left-0 top-16 bottom-0 w-64 bg-card border-r border-border z-40 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-4 overflow-y-auto h-full">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Navegação
          </h3>
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                    activeSection === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="lg:ml-64 pt-16">
        {/* Hero Section */}
        <section 
          id="hero" 
          ref={heroRef.ref}
          className={`relative min-h-[90vh] flex items-center bg-gradient-to-br from-primary/10 via-background to-green-500/10 dark:from-primary/5 dark:to-green-500/5 transition-all duration-700 ${heroRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-6 bg-primary/20 text-primary border-primary/30">
                <Store className="w-4 h-4 mr-2" />
                Para Lojas de Bairro e Comércio Local
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Sua Loja do Bairro Agora{' '}
                <span className="text-primary">Alcança a Cidade Inteira</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Pare de perder clientes para as grandes redes. Seus vizinhos querem comprar de você, 
                mas não te encontram online. Mude isso agora.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link to="/signup">
                  <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                    <Rocket className="w-5 h-5 mr-2" />
                    Criar Minha Loja Online
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6"
                  onClick={() => scrollToSection('solucao')}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Ver Como Funciona
                </Button>
              </div>

              {/* Stats rápidos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: '73%', label: 'pesquisam online antes de comprar local' },
                  { value: '46%', label: 'das buscas têm intenção local' },
                  { value: '78%', label: 'compram em 24h após busca mobile' },
                  { value: '100x', label: 'mais alcance com loja online' },
                ].map((stat, index) => (
                  <div key={index} className="bg-card/50 dark:bg-card/30 backdrop-blur-sm rounded-xl p-4 border border-border">
                    <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Seção 1: A Dor do Lojista */}
        <section 
          id="dor" 
          ref={dorRef.ref}
          className={`py-20 bg-destructive/5 dark:bg-destructive/10 transition-all duration-700 ${dorRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="destructive" className="mb-4">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Realidade do Comércio Local
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                As Dores do Lojista Local
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Você se identifica com alguma dessas situações?
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                {
                  icon: Building2,
                  title: 'Grandes redes dominam',
                  description: 'Magazine Luiza, Americanas, Amazon entregam no mesmo dia e roubam seus clientes',
                  color: 'text-red-500'
                },
                {
                  icon: Search,
                  title: 'Cliente pesquisa online',
                  description: '"Loja de roupas perto de mim" - você não aparece nos resultados',
                  color: 'text-orange-500'
                },
                {
                  icon: TrendingUp,
                  title: 'Menos movimento na rua',
                  description: 'Cada vez menos gente passeia no comércio, preferem comprar de casa',
                  color: 'text-yellow-500'
                },
                {
                  icon: DollarSign,
                  title: 'Custos fixos altos',
                  description: 'Aluguel, funcionário, luz... e vendas caindo mês a mês',
                  color: 'text-red-500'
                },
                {
                  icon: Users,
                  title: 'Clientes antigos sumindo',
                  description: 'Foram pro online e você nem tem WhatsApp deles para resgatar',
                  color: 'text-orange-500'
                },
                {
                  icon: Clock,
                  title: 'Horário limitado',
                  description: 'Loja fecha às 19h, cliente compra na Amazon às 23h',
                  color: 'text-yellow-500'
                },
                {
                  icon: MapPin,
                  title: 'Só vende pro bairro',
                  description: 'Cliente do bairro vizinho nem sabe que você existe',
                  color: 'text-red-500'
                },
              ].map((dor, index) => {
                const Icon = dor.icon;
                return (
                  <Card key={index} className="bg-card border-destructive/20 hover:border-destructive/40 transition-all duration-300 hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4`}>
                        <Icon className={`w-6 h-6 ${dor.color}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{dor.title}</h3>
                      <p className="text-muted-foreground text-sm">{dor.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Estatísticas de impacto */}
            <div className="mt-12 bg-destructive/10 rounded-2xl p-8 max-w-4xl mx-auto">
              <h3 className="text-xl font-semibold text-center text-foreground mb-6">
                📊 Dados que comprovam a urgência
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  '73% dos consumidores pesquisam online antes de comprar localmente',
                  '46% das buscas no Google têm intenção local ("perto de mim")',
                  '78% das buscas mobile locais resultam em compra em 24 horas',
                  'Pequenos varejistas perderam 30% de vendas para e-commerce em 5 anos',
                ].map((stat, index) => (
                  <div key={index} className="flex items-start gap-3 bg-background/50 rounded-lg p-4">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{stat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Seção 2: Sua Loja Online - A Solução */}
        <section 
          id="solucao" 
          ref={solucaoRef.ref}
          className={`py-20 bg-green-500/5 dark:bg-green-500/10 transition-all duration-700 ${solucaoRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-500/20 text-green-600 border-green-500/30">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                A Solução
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Sua Loja Online Profissional
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Tudo que você precisa para competir com as grandes redes
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                {
                  icon: Globe,
                  title: 'Alcance a cidade inteira',
                  description: 'Não só o bairro, toda a região te encontra online',
                },
                {
                  icon: Search,
                  title: 'Apareça nas buscas',
                  description: 'Cliente pesquisa → Sua loja aparece no Google',
                },
                {
                  icon: Clock,
                  title: 'Venda 24 horas',
                  description: 'Loja fecha às 19h, site vende às 23h',
                },
                {
                  icon: Store,
                  title: 'Retire na loja',
                  description: 'Cliente compra online, retira com você',
                },
                {
                  icon: Users,
                  title: 'Fidelize clientes',
                  description: 'Base de dados com todos que compraram',
                },
                {
                  icon: Building2,
                  title: 'Concorra com grandes',
                  description: 'Sua loja profissional como Magazine Luiza',
                },
                {
                  icon: DollarSign,
                  title: 'Custos previsíveis',
                  description: 'Mensalidade fixa, sem taxa por venda',
                },
              ].map((beneficio, index) => {
                const Icon = beneficio.icon;
                return (
                  <Card key={index} className="bg-card border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-green-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{beneficio.title}</h3>
                      <p className="text-muted-foreground text-sm">{beneficio.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Seção 3: Catálogo Digital por Tipo de Loja */}
        <section 
          id="catalogo" 
          ref={catalogoRef.ref}
          className={`py-20 bg-background transition-all duration-700 ${catalogoRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">
                <Package className="w-4 h-4 mr-2" />
                Catálogo Inteligente
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Catálogo Digital Para Cada Tipo de Loja
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Sistema adaptado para qualquer segmento do varejo
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                {
                  icon: Shirt,
                  title: 'Loja de Roupas e Moda',
                  color: 'bg-pink-500/10 text-pink-500',
                  features: [
                    'Tamanhos: PP ao Plus Size',
                    'Cores com fotos reais',
                    'Categorias: Feminino, Masculino, Infantil',
                    'Variações de estampa'
                  ]
                },
                {
                  icon: Tv,
                  title: 'Loja de Eletrônicos',
                  color: 'bg-blue-500/10 text-blue-500',
                  features: [
                    'Ficha técnica completa',
                    'Voltagem: 110V, 220V, Bivolt',
                    'Garantia informada',
                    'Acessórios compatíveis'
                  ]
                },
                {
                  icon: Home,
                  title: 'Loja de Casa e Decoração',
                  color: 'bg-amber-500/10 text-amber-500',
                  features: [
                    'Dimensões dos produtos',
                    'Cores disponíveis',
                    'Materiais (madeira, MDF, metal)',
                    'Fotos ambientadas'
                  ]
                },
                {
                  icon: Baby,
                  title: 'Loja de Brinquedos',
                  color: 'bg-purple-500/10 text-purple-500',
                  features: [
                    'Faixa etária recomendada',
                    'Categorias: Educativo, Bonecas, Carrinhos',
                    'Fotos da caixa e produto',
                    'Selo do INMETRO'
                  ]
                },
                {
                  icon: Pill,
                  title: 'Farmácia/Perfumaria',
                  color: 'bg-green-500/10 text-green-500',
                  features: [
                    'Produtos de higiene e beleza',
                    'Categorias organizadas',
                    'Promoções destacadas',
                    'Marcas em destaque'
                  ]
                },
                {
                  icon: Wrench,
                  title: 'Loja de Ferramentas',
                  color: 'bg-orange-500/10 text-orange-500',
                  features: [
                    'Especificações técnicas',
                    'Voltagem/Potência',
                    'Aplicações',
                    'Kits e combos'
                  ]
                },
              ].map((loja, index) => {
                const Icon = loja.icon;
                return (
                  <Card key={index} className="bg-card hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-xl ${loja.color.split(' ')[0]} flex items-center justify-center mb-4`}>
                        <Icon className={`w-6 h-6 ${loja.color.split(' ')[1]}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">{loja.title}</h3>
                      <ul className="space-y-2">
                        {loja.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Seção 4: Pedidos pelo WhatsApp */}
        <section 
          id="whatsapp" 
          ref={whatsappRef.ref}
          className={`py-20 bg-green-500/5 transition-all duration-700 ${whatsappRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-500/20 text-green-600 border-green-500/30">
                <MessageCircle className="w-4 h-4 mr-2" />
                Integração WhatsApp
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Pedidos Direto no Seu WhatsApp
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Cliente escolhe no catálogo, você recebe no WhatsApp que já usa
              </p>
            </div>

            {/* Fluxo visual */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {[
                  { icon: Eye, label: 'Cliente vê catálogo', color: 'bg-blue-500' },
                  { icon: ShoppingCart, label: 'Escolhe produtos', color: 'bg-purple-500' },
                  { icon: MessageCircle, label: 'Envia no WhatsApp', color: 'bg-green-500' },
                  { icon: CheckCircle2, label: 'Você confirma', color: 'bg-orange-500' },
                  { icon: Package, label: 'Cliente retira/recebe', color: 'bg-primary' },
                ].map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={index} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mb-2`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-sm text-center text-foreground font-medium">{step.label}</span>
                      </div>
                      {index < 4 && (
                        <ChevronRight className="w-6 h-6 text-muted-foreground mx-2 hidden md:block" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="bg-card">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-4">Como funciona:</h3>
                  <ul className="space-y-3">
                    {[
                      'Cliente escolhe no catálogo online',
                      'Pedido formatado vai pro seu WhatsApp',
                      'Você confirma estoque e disponibilidade',
                      'Combina: entrega OU retirada na loja',
                      'Pagamento como você já faz: PIX, cartão, dinheiro',
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3 text-muted-foreground">
                        <span className="w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-4">💬 Exemplo de mensagem:</h3>
                  <div className="bg-background rounded-lg p-4 font-mono text-sm">
                    <p className="text-green-600 mb-2">🛒 *Novo Pedido #1234*</p>
                    <p className="text-muted-foreground">👤 Maria Silva</p>
                    <p className="text-muted-foreground">📱 (61) 98888-7777</p>
                    <p className="text-muted-foreground mt-2">📦 *Itens:*</p>
                    <p className="text-muted-foreground">• Vestido Floral M - R$ 89,90</p>
                    <p className="text-muted-foreground">• Bolsa Couro - R$ 149,90</p>
                    <p className="text-foreground font-bold mt-2">💰 Total: R$ 239,80</p>
                    <p className="text-muted-foreground mt-2">🏪 Retirada na loja</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Seção 5: Base de Clientes */}
        <section 
          id="clientes" 
          ref={clientesRef.ref}
          className={`py-20 bg-background transition-all duration-700 ${clientesRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">
                <Users className="w-4 h-4 mr-2" />
                CRM Integrado
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Construa Sua Base de Clientes
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Todo cliente que compra fica cadastrado automaticamente
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: Users,
                  title: 'Cadastro automático',
                  description: 'Nome, telefone, endereço e histórico de compras',
                },
                {
                  icon: Tag,
                  title: 'Segmentação',
                  description: '"Clientes de roupas femininas", "Compradores frequentes"',
                },
                {
                  icon: Megaphone,
                  title: 'Ações direcionadas',
                  description: '"Chegou coleção nova! Avisar clientes interessados"',
                },
                {
                  icon: Gift,
                  title: 'Aniversariantes',
                  description: '"Parabéns! 10% de desconto pra você"',
                },
                {
                  icon: TrendingUp,
                  title: 'Histórico completo',
                  description: 'Saiba o que cada cliente já comprou',
                },
                {
                  icon: MessageCircle,
                  title: 'WhatsApp Marketing',
                  description: 'Envie promoções e novidades em massa',
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} className="bg-card hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-12 bg-primary/10 rounded-2xl p-8 max-w-3xl mx-auto text-center">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <p className="text-xl font-semibold text-foreground">
                "Lojistas com base de clientes vendem <span className="text-primary">40% mais</span> em datas comemorativas"
              </p>
            </div>
          </div>
        </section>

        {/* Seção 6: Divulgação */}
        <section 
          id="divulgacao" 
          ref={divulgacaoRef.ref}
          className={`py-20 bg-muted/30 dark:bg-muted/10 transition-all duration-700 ${divulgacaoRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">
                <Megaphone className="w-4 h-4 mr-2" />
                Divulgação Fácil
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Divulgação que Funciona
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Ferramentas simples para você divulgar sua loja
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: Globe,
                  title: 'Link único',
                  description: 'sualoja.mostralo.com.br - fácil de compartilhar',
                },
                {
                  icon: Globe,
                  title: 'Domínio próprio',
                  description: 'www.sualoja.com.br - se preferir',
                },
                {
                  icon: QrCode,
                  title: 'QR Code',
                  description: 'Na vitrine, cartão de visitas, sacolas',
                },
                {
                  icon: Instagram,
                  title: 'Redes sociais',
                  description: 'Compartilha no Instagram, Facebook, WhatsApp',
                },
                {
                  icon: MessageCircle,
                  title: 'Status WhatsApp',
                  description: '"Poste no status: Novidades no site!"',
                },
                {
                  icon: Megaphone,
                  title: 'Marketing Digital',
                  description: 'Gestão de redes sociais incluída',
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} className="bg-card hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Seção 7: Google & Instagram Shopping - DESTAQUE */}
        <section 
          id="shopping" 
          ref={shoppingRef.ref}
          className={`py-20 bg-gradient-to-br from-primary/10 via-background to-pink-500/10 dark:from-primary/5 dark:to-pink-500/5 transition-all duration-700 ${shoppingRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-gradient-to-r from-primary to-pink-500 text-white border-0">
                <Star className="w-4 h-4 mr-2" />
                EXCLUSIVO MOSTRALO
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Apareça no Google e Instagram Shopping
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Seus produtos nas maiores vitrines do mundo - com <span className="text-primary font-bold">R$ 0 de taxa</span>
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
              {/* Google Shopping */}
              <Card className="bg-card border-2 border-blue-500/30 hover:border-blue-500/50 transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                      <Search className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">Google Shopping</h3>
                      <p className="text-blue-500">Feed XML automático</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-6">
                    {[
                      'Cliente pesquisa "loja de roupas [sua cidade]"',
                      'Seus produtos aparecem com foto e preço',
                      'Link direto para seu catálogo',
                      'Feed XML gerado automaticamente',
                      'R$ 0 de taxa por clique (diferente de anúncios)',
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3 text-muted-foreground">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="bg-blue-500/10 rounded-xl p-4">
                    <p className="text-sm text-foreground">
                      <span className="font-bold">📊 Dado:</span> 46% das buscas no Google são locais. 
                      "Perto de mim" cresceu <span className="text-blue-500 font-bold">900%</span> nos últimos anos.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Instagram Shopping */}
              <Card className="bg-card border-2 border-pink-500/30 hover:border-pink-500/50 transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center">
                      <Instagram className="w-8 h-8 text-pink-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">Instagram Shopping</h3>
                      <p className="text-pink-500">Feed CSV automático</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-6">
                    {[
                      'Marque produtos nas fotos com etiqueta de preço',
                      'Cliente toca → vê preço → compra',
                      'Catálogo integrado com Facebook/Meta',
                      'Feed CSV gerado automaticamente',
                      'Venda direto pelo Instagram Stories',
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3 text-muted-foreground">
                        <CheckCircle2 className="w-5 h-5 text-pink-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="bg-pink-500/10 rounded-xl p-4">
                    <p className="text-sm text-foreground">
                      <span className="font-bold">📊 Dado:</span> <span className="text-pink-500 font-bold">130 milhões</span> de pessoas 
                      tocam tags de produto no Instagram por mês.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
              {[
                { value: '46%', label: 'buscas locais', icon: Search },
                { value: '900%', label: 'crescimento "perto de mim"', icon: TrendingUp },
                { value: '70%', label: 'visitam loja após busca', icon: Store },
                { value: '130M', label: 'tocam tags/mês', icon: MousePointer },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-card rounded-xl p-4 text-center border border-border">
                    <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Diferencial */}
            <div className="bg-gradient-to-r from-primary/20 to-pink-500/20 rounded-2xl p-8 max-w-4xl mx-auto">
              <h3 className="text-xl font-bold text-center text-foreground mb-6">
                💰 Diferencial Competitivo
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <XCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
                  <p className="font-semibold text-foreground">Marketplaces</p>
                  <p className="text-destructive font-bold text-xl">15-20% por venda</p>
                </div>
                <div className="text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-foreground">Mostralo</p>
                  <p className="text-green-500 font-bold text-xl">R$ 0 de taxa</p>
                </div>
                <div className="text-center">
                  <Heart className="w-12 h-12 text-primary mx-auto mb-2" />
                  <p className="font-semibold text-foreground">Seus clientes</p>
                  <p className="text-primary font-bold text-xl">São SEUS!</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 8: Venda 24 Horas */}
        <section 
          id="horarios" 
          ref={horariosRef.ref}
          className={`py-20 bg-background transition-all duration-700 ${horariosRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">
                <Clock className="w-4 h-4 mr-2" />
                Vendas 24/7
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Venda Fora do Horário da Loja
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Sua loja fecha, mas seu site não dorme
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="bg-card">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-4">⏰ Como funciona:</h3>
                  <ul className="space-y-3">
                    {[
                      'Sua loja fecha às 19h',
                      'Cliente vê seu site às 22h',
                      'Faz o pedido, você vê de manhã',
                      'Separa e avisa: "Pronto pra retirar!"',
                      'Ou entrega no mesmo dia',
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3 text-muted-foreground">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-4">💬 Exemplo real:</h3>
                  <div className="bg-background rounded-lg p-4">
                    <Quote className="w-8 h-8 text-primary mb-3" />
                    <p className="text-foreground italic">
                      "Fechei a loja às 19h. Às 21h recebi pedido de R$ 350. 
                      Cliente retirou no outro dia às 10h. Venda que eu teria perdido!"
                    </p>
                    <p className="text-muted-foreground text-sm mt-3">- Ana, loja de roupas</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Seção 9: Retire na Loja (Click & Collect) */}
        <section 
          id="retire" 
          ref={retireRef.ref}
          className={`py-20 bg-green-500/5 transition-all duration-700 ${retireRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-500/20 text-green-600 border-green-500/30">
                <Store className="w-4 h-4 mr-2" />
                Click & Collect
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Retire na Loja
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                O melhor dos dois mundos: conveniência online + experiência presencial
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-6">Como funciona:</h3>
                <div className="space-y-4">
                  {[
                    { icon: Smartphone, text: 'Cliente compra online com calma' },
                    { icon: Store, text: 'Escolhe: "Quero retirar na loja"' },
                    { icon: Package, text: 'Você separa e avisa quando estiver pronto' },
                    { icon: CheckCircle2, text: 'Cliente passa, retira, sem fila' },
                    { icon: Heart, text: 'Economia no frete = cliente mais satisfeito' },
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={index} className="flex items-center gap-4 bg-card rounded-lg p-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-foreground">{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Card className="bg-card">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-6">✅ Benefícios:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: DollarSign, title: 'Cliente economiza', desc: 'Sem frete' },
                      { icon: Zap, title: 'Você economiza', desc: 'Sem entregador' },
                      { icon: ShoppingCart, title: 'Venda cruzada', desc: 'Leva mais coisa' },
                      { icon: Users, title: 'Fluxo na loja', desc: 'Mais movimento' },
                    ].map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div key={index} className="bg-green-500/10 rounded-lg p-4 text-center">
                          <Icon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <p className="font-semibold text-foreground text-sm">{item.title}</p>
                          <p className="text-muted-foreground text-xs">{item.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Seção 10: Fidelização */}
        <section 
          id="fidelizacao" 
          ref={fidelizacaoRef.ref}
          className={`py-20 bg-background transition-all duration-700 ${fidelizacaoRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">
                <Heart className="w-4 h-4 mr-2" />
                Fidelização
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Fidelização de Clientes
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Ferramentas para fazer o cliente voltar sempre
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: Percent, title: 'Cupons de desconto', desc: 'Para segunda compra' },
                { icon: Star, title: 'Programa de pontos', desc: '"Comprou 5x? 15% off na próxima"' },
                { icon: MessageCircle, title: 'Promoções WhatsApp', desc: 'Exclusivas por mensagem' },
                { icon: Users, title: 'Indicação', desc: '"Indique amigo, ganhe desconto"' },
                { icon: Gift, title: 'Aniversariantes', desc: 'Mimo especial no aniversário' },
                { icon: Calendar, title: 'Datas especiais', desc: 'Dia das Mães, Namorados...' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} className="bg-card hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-pink-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Seção 11: Pagamentos */}
        <section 
          id="pagamentos" 
          ref={pagamentosRef.ref}
          className={`py-20 bg-muted/30 dark:bg-muted/10 transition-all duration-700 ${pagamentosRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">
                <CreditCard className="w-4 h-4 mr-2" />
                Pagamentos
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Pagamentos Flexíveis
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Receba como você já recebe - sem mudar nada
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {[
                { icon: Zap, title: 'PIX', desc: 'Instantâneo' },
                { icon: CreditCard, title: 'Cartão', desc: 'Na maquininha' },
                { icon: DollarSign, title: 'Dinheiro', desc: 'Na retirada' },
                { icon: Calendar, title: 'Parcelado', desc: 'Sua maquininha' },
                { icon: Globe, title: 'Link', desc: 'Se preferir' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} className="bg-card text-center">
                    <CardContent className="p-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="text-muted-foreground text-xs">{item.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Seção 12: Fotos que Vendem */}
        <section 
          id="fotos" 
          ref={fotosRef.ref}
          className={`py-20 bg-background transition-all duration-700 ${fotosRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">
                <Camera className="w-4 h-4 mr-2" />
                Fotos
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Fotos que Vendem
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Dicas simples para fotos que convertem
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: Smartphone, title: 'Use seu celular', desc: 'Não precisa de câmera profissional' },
                { icon: Eye, title: 'Fundo neutro', desc: 'Branco ou claro funciona bem' },
                { icon: Zap, title: 'Boa luz', desc: 'Luz natural é a melhor' },
                { icon: Camera, title: 'Múltiplas fotos', desc: 'Frente, verso, detalhe, etiqueta' },
                { icon: Home, title: 'Fotos ambientadas', desc: 'Produto em uso vende mais' },
                { icon: Star, title: 'Autenticidade', desc: '"Produto real > foto genérica"' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} className="bg-card hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-purple-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Seção 13: Localização */}
        <section 
          id="localizacao" 
          ref={localizacaoRef.ref}
          className={`py-20 bg-muted/30 dark:bg-muted/10 transition-all duration-700 ${localizacaoRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">
                <MapPin className="w-4 h-4 mr-2" />
                Localização
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Sua Localização no Mapa
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Cliente encontra você facilmente
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: MapPin, title: 'Endereço completo', desc: 'Com mapa integrado' },
                { icon: Clock, title: 'Horário', desc: 'De funcionamento' },
                { icon: Navigation, title: 'Referências', desc: 'Pontos conhecidos' },
                { icon: Building2, title: 'Como chegar', desc: 'Metrô, ônibus, carro' },
                { icon: Globe, title: 'Google Maps', desc: 'Link direto' },
                { icon: Navigation, title: 'Waze', desc: 'Navegação rápida' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} className="bg-card hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Seção 14: Multi-Bairros */}
        <section 
          id="multibairros" 
          ref={multiBairrosRef.ref}
          className={`py-20 bg-gradient-to-br from-primary/10 to-green-500/10 dark:from-primary/5 dark:to-green-500/5 transition-all duration-700 ${multiBairrosRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">
                <Building2 className="w-4 h-4 mr-2" />
                Expansão
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Alcance Multi-Bairros
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Saia do bairro e alcance a cidade inteira
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
              <Card className="bg-card text-center">
                <CardContent className="p-6">
                  <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Loja física</h3>
                  <p className="text-3xl font-bold text-muted-foreground">1 bairro</p>
                  <p className="text-muted-foreground text-sm">~5.000 pessoas</p>
                </CardContent>
              </Card>

              <Card className="bg-card text-center border-2 border-primary">
                <CardContent className="p-6">
                  <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Loja online</h3>
                  <p className="text-3xl font-bold text-primary">Cidade inteira</p>
                  <p className="text-muted-foreground text-sm">~500.000 pessoas</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 text-center border-green-500/30">
                <CardContent className="p-6">
                  <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Potencial</h3>
                  <p className="text-3xl font-bold text-green-500">100x</p>
                  <p className="text-muted-foreground text-sm">mais alcance</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-card rounded-2xl p-8 max-w-3xl mx-auto">
              <h3 className="text-xl font-semibold text-center text-foreground mb-6">
                🚚 Opções de entrega
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: Package, title: 'Entrega própria', desc: 'Você mesmo entrega' },
                  { icon: Users, title: 'Entregadores parceiros', desc: 'Cadastre entregadores' },
                  { icon: Store, title: 'Retire na loja', desc: 'Sem custo de entrega' },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="text-center p-4 bg-muted/50 rounded-lg">
                      <Icon className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="font-semibold text-foreground text-sm">{item.title}</p>
                      <p className="text-muted-foreground text-xs">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 text-center">
              <Quote className="w-8 h-8 text-primary mx-auto mb-4" />
              <p className="text-lg italic text-foreground max-w-2xl mx-auto">
                "Cliente do outro lado da cidade me descobriu pelo Google! 
                Nem sabia que tinha loja assim aqui."
              </p>
              <p className="text-muted-foreground text-sm mt-2">- Carlos, loja de eletrônicos</p>
            </div>
          </div>
        </section>

        {/* Seção 15: Comparativo */}
        <section 
          id="comparativo" 
          ref={comparativoRef.ref}
          className={`py-20 bg-background transition-all duration-700 ${comparativoRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">
                <BarChart3 className="w-4 h-4 mr-2" />
                Comparativo
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Antes x Depois do Mostralo
              </h2>
            </div>

            <div className="max-w-4xl mx-auto overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 text-foreground">Situação</th>
                    <th className="text-center py-4 px-4 text-destructive">Sem Mostralo</th>
                    <th className="text-center py-4 px-4 text-green-500">Com Mostralo</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { situacao: 'Alcance', sem: 'Só quem passa na rua', com: 'Cidade inteira' },
                    { situacao: 'Horário de vendas', sem: '9h às 19h', com: '24 horas' },
                    { situacao: 'Cliente pesquisa online', sem: 'Vai pra Amazon', com: 'Encontra SUA loja' },
                    { situacao: 'Base de clientes', sem: 'Caderninho ou nada', com: 'Sistema completo' },
                    { situacao: 'Google Shopping', sem: '❌ Não aparece', com: '✅ Produtos nas buscas' },
                    { situacao: 'Instagram Shopping', sem: '❌ Não tem', com: '✅ Tags de preço' },
                    { situacao: 'Retire na loja', sem: '❌ Não oferece', com: '✅ Click & Collect' },
                    { situacao: 'Pós-venda', sem: 'Depende do cliente voltar', com: 'WhatsApp automático' },
                  ].map((row, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-4 px-4 font-medium text-foreground">{row.situacao}</td>
                      <td className="py-4 px-4 text-center text-muted-foreground">{row.sem}</td>
                      <td className="py-4 px-4 text-center text-green-500 font-medium">{row.com}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Seção 16: Depoimentos */}
        <section 
          id="depoimentos" 
          ref={depoimentosRef.ref}
          className={`py-20 bg-muted/30 dark:bg-muted/10 transition-all duration-700 ${depoimentosRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">
                <Quote className="w-4 h-4 mr-2" />
                Depoimentos
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                O que Dizem Nossos Lojistas
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                {
                  quote: 'Minha loja de roupas vendia só pro bairro. Agora atendo 3 cidades vizinhas!',
                  author: 'Maria',
                  business: 'Loja de Moda',
                  icon: Shirt
                },
                {
                  quote: 'Cliente me encontrou no Google pesquisando "perfumaria [cidade]". Vendeu R$ 800!',
                  author: 'João',
                  business: 'Perfumaria',
                  icon: Star
                },
                {
                  quote: 'Retire na loja virou meu diferencial. Cliente compra online e ainda leva mais coisa quando vem buscar.',
                  author: 'Ana',
                  business: 'Papelaria',
                  icon: Package
                },
                {
                  quote: 'Fechava às 19h e perdia vendas. Agora recebo pedidos até meia-noite.',
                  author: 'Carlos',
                  business: 'Eletrônicos',
                  icon: Tv
                },
              ].map((depoimento, index) => {
                const Icon = depoimento.icon;
                return (
                  <Card key={index} className="bg-card">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <Quote className="w-6 h-6 text-primary mb-2" />
                          <p className="text-foreground italic mb-4">"{depoimento.quote}"</p>
                          <p className="text-muted-foreground text-sm">
                            <span className="font-semibold text-foreground">{depoimento.author}</span> - {depoimento.business}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Seção 17: Calculadora de Economia */}
        <section 
          id="economia" 
          ref={economiaRef.ref}
          className={`py-20 bg-gradient-to-br from-green-500/10 to-primary/10 transition-all duration-700 ${economiaRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-500/20 text-green-600 border-green-500/30">
                <Calculator className="w-4 h-4 mr-2" />
                Calculadora
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Quanto Você Economiza?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Compare o custo de marketplaces com o Mostralo
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="bg-card">
                <CardContent className="p-8">
                  <div className="mb-8">
                    <label className="block text-foreground font-medium mb-4">
                      Seu faturamento mensal (se vendesse em marketplace):
                    </label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={faturamento}
                        onValueChange={setFaturamento}
                        max={50000}
                        min={5000}
                        step={1000}
                        className="flex-1"
                      />
                      <span className="text-2xl font-bold text-primary min-w-[140px] text-right">
                        R$ {faturamento[0].toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Marketplace */}
                    <div className="bg-destructive/10 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-destructive mb-4 flex items-center gap-2">
                        <XCircle className="w-6 h-6" />
                        No Marketplace
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taxa média (18%):</span>
                          <span className="text-destructive font-bold">
                            R$ {taxaMarketplace.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taxa de frete (4%):</span>
                          <span className="text-destructive font-bold">
                            R$ {taxaFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="border-t border-destructive/30 pt-3 flex justify-between">
                          <span className="font-semibold text-foreground">Total de taxas:</span>
                          <span className="text-destructive font-bold text-xl">
                            R$ {totalTaxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mostralo */}
                    <div className="bg-green-500/10 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-green-500 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6" />
                        Com Mostralo
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mensalidade:</span>
                          <span className="text-green-500 font-bold">
                            R$ {mensalidadeMostralo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taxas por venda:</span>
                          <span className="text-green-500 font-bold">R$ 0</span>
                        </div>
                        <div className="border-t border-green-500/30 pt-3 flex justify-between">
                          <span className="font-semibold text-foreground">Total:</span>
                          <span className="text-green-500 font-bold text-xl">
                            R$ {mensalidadeMostralo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resultado */}
                  {economia > 0 && (
                    <div className="mt-8 bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white text-center">
                      <h3 className="text-2xl font-bold mb-2">💰 SUA ECONOMIA</h3>
                      <div className="text-4xl font-bold mb-2">
                        R$ {economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                      </div>
                      <div className="text-xl opacity-90">
                        = R$ {economiaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano
                      </div>
                    </div>
                  )}

                  <p className="text-center text-muted-foreground mt-6">
                    💡 "Com apenas 5 vendas extras por mês, você já paga o investimento!"
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Seção 18: CTA Final */}
        <section 
          id="cta" 
          ref={ctaRef.ref}
          className={`py-20 bg-gradient-to-br from-primary via-primary/90 to-green-600 transition-all duration-700 ${ctaRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <Badge className="mb-6 bg-white/20 text-white border-white/30">
                <Rocket className="w-4 h-4 mr-2" />
                Comece Agora
              </Badge>
              
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Pronto Para Transformar Sua Loja?
              </h2>
              
              <p className="text-xl text-white/80 mb-8">
                Junte-se a centenas de lojistas que já estão vendendo mais com o Mostralo
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link to="/signup">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6 w-full sm:w-auto">
                    <Rocket className="w-5 h-5 mr-2" />
                    Criar Minha Loja Online
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 bg-transparent border-white text-white hover:bg-white/10"
                  onClick={() => window.open(getWhatsAppLink('lojistas'), '_blank')}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Falar com Consultor
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>7 dias para testar</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Suporte no WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Não gostou? Devolvemos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Copiar Texto */}
        <section className="py-8 bg-muted/30 dark:bg-muted/10">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-semibold text-foreground">Usar com IA</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Copie todo o conteúdo para usar em prompts de IA como ChatGPT ou Claude.
                </p>
                <Button onClick={copyPageText} variant={copied ? "secondary" : "outline"}>
                  {copied ? (
                    <><Check className="h-4 w-4 text-green-600 mr-2" /> Texto Copiado!</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-2" /> Copiar Todo o Texto</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-card border-t border-border py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">Mostralo</span>
              </div>
              
              <nav className="flex flex-wrap items-center justify-center gap-6">
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Início
                </Link>
                <Link to="/funcionalidades" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Funcionalidades
                </Link>
                <Link to="/para-feirantes" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Para Feirantes
                </Link>
                <Link to="/para-lojistas" className="text-primary font-medium text-sm">
                  Para Lojistas
                </Link>
              </nav>

              <p className="text-muted-foreground text-sm">
                © {new Date().getFullYear()} Mostralo. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LojistasLocaisPage;
