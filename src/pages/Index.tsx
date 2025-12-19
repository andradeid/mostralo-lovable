import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { usePageSEO } from '@/hooks/useSEO';
import { CookieBanner } from '@/components/CookieBanner';
import { PrivacyConsent } from '@/components/PrivacyConsent';
import { DashboardFooter } from '@/components/admin/DashboardFooter';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCountUp } from '@/hooks/useCountUp';
import WhatsAppMockup from '@/components/WhatsAppMockup';
import { PromotionBanner } from '@/components/coupons/PromotionBanner';
import { WhatsAppMarketingSection } from '@/components/landing/WhatsAppMarketingSection';
import { FinancialAutomationSection } from '@/components/landing/FinancialAutomationSection';
import { WhatsAppLeadButton } from '@/components/leads/WhatsAppLeadButton';
import { 
  Store, 
  TrendingDown,
  TrendingUp,
  DollarSign,
  Users,
  Database,
  Lock,
  MessageCircle,
  Check,
  ArrowRight,
  Bot,
  Zap,
  MapPin,
  Printer,
  Clock,
  Star,
  ChefHat,
  BarChart3,
  Package,
  Smartphone,
  Palette,
  Shield,
  CreditCard,
  Bike,
  X,
  AlertTriangle,
  Calculator,
  Sparkles,
  CheckCircle,
  Tag,
  Gift,
  Truck,
  Percent,
  Target,
  Menu,
  Briefcase,
  Wallet,
  Image as ImageIcon,
  Utensils,
  Code,
  QrCode
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';

interface PlanModule {
  module_id: string;
  modules: {
    name: string;
    icon: string | null;
    key: string | null;
  };
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_cycle: string;
  status: string;
  is_popular?: boolean;
  features: any;
  promotion_active?: boolean;
  discount_price?: number | null;
  discount_percentage?: number | null;
  promotion_start_date?: string | null;
  promotion_end_date?: string | null;
  promotion_label?: string | null;
  plan_modules?: PlanModule[];
}

const Index = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [monthlyRevenue, setMonthlyRevenue] = useState(10000);
  const [revenueInput, setRevenueInput] = useState('10000');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // 🔒 PROTEÇÃO: Cliente NUNCA deve ver dashboard - apenas lojistas
  useEffect(() => {
    if (authLoading) return; // Aguardar carregamento
    
    // Se não há usuário, tudo ok (página pública)
    if (!user) return;
    
    // Se é cliente, garantir que NÃO redireciona para dashboard
    if (userRole === 'customer') {
      console.log('✅ Cliente detectado - mantendo na página pública');
      return; // Cliente fica na página pública
    }
    
    // Se é lojista/admin e está na página principal, redirecionar para dashboard
    if (userRole === 'store_admin' || userRole === 'master_admin') {
      console.log('✅ Lojista/Admin detectado - redirecionando para dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // Se é entregador, redirecionar para painel de entregador
    if (userRole === 'delivery_driver') {
      console.log('✅ Entregador detectado - redirecionando para painel');
      navigate('/delivery-panel', { replace: true });
      return;
    }
  }, [user, userRole, authLoading, navigate]);

  usePageSEO({
    title: 'Mostralo - Pare de Financiar o iFood com Seus Clientes | Sistema de Delivery Próprio',
    description: 'Cada pedido no marketplace constrói o negócio deles, não o seu. Economize até R$ 90.000/ano e tenha 100% dos seus clientes e dados.',
    keywords: 'alternativa ifood, sistema delivery próprio, economizar taxas delivery, cardápio digital sem taxa, delivery sem comissão, parar de pagar ifood',
    image: '/favicon.png'
  });

  const marketplaceFeePercentage = 25;
  const mostraloPlan = 397.90;
  
  const marketplaceFeeMonthly = monthlyRevenue * (marketplaceFeePercentage / 100);
  const marketplaceFeeYearly = marketplaceFeeMonthly * 12;
  const mostraloYearly = mostraloPlan * 12;
  const savingsYearly = marketplaceFeeYearly - mostraloYearly;
  const savingsPercentage = ((savingsYearly / marketplaceFeeYearly) * 100).toFixed(0);

  // Animação dos números
  const animatedSavings = useCountUp(savingsYearly, 2000);

  const handleRevenueChange = (value: number[]) => {
    setMonthlyRevenue(value[0]);
    setRevenueInput(value[0].toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setRevenueInput(value);
    const numValue = parseInt(value) || 0;
    if (numValue <= 100000) {
      setMonthlyRevenue(numValue);
    }
  };


  const problemsMarketplace = [
    {
      icon: Users,
      title: 'Você Paga Para Eles Crescerem',
      description: 'Suas taxas financiam marketing para trazer SEUS concorrentes para a plataforma. Você literalmente está pagando para aumentar a concorrência contra você.',
      impact: 'Crítico'
    },
    {
      icon: TrendingUp,
      title: 'Clientes Fiéis ao App, Não a Você',
      description: 'Cliente que compra pelo iFood é cliente DO IFOOD. Se amanhã eles te removerem, você perde tudo. Zero controle, zero segurança.',
      impact: 'Crítico'
    },
    {
      icon: Database,
      title: 'Seus Dados Vendidos aos Concorrentes',
      description: 'Marketplaces VENDEM insights sobre seu cardápio, preços e clientes para outros restaurantes. Sim, eles lucram duas vezes: com sua taxa E vendendo seus dados.',
      impact: 'Alto'
    }
  ];

  const economyFeatures = [
    {
      icon: DollarSign,
      title: '0% de Taxa por Pedido',
      description: 'Apenas R$ 397,90/mês fixo. Não importa se você fizer 10 ou 1000 pedidos.',
      highlight: true
    },
    {
      icon: Users,
      title: '100% dos Clientes são Seus',
      description: 'Todos os dados, contatos e histórico ficam com você. Para sempre.',
      highlight: true
    },
    {
      icon: BarChart3,
      title: 'Relatórios Completos com IA',
      description: 'Dashboard inteligente com análises preditivas e insights automáticos.',
      highlight: false
    },
    {
      icon: Shield,
      title: 'Independência Total',
      description: 'Não dependa de mudanças de regras, aumentos de taxa ou bloqueios.',
      highlight: false
    }
  ];

  const techFeatures = [
    {
      category: 'Atendimento Inteligente',
      items: [
        { icon: Bot, name: 'Chatbot IA no WhatsApp', description: 'Responde automaticamente, processa pedidos' },
        { icon: MessageCircle, name: 'Atendimento 24/7', description: 'Nunca perca um pedido, mesmo fechado' },
        { icon: Zap, name: 'Respostas Instantâneas', description: 'Cliente não espera, converte mais' }
      ]
    },
    {
      category: 'Gestão Profissional',
      items: [
        { icon: ChefHat, name: 'KDS para Cozinha', description: 'Display em tempo real na cozinha' },
        { icon: Clock, name: 'Kanban de Status', description: 'Visual de todos os pedidos' },
        { icon: BarChart3, name: 'Dashboard com IA', description: 'Insights e análises automáticas' },
        { icon: Printer, name: 'Impressão Automática', description: 'Pedido cai direto na impressora' }
      ]
    },
    {
      category: 'Delivery Completo',
      items: [
        { icon: Bike, name: 'App para Entregadores', description: 'Sistema completo de gestão' },
        { icon: MapPin, name: 'Frete Automático', description: 'Cálculo por distância real' },
        { icon: Package, name: 'Rastreamento ao Vivo', description: 'Cliente acompanha entrega' },
        { icon: CreditCard, name: 'Cálculo de Comissão', description: 'Gestão financeira entregadores' }
      ]
    },
    {
      category: 'Sua Marca',
      items: [
        { icon: Smartphone, name: 'Cardápio Personalizado', description: 'Com sua logo e cores' },
        { icon: Palette, name: 'Design Exclusivo', description: 'Interface com sua identidade' },
        { icon: Store, name: 'Domínio Próprio', description: 'seurestaurante.com.br' }
      ]
    }
  ];

  const testimonials = [
    {
      name: 'Carlos Mendes',
      business: 'Hamburgueria Premium',
      savings: 'R$ 84.000/ano',
      revenue: 'R$ 28.000/mês',
      text: 'Saí do iFood há 6 meses. Economizei R$ 84 mil por ano e agora tenho controle total dos meus clientes. Melhor decisão que já tomei.'
    },
    {
      name: 'Juliana Santos',
      business: 'Pizzaria Bella Napoli',
      savings: 'R$ 54.000/ano',
      revenue: 'R$ 18.000/mês',
      text: 'Pagava 25% de taxa e não tinha acesso aos dados dos meus clientes. Agora tenho meu próprio sistema e economizo mais de R$ 4 mil por mês.'
    },
    {
      name: 'Ricardo Oliveira',
      business: 'Sushi Express',
      savings: 'R$ 96.000/ano',
      revenue: 'R$ 32.000/mês',
      text: 'A IA do WhatsApp sozinha já paga o sistema. Responde clientes automaticamente e processa pedidos. Nunca mais volto para marketplace.'
    }
  ];

  const faqItems = [
    {
      question: 'Como vou atrair clientes sem o iFood?',
      answer: 'O iFood não traz clientes de graça. Você paga 25% POR CADA pedido. Com esse dinheiro, você pode investir em marketing próprio (Google Ads, Instagram, Facebook) e ter ROI muito melhor. Além disso, seus clientes ficarão com você, não com o marketplace.'
    },
    {
      question: 'E se eu tiver poucos pedidos no começo?',
      answer: 'Você paga apenas R$ 397,90/mês fixo. Se fizer 10 pedidos ou 1000, o custo é o mesmo. No iFood, com apenas 20 pedidos de R$ 50, você já paga R$ 250 de taxa. No Mostralo, R$ 397,90 fixo independente do volume.'
    },
    {
      question: 'O marketing digital realmente está incluso no preço?',
      answer: 'Sim! Todos os planos incluem gestão completa de redes sociais com 1 perfil, agendamento ilimitado de posts, IA para criar legendas profissionais, relatórios de performance e análise de concorrentes. Isso sozinho vale R$ 800-2.000/mês em agências.'
    },
    {
      question: 'Quantos perfis de redes sociais posso ter?',
      answer: '1 perfil de rede social está incluso em todos os planos com posts ilimitados. Você escolhe: Instagram, Facebook, TikTok, LinkedIn ou Google Meu Negócio. Precisa de mais perfis? Entre em contato com nosso comercial para condições especiais.'
    },
    {
      question: 'Preciso entender de marketing para usar?',
      answer: 'Não! Nossa IA cria legendas profissionais automaticamente, sugere os melhores horários para postar e até analisa o que seus concorrentes estão fazendo. Você só precisa aprovar e agendar. É tão simples quanto usar o Instagram.'
    },
    {
      question: 'Preciso ter conhecimento técnico?',
      answer: 'Zero conhecimento necessário. Sistema intuitivo, suporte 24/7, treinamento incluído. A IA faz o trabalho pesado. Você só precisa cadastrar seus produtos uma vez.'
    },
    {
      question: 'Como funciona a IA no WhatsApp?',
      answer: 'A IA conversa com seus clientes, tira dúvidas, mostra o cardápio, processa pedidos, calcula frete automaticamente. Tudo sozinha. Você só precisa preparar e entregar.'
    },
    {
      question: 'Posso continuar no iFood e usar o Mostralo?',
      answer: 'Sim! Muitos clientes começam usando os dois. Com o tempo, quando veem a economia e o controle que têm com o Mostralo, naturalmente migram 100% dos pedidos.'
    },
    {
      question: 'Qual o prazo de contrato?',
      answer: 'Sem prazo mínimo. Cancele quando quiser. Teste 7 dias grátis e veja a diferença. Sem taxa de setup, sem pegadinhas.'
    }
  ];

  const promotionTypes = [
    {
      icon: Gift,
      title: 'Primeira Compra',
      description: 'Conquiste novos clientes com descontos especiais na primeira compra',
      example: 'Ex: 15% OFF na primeira compra'
    },
    {
      icon: Truck,
      title: 'Frete Grátis',
      description: 'Incentive carrinho maior oferecendo frete grátis acima de X reais',
      example: 'Ex: Frete grátis acima de R$ 50'
    },
    {
      icon: Package,
      title: 'Leve 2 Pague 1',
      description: 'Promoções BOGO (Buy One Get One) para aumentar ticket',
      example: 'Ex: Compre 2 pizzas, leve 3'
    },
    {
      icon: Clock,
      title: 'Happy Hour',
      description: 'Descontos em horários específicos para aumentar movimento',
      example: 'Ex: 20% OFF das 17h às 19h'
    },
    {
      icon: Percent,
      title: 'Desconto %',
      description: 'Promoções por categoria ou produtos específicos',
      example: 'Ex: 25% em todas as bebidas'
    },
    {
      icon: Tag,
      title: 'Cupons',
      description: 'Códigos promocionais exclusivos para campanhas',
      example: 'Ex: BEMVINDO10 = 10% desconto'
    }
  ];

  const promotionFeatures = [
    {
      icon: Target,
      title: 'Regras Avançadas',
      description: 'Configure valor mínimo, limite de usos, primeira compra, dias e horários específicos'
    },
    {
      icon: BarChart3,
      title: 'Análise de ROI',
      description: 'Veja exatamente quanto cada promoção está gerando de vendas vs desconto dado'
    },
    {
      icon: Zap,
      title: 'Aplicação Automática',
      description: 'Promoções aplicadas automaticamente no checkout, sem código necessário'
    }
  ];

  // Buscar planos ativos do banco de dados com módulos
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Buscar planos
        const { data: plansData, error: plansError } = await supabase
          .from('plans')
          .select('*')
          .eq('status', 'active')
          .order('price', { ascending: true });

        if (plansError) {
          console.error('Erro ao buscar planos:', plansError);
          return;
        }

        // Buscar módulos de cada plano
        const { data: planModulesData, error: planModulesError } = await supabase
          .from('plan_modules')
          .select(`
            plan_id,
            module_id,
            modules!inner(name, icon, key)
          `);

        if (planModulesError) {
          console.error('Erro ao buscar módulos dos planos:', planModulesError);
        }

        // Associar módulos aos planos
        const plansWithModules = (plansData || []).map(plan => {
          const planModules = (planModulesData || [])
            .filter(pm => pm.plan_id === plan.id)
            .map(pm => ({
              module_id: pm.module_id,
              modules: pm.modules as { name: string; icon: string | null; key: string | null }
            }));
          
          return {
            ...plan,
            plan_modules: planModules
          };
        });

        console.log('📦 Planos com módulos:', plansWithModules);
        console.log('📋 Dados brutos plan_modules:', planModulesData);

        setPlans(plansWithModules);
      } catch (error) {
        console.error('Erro ao buscar planos:', error);
      }
    };

    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans w-full overflow-x-hidden">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
        <div className="container flex h-16 items-center justify-between px-3 sm:px-4 md:px-6 max-w-full overflow-hidden">
          {/* Logo */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 min-w-0">
            <Store className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-primary truncate">Mostralo</h1>
          </div>
          
          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6 flex-shrink-0">
            <a 
              href="#recursos" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Recursos
            </a>
            <a 
              href="#calculadora" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Calculadora
            </a>
            <a 
              href="#marketing-digital" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Marketing Digital
            </a>
            <a 
              href="#whatsapp-marketing" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              WhatsApp
            </a>
            <a 
              href="#gestao-financeira" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Financeiro
            </a>
            <a 
              href="#integracao-ia" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              IA
            </a>
            <a 
              href="#plans" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Planos
            </a>
            <Link 
              to="/funcionalidades" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Funcionalidades
            </Link>
            <Link 
              to="/seja-vendedor" 
              className="flex items-center gap-1.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-full transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              Trabalhe Conosco
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden h-9 w-9 p-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <Link to="/auth" className="hidden sm:block">
              <Button variant="outline" size="sm" className="md:size-default text-xs sm:text-sm">Entrar</Button>
            </Link>
            <Link to="/signup" className="flex-shrink-0">
              <Button size="sm" className="md:size-default text-xs sm:text-sm px-3 sm:px-4">Começar</Button>
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="container px-4 py-4 flex flex-col space-y-3">
              <a 
                href="#recursos" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Recursos
              </a>
              <a 
                href="#calculadora" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Calculadora
              </a>
              <a 
                href="#marketing-digital" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Marketing Digital
              </a>
              <a 
                href="#whatsapp-marketing" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                WhatsApp
              </a>
              <a 
                href="#integracao-ia" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                IA
              </a>
              <a 
                href="#plans" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Planos
              </a>
              <Link 
                to="/funcionalidades" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Funcionalidades
              </Link>
              <Link 
                to="/seja-vendedor" 
                className="flex items-center justify-center gap-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-3 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Briefcase className="w-4 h-4" />
                Trabalhe Conosco
              </Link>
              <Link to="/auth" className="sm:hidden" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">Entrar</Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section - Mensagem Forte e Direta */}
      <section className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 w-full overflow-x-hidden">
        <div className="container px-4 md:px-6 max-w-full">
          <div className="flex flex-col items-center space-y-8 text-center w-full">
            <Badge variant="destructive" className="text-base px-4 py-2">
              <AlertTriangle className="w-4 h-4 mr-2" />
              A Verdade que Ninguém Conta
            </Badge>
            
            <div className="space-y-4 max-w-4xl w-full px-2">
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight break-words">
                PARE DE PAGAR PARA O
                <span className="block text-destructive dark:text-red-500 mt-2">iFOOD CRESCER</span>
                <span className="block mt-2">COM SEUS CLIENTES</span>
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold text-muted-foreground">
                A cada pedido, você financia a expansão do marketplace que compete com você.
                <span className="text-primary block mt-2 font-display">Invista no SEU negócio, não no deles.</span>
              </p>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Sistema completo com <strong>0% de taxa por pedido</strong> + <span className="text-green-600 dark:text-green-400 font-bold">WhatsApp Marketing automático</span> que recupera clientes inativos. Todos os clientes são 100% seus.
              </p>

              {/* Novo destaque Marketing + WhatsApp */}
              <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 via-green-50 to-emerald-50 dark:from-blue-950/30 dark:via-green-950/30 dark:to-emerald-950/30 rounded-2xl border-2 border-green-300 dark:border-green-700 max-w-3xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <MessageCircle className="w-6 h-6 text-green-500" />
                  <h3 className="text-xl md:text-2xl font-bold text-foreground">
                    E o marketing? E os clientes inativos?
                  </h3>
                </div>
                <p className="text-lg md:text-xl font-semibold text-foreground">
                  Nós cuidamos de <span className="text-green-600 dark:text-green-400">TUDO</span> pra você.
                </p>
                <p className="text-sm md:text-base text-muted-foreground mt-2">
                  Gestão de redes sociais + <strong className="text-green-600 dark:text-green-400">WhatsApp Marketing automático</strong> que recupera clientes inativos e aumenta suas vendas.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                    🔥 Marketing Digital Incluso
                  </Badge>
                  <Badge className="bg-green-600 hover:bg-green-700 text-white">
                    💬 WhatsApp Marketing Incluso
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a href="#calculadora" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-lg h-14 px-8 shadow-lg hover:shadow-xl transition-shadow">
                  <Calculator className="mr-2 h-5 w-5" />
                  Calcular Minha Economia
                </Button>
              </a>
              <Link to="/users-demo" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full text-lg h-14 px-8">
                  Ver Sistema ao Vivo
                </Button>
              </Link>
            </div>

            {/* Banner de Cupons Promocionais */}
            <div className="w-full max-w-4xl">
              <PromotionBanner />
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Marketing Section - Segunda Seção */}
      <WhatsAppMarketingSection />

      {/* Nova Seção: Você Está Financiando Seu Próprio Concorrente */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-950/30 dark:to-orange-950/30 border-y border-red-200 dark:border-red-800 w-full overflow-x-hidden">
        <div className="container px-4 md:px-6 max-w-full">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            
            <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-4 py-2 rounded-full text-sm font-semibold">
              <AlertTriangle className="h-4 w-4" />
              O Que Eles Não Querem Que Você Saiba
            </div>
            
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-red-900 dark:text-red-100">
              Cada Real que Você Paga ao iFood
              <br />
              <span className="text-red-600 dark:text-red-400">
                Está Construindo Seu Maior Concorrente
              </span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <Card className="border-2 border-red-200 dark:border-red-800 bg-white/80 dark:bg-red-950/30 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-lg">Base de Clientes Deles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Todo cliente que compra através do marketplace é <strong>fidelizado ao aplicativo</strong>, não ao seu restaurante.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-red-200 dark:border-red-800 bg-white/80 dark:bg-red-950/30 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4">
                    <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-lg">Lucros Deles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Os <strong>25% de taxa</strong> que você paga financiam campanhas de marketing para trazer MAIS restaurantes competindo com você.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-red-200 dark:border-red-800 bg-white/80 dark:bg-red-950/30 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4">
                    <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-lg">Dados Deles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Você não tem acesso aos dados dos clientes. <strong>Eles vendem esses dados</strong> para seus concorrentes fazerem remarketing.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-red-600 dark:bg-red-700 text-white p-6 rounded-lg mt-8 shadow-2xl">
              <p className="text-xl md:text-2xl font-bold mb-2">
                🚨 Quanto mais você vende no marketplace, mais FORTE eles ficam e mais FRACO você fica.
              </p>
              <p className="text-base opacity-90">
                É hora de parar de alimentar o sistema que te explora. Invista no SEU negócio.
              </p>
            </div>
            
          </div>
        </div>
      </section>

      {/* Calculadora de Economia */}
      <section id="calculadora" className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-primary/10 w-full overflow-x-hidden">
        <div className="container px-4 md:px-6 max-w-full">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 text-base px-4 py-2">
                <DollarSign className="w-4 h-4 mr-2" />
                Quanto Você Está Doando ao iFood?
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Descubra Quanto Você Está
                <br />
                <span className="text-red-600 dark:text-red-500">
                  Investindo no Negócio DELES
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Cada real que você paga em taxas constrói o império deles.
                <br />
                <strong>Veja quanto você poderia investir no SEU restaurante:</strong>
              </p>
            </div>

            <Card className="p-6 md:p-10 bg-gradient-to-br from-card to-card/50 border-2 shadow-2xl">
              <div className="space-y-8">
                {/* Input de Faturamento */}
                <div className="space-y-4">
                  <label className="text-lg font-semibold">
                    Quanto você fatura por mês?
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold">R$</span>
                    <Input
                      type="text"
                      value={revenueInput}
                      onChange={handleInputChange}
                      className="text-2xl font-bold h-14 text-center"
                      placeholder="10000"
                    />
                  </div>
                  <Slider
                    value={[monthlyRevenue]}
                    onValueChange={handleRevenueChange}
                    max={100000}
                    min={1000}
                    step={1000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>R$ 1.000</span>
                    <span>R$ 100.000</span>
                  </div>
                </div>

                {/* Comparação Visual */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* iFood/Rappi */}
                  <Card className="p-6 bg-destructive/10 border-destructive/20">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">iFood / Rappi</h3>
                        <TrendingDown className="h-6 w-6 text-destructive" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Taxa por pedido</p>
                        <p className="text-3xl font-black text-destructive">25%</p>
                      </div>
                      <div className="pt-4 border-t space-y-1">
                        <p className="text-sm text-muted-foreground">Você paga por mês:</p>
                        <p className="text-2xl font-bold text-destructive">
                          R$ {marketplaceFeeMonthly.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="pt-2 space-y-1">
                        <p className="text-sm text-muted-foreground">Você paga por ano:</p>
                        <p className="text-3xl font-black text-destructive">
                          R$ {marketplaceFeeYearly.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Mostralo */}
                  <Card className="p-6 bg-primary/10 border-primary/20">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">Mostralo</h3>
                        <TrendingUp className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Taxa por pedido</p>
                        <p className="text-3xl font-black text-primary">0%</p>
                      </div>
                      <div className="pt-4 border-t space-y-1">
                        <p className="text-sm text-muted-foreground">Você paga por mês:</p>
                        <p className="text-2xl font-bold text-primary">
                          R$ {mostraloPlan.toLocaleString('pt-BR')} fixo
                        </p>
                      </div>
                      <div className="pt-2 space-y-1">
                        <p className="text-sm text-muted-foreground">Você paga por ano:</p>
                        <p className="text-3xl font-black text-primary">
                          R$ {mostraloYearly.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Resultado Final - Economia */}
                <Card className="p-8 bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30 shadow-lg">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <DollarSign className="h-8 w-8 text-green-600 dark:text-green-500" />
                      <h3 className="text-2xl font-bold">Sua Economia Anual</h3>
                    </div>
                    <p className="text-5xl md:text-6xl font-display font-black text-green-600 dark:text-green-500">
                      R$ {animatedSavings.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xl font-semibold text-green-700 dark:text-green-400">
                      Você economiza {savingsPercentage}% ao ano
                    </p>
                    <p className="text-muted-foreground">
                      Isso é dinheiro que fica NO SEU BOLSO, não no bolso do marketplace
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-3 flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      + Marketing Digital INCLUSO (valor de R$ 800-2.000/mês)
                    </p>
                  </div>
                </Card>

                {/* Nova Seção: O Que Você Poderia Fazer com Esse Dinheiro */}
                {savingsYearly > 0 && (
                  <div className="mt-12 p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl border-2 border-green-200 dark:border-green-800 shadow-lg">
                    <h3 className="font-display text-2xl md:text-3xl font-bold text-center mb-8 text-green-900 dark:text-green-100">
                      💡 Com R$ {savingsYearly.toLocaleString('pt-BR')} por ano VOCÊ PODERIA:
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg mb-1">Contratar 2-3 Funcionários</h4>
                          <p className="text-sm text-muted-foreground">
                            Expandir sua equipe e atender mais clientes com qualidade
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                          <Zap className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg mb-1">Investir em Marketing PRÓPRIO</h4>
                          <p className="text-sm text-muted-foreground">
                            Google Ads, Instagram, TikTok - construir SUA marca
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                          <Store className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg mb-1">Abrir Uma Filial</h4>
                          <p className="text-sm text-muted-foreground">
                            Expandir seu negócio fisicamente e aumentar faturamento
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                          <ChefHat className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg mb-1">Melhorar Insumos e Cardápio</h4>
                          <p className="text-sm text-muted-foreground">
                            Ingredientes premium, novos pratos, diferenciação real
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 text-center">
                      <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                        🎯 INVISTA NO SEU NEGÓCIO, NÃO NO DELES
                      </p>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="text-center space-y-4">
                  <Link to="/signup">
                    <Button size="lg" className="w-full md:w-auto text-lg h-14 px-8 shadow-lg hover:shadow-xl transition-shadow">
                      <ArrowRight className="mr-2 h-5 w-5" />
                      Começar Agora - 7 Dias Grátis
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Sem cartão de crédito • Cancele quando quiser • Suporte 24/7
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Nova Seção: E O MARKETING DIGITAL? */}
      <section id="marketing-digital" className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge className="mb-4 text-base px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Marketing Digital Incluso
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              E O MARKETING DIGITAL?
            </h2>
            <p className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">
              Nós fazemos a gestão pra você.
            </p>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo em um único lugar para crescer o <strong>SEU</strong> negócio, não o do iFood.
            </p>
          </div>

          {/* Grid de Features de Marketing */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
            <Card className="p-6 bg-white/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-shadow">
              <Clock className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Agendamento Ilimitado de Posts</h3>
              <p className="text-muted-foreground">
                Programe seus posts com antecedência. Nunca mais se preocupe em postar todo dia.
              </p>
            </Card>

            <Card className="p-6 bg-white/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-shadow">
              <Smartphone className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Todas as Redes Sociais</h3>
              <p className="text-muted-foreground">
                Instagram, Facebook, TikTok, LinkedIn, Google Meu Negócio. Tudo em um painel só.
              </p>
            </Card>

            <Card className="p-6 bg-white/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-shadow">
              <Bot className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">IA para Criar Legendas Profissionais</h3>
              <p className="text-muted-foreground">
                Nossa IA escreve legendas envolventes que convertem. Você só aprova e agenda.
              </p>
            </Card>

            <Card className="p-6 bg-white/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-shadow">
              <BarChart3 className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Relatórios de Performance</h3>
              <p className="text-muted-foreground">
                Veja o que está funcionando. Alcance, engajamento, cliques. Dados reais.
              </p>
            </Card>

            <Card className="p-6 bg-white/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-shadow">
              <Target className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Análise de Concorrentes</h3>
              <p className="text-muted-foreground">
                Veja o que seus concorrentes estão fazendo e fique sempre um passo à frente.
              </p>
            </Card>

            <Card className="p-6 bg-white/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-shadow">
              <Zap className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Integração com Facebook/Google Ads</h3>
              <p className="text-muted-foreground">
                Conecte suas campanhas pagas e gerencie tudo em um único painel.
              </p>
            </Card>
          </div>

          {/* Card de Destaque: INCLUSO EM TODOS OS PLANOS */}
          <Card className="p-8 bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30 shadow-xl max-w-3xl mx-auto">
            <div className="text-center space-y-4">
              <Badge className="bg-green-600 text-white text-lg px-6 py-2">
                <Gift className="w-5 h-5 mr-2" />
                INCLUSO EM TODOS OS PLANOS
              </Badge>
              <h3 className="text-2xl md:text-3xl font-bold">
                Marketing Digital Completo
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold">1 Perfil de Rede Social</p>
                    <p className="text-sm text-muted-foreground">Escolha Instagram, Facebook, TikTok, etc.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold">Posts Ilimitados</p>
                    <p className="text-sm text-muted-foreground">Agende quantos quiser, sem limite</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic">
                💡 Precisa de mais perfis? Fale com nosso comercial para condições especiais.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Nova Seção: Comparativo com Concorrentes */}
      <section className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge className="mb-4 text-base px-4 py-2">
              <Target className="w-4 h-4 mr-2" />
              Comparativo Real
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Mostralo vs Concorrentes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Por que pagar R$ 800-2.000/mês em agência de marketing quando você pode ter TUDO INCLUSO?
            </p>
          </div>

          {/* Tabela Comparativa */}
          <div className="max-w-6xl mx-auto overflow-x-auto">
            <div className="min-w-[800px] bg-white dark:bg-slate-950 rounded-xl border shadow-xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-5 bg-muted/50">
                <div className="p-4 font-semibold border-r">Recurso</div>
                <div className="p-4 text-center font-semibold border-r">Anota AI</div>
                <div className="p-4 text-center font-semibold border-r">Goomer</div>
                <div className="p-4 text-center font-semibold border-r">Cardápio Web</div>
                <div className="p-4 text-center font-semibold bg-primary/10">
                  <div className="flex items-center justify-center gap-2">
                    <Store className="w-5 h-5 text-primary" />
                    <span className="text-primary">MOSTRALO</span>
                  </div>
                </div>
              </div>

              {/* Preço */}
              <div className="grid grid-cols-5 border-t">
                <div className="p-4 font-medium border-r">Preço inicial</div>
                <div className="p-4 text-center border-r">R$ 399+</div>
                <div className="p-4 text-center border-r">R$ 299+</div>
                <div className="p-4 text-center border-r">R$ 397+</div>
                <div className="p-4 text-center bg-green-50 dark:bg-green-950/20 font-bold text-green-600">
                  R$ 397,90
                </div>
              </div>

              {/* Taxa por pedido */}
              <div className="grid grid-cols-5 border-t bg-muted/20">
                <div className="p-4 font-medium border-r">Taxa por pedido</div>
                <div className="p-4 text-center border-r">Sim</div>
                <div className="p-4 text-center border-r">Sim</div>
                <div className="p-4 text-center border-r">Não</div>
                <div className="p-4 text-center bg-green-50 dark:bg-green-950/20 font-bold text-green-600">
                  0%
                </div>
              </div>

              {/* Marketing Digital */}
              <div className="grid grid-cols-5 border-t">
                <div className="p-4 font-medium border-r flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Marketing Digital
                </div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center bg-green-50 dark:bg-green-950/20">
                  <Badge className="bg-green-600">✅ INCLUSO</Badge>
                </div>
              </div>

              {/* IA WhatsApp */}
              <div className="grid grid-cols-5 border-t bg-muted/20">
                <div className="p-4 font-medium border-r">IA WhatsApp 24/7</div>
                <div className="p-4 text-center border-r text-green-600">✅</div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center bg-green-50 dark:bg-green-950/20 text-green-600 font-bold">
                  ✅
                </div>
              </div>

              {/* App Entregadores */}
              <div className="grid grid-cols-5 border-t">
                <div className="p-4 font-medium border-r">App para Entregadores</div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center bg-green-50 dark:bg-green-950/20 text-green-600 font-bold">
                  ✅
                </div>
              </div>

              {/* Agendamento Posts */}
              <div className="grid grid-cols-5 border-t bg-muted/20">
                <div className="p-4 font-medium border-r">Agendamento de Posts</div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center bg-green-50 dark:bg-green-950/20">
                  <Badge className="bg-green-600">Ilimitado</Badge>
                </div>
              </div>

              {/* Análise Concorrentes */}
              <div className="grid grid-cols-5 border-t">
                <div className="p-4 font-medium border-r">Análise de Concorrentes</div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center bg-green-50 dark:bg-green-950/20 text-green-600 font-bold">
                  ✅
                </div>
              </div>

              {/* Gestão Financeira Automática */}
              <div className="grid grid-cols-5 border-t bg-muted/20">
                <div className="p-4 font-medium border-r flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  Gestão Financeira Automática
                </div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center border-r text-destructive">❌</div>
                <div className="p-4 text-center bg-green-50 dark:bg-green-950/20">
                  <Badge className="bg-emerald-600">✅ INCLUSO</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-xl font-bold mb-6 text-primary">
              🚀 Único no Brasil: Delivery + Marketing + Financeiro Automático
            </p>
            <Link to="/signup">
              <Button size="lg" className="text-lg h-14 px-8 shadow-lg hover:shadow-xl">
                <Sparkles className="mr-2 h-5 w-5" />
                Experimentar Grátis por 7 Dias
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Gestão Financeira Automática */}
      <FinancialAutomationSection />

      {/* WhatsApp Demo Section */}
      <section id="integracao-ia" className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/10 dark:to-green-900/10">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge className="mb-4 text-base px-4 py-2 bg-green-600 hover:bg-green-700">
              <Bot className="w-4 h-4 mr-2" />
              IA em Ação
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Veja a IA Trabalhando por Você
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Nossa IA responde clientes, processa pedidos e calcula frete automaticamente. Veja na prática:
            </p>
          </div>
          <WhatsAppMockup />
        </div>
      </section>

      {/* Porque Você Está Perdendo Dinheiro */}
      <section className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-destructive/5 to-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge variant="destructive" className="mb-4 text-base px-4 py-2">
              <AlertTriangle className="w-4 h-4 mr-2" />
              A Verdade que Ninguém Conta
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Por Que Você Está Perdendo Dinheiro
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Os marketplaces estão sugando seu lucro. Veja os números reais:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {problemsMarketplace.map((problem, index) => (
              <Card key={index} className="p-6 border-destructive/20 bg-destructive/5 shadow-lg hover:shadow-xl transition-shadow">
                <problem.icon className="h-12 w-12 text-destructive mb-4" />
                <Badge variant="destructive" className="mb-3">{problem.impact}</Badge>
                <h3 className="text-xl font-bold mb-3">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Seu Próprio Sistema */}
      <section id="recursos" className="py-12 md:py-20 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge className="mb-4 text-base px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              A Solução
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Seu Próprio Sistema de Delivery
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Controle total, economia real e independência financeira
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
            {economyFeatures.map((feature, index) => (
              <Card key={index} className="p-6 border-2 border-primary bg-primary/5 dark:bg-primary/10 shadow-lg">
                <feature.icon className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>

          {/* Comparação Direta */}
          <Card className="p-8 max-w-5xl mx-auto shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-center">Comparação Direta</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4">Recurso</th>
                    <th className="text-center py-4 px-4">
                      <div className="flex flex-col items-center">
                        <span className="text-destructive font-bold">iFood / Rappi</span>
                        <X className="w-5 h-5 text-destructive mt-1" />
                      </div>
                    </th>
                    <th className="text-center py-4 px-4">
                      <div className="flex flex-col items-center">
                        <span className="text-primary font-bold">Mostralo</span>
                        <Check className="w-5 h-5 text-primary mt-1" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-4 px-4 font-semibold">Taxa por pedido</td>
                    <td className="text-center py-4 px-4 text-destructive font-bold">25%</td>
                    <td className="text-center py-4 px-4 text-primary font-bold">0%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4 font-semibold">Custo mensal (R$ 10k faturamento)</td>
                    <td className="text-center py-4 px-4 text-destructive">R$ 2.500</td>
                    <td className="text-center py-4 px-4 text-primary">R$ 297 fixo</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4 font-semibold">Clientes são seus</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-destructive mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-primary mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4 font-semibold">Acesso aos dados</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-destructive mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-primary mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4 font-semibold">IA para WhatsApp</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-destructive mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-primary mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-semibold">Relatórios com IA</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-destructive mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-primary mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* Todos os Recursos Organizados */}
      <section className="py-12 md:py-20 lg:py-32 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Sistema Completo de A a Z
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para ter seu próprio delivery profissional
            </p>
          </div>

          <div className="space-y-16 max-w-6xl mx-auto">
            {techFeatures.map((category, catIndex) => (
              <div key={catIndex}>
                <h3 className="text-2xl font-bold mb-6 text-center">{category.category}</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items.map((item, itemIndex) => (
                    <Card key={itemIndex} className="p-6 hover:shadow-lg transition-shadow">
                      <item.icon className="h-10 w-10 text-primary mb-4" />
                      <h4 className="font-bold mb-2">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sistema de Promoções */}
      <section className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
        <div className="container px-4 md:px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 text-base px-4 py-2 bg-orange-600 hover:bg-orange-700">
              <Tag className="w-4 h-4 mr-2" />
              Marketing Inteligente
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Crie Promoções Estratégicas
              <br />
              <span className="text-orange-600 dark:text-orange-500">
                que Aumentam Suas Vendas
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sistema completo de promoções com <strong>análise de ROI em tempo real</strong>.
              <br />
              Você controla tudo: quando, quanto e para quem.
            </p>
          </div>

          {/* Grid de Tipos de Promoções */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
            {promotionTypes.map((promo, index) => (
              <Card key={index} className="p-6 hover:shadow-xl transition-all hover:scale-105">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                    <promo.icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-2">{promo.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{promo.description}</p>
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-600/50">
                      {promo.example}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Comparação Marketplace vs Mostralo */}
          <Card className="p-6 md:p-8 max-w-5xl mx-auto mb-16 shadow-2xl">
            <h3 className="text-2xl font-bold text-center mb-8">Controle Total das Suas Promoções</h3>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Marketplace */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <X className="h-5 w-5 text-red-600" />
                  </div>
                  <h4 className="font-bold text-lg">No Marketplace</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">Você NÃO controla as promoções</p>
                  </div>
                  <div className="flex gap-2">
                    <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">Marketplace define quando e quanto</p>
                  </div>
                  <div className="flex gap-2">
                    <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">Taxas aumentam mesmo com desconto</p>
                  </div>
                  <div className="flex gap-2">
                    <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">Promoções beneficiam o app, não você</p>
                  </div>
                  <div className="flex gap-2">
                    <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">Sem dados de performance</p>
                  </div>
                </div>
              </div>

              {/* Mostralo */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="font-bold text-lg">No Mostralo</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">Controle total das promoções</p>
                  </div>
                  <div className="flex gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">Você decide quando e quanto</p>
                  </div>
                  <div className="flex gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">Sem taxas extras, só sua promoção</p>
                  </div>
                  <div className="flex gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">Promoções fidelizam SEU cliente</p>
                  </div>
                  <div className="flex gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">Métricas e ROI em tempo real</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Features Destacadas */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            {promotionFeatures.map((feature, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="h-14 w-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>

          {/* Case de Sucesso */}
          <Card className="p-6 md:p-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 max-w-3xl mx-auto mb-12 shadow-xl">
            <div className="text-center">
              <Badge className="mb-4 bg-green-600 hover:bg-green-700">
                <DollarSign className="w-4 h-4 mr-1" />
                Caso Real
              </Badge>
              <p className="text-lg md:text-xl font-semibold mb-4 leading-relaxed">
                "Criei uma promoção de frete grátis acima de R$ 50. 
                Resultado: <span className="text-green-700 dark:text-green-400 font-bold">Ticket médio aumentou 35%</span> e 
                <span className="text-green-700 dark:text-green-400 font-bold"> vendas subiram 42%</span> em 2 semanas.
                <br />
                <span className="text-green-700 dark:text-green-400 font-bold text-2xl">ROI da promoção: 380%</span>"
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <ChefHat className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Marina Silva</p>
                  <p className="text-sm text-muted-foreground">Pizzaria Bella Napoli</p>
                </div>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <Link to="/signup">
              <Button size="lg" className="text-lg h-14 px-8 shadow-lg hover:shadow-xl">
                <Tag className="mr-2 h-5 w-5" />
                Criar Minha Primeira Promoção Grátis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Depoimentos com Economia */}
      <section className="py-12 md:py-20 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge className="mb-4 text-base px-4 py-2">
              <Star className="w-4 h-4 mr-2" />
              Resultados Reais
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Quem Saiu do iFood Não Se Arrepende
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Veja quanto nossos clientes estão economizando por ano
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="mb-4">
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {testimonial.savings}
                    </Badge>
                    <span className="text-sm text-muted-foreground">economizados</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Faturamento: {testimonial.revenue}</p>
                </div>
                <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.business}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Estratégico */}
      <section className="py-12 md:py-20 lg:py-32 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa saber antes de sair dos marketplaces
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqItems.map((item, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold mb-3">{item.question}</h3>
                <p className="text-muted-foreground">{item.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="plans" className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Planos Simples e Transparentes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sem pegadinhas. Sem taxas escondidas. Apenas um valor fixo mensal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const formatPrice = (price: number) => {
                return new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(price);
              };

              const featuresArray = Object.keys(plan.features || {});

              const isPremium = plan.name?.toLowerCase().includes('premium');
              
              return (
                <Card 
                  key={plan.id} 
                  className={`p-6 text-center relative w-full transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
                    isPremium 
                      ? 'border-2 border-amber-400 shadow-2xl shadow-amber-200/30 scale-[1.02]' 
                      : plan.is_popular 
                        ? 'border-primary shadow-2xl scale-[1.02]' 
                        : 'shadow-lg'
                  }`}
                >
                  {isPremium && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-semibold">
                      👑 Premium
                    </Badge>
                  )}
                  {plan.is_popular && !isPremium && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white">
                      ⭐ Mais Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description || 'Plano ideal para seu negócio'}</CardDescription>
                    
                    {/* Badge Marketing Digital Incluso */}
                    <div className="mt-3">
                      <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Marketing Digital Incluso
                      </Badge>
                    </div>
                    
                    {/* Exibir promoção se ativa */}
                    {plan.promotion_active && plan.discount_price && plan.discount_percentage ? (
                      <div className="mt-4 space-y-2">
                        <Badge className="bg-green-600 text-white text-sm px-3 py-1">
                          {plan.discount_percentage}% OFF
                        </Badge>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xl text-muted-foreground line-through">
                            {formatPrice(plan.price)}
                          </span>
                          <div className="text-4xl font-bold text-primary">
                            {formatPrice(plan.discount_price)}
                          </div>
                        </div>
                        <p className="text-sm text-green-600 font-semibold">
                          Economize {formatPrice(plan.price - plan.discount_price)}
                        </p>
                        <p className="text-muted-foreground text-sm">/mês</p>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <div className="text-4xl font-bold text-primary">{formatPrice(plan.price)}</div>
                        <p className="text-muted-foreground">/mês</p>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Módulos do plano com ícones */}
                    {plan.plan_modules && plan.plan_modules.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-left">
                          Módulos Inclusos
                        </p>
                        <ul className="space-y-1.5 text-left">
                          {plan.plan_modules.map((pm, idx) => {
                            const iconName = pm.modules?.icon;
                            const IconComponent = iconName ? (
                              iconName === 'Menu' ? Menu :
                              iconName === 'ShoppingCart' ? Package :
                              iconName === 'Truck' ? Truck :
                              iconName === 'Palette' ? Palette :
                              iconName === 'BarChart' ? BarChart3 :
                              iconName === 'MessageCircle' ? MessageCircle :
                              iconName === 'Printer' ? Printer :
                              iconName === 'Calendar' ? Clock :
                              iconName === 'Tag' ? Tag :
                              iconName === 'Megaphone' ? Target :
                              iconName === 'ExternalLink' ? Zap :
                              iconName === 'Wallet' ? Wallet :
                              iconName === 'Users' ? Users :
                              iconName === 'Image' ? ImageIcon :
                              iconName === 'Utensils' ? Utensils :
                              iconName === 'Code' ? Code :
                              iconName === 'QrCode' ? QrCode :
                              Check
                            ) : Check;
                            
                            return (
                              <li key={idx} className="flex items-center space-x-2">
                                <IconComponent className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="text-sm">{pm.modules?.name || 'Módulo'}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Recursos extras (texto livre) */}
                    {featuresArray.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-left">
                          Extras
                        </p>
                        <ul className="space-y-1.5 text-left">
                          {featuresArray.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center space-x-2">
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Link to="/signup" className="block">
                      <Button 
                        className="w-full mt-4" 
                        variant={plan.is_popular ? "default" : "outline"}
                        size="lg"
                      >
                        Começar Agora
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Final Poderoso */}
      <section className="py-12 md:py-20 lg:py-32 bg-gradient-to-r from-red-600 via-orange-600 to-red-700 dark:from-red-900 dark:via-orange-900 dark:to-red-950 text-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-black">
              Chega de Ser Sócio do iFood.
              <br />
              <span className="text-yellow-300">
                É Hora de Ser Dono do Seu Negócio.
              </span>
            </h2>
            <p className="text-xl md:text-2xl opacity-90">
              Operação completa + Marketing Digital em um só lugar.
            </p>
            <p className="text-lg md:text-xl opacity-90">
              Pare de pagar separado por ferramentas que competem com você.
              <br />
              Junte-se a <strong>mais de 5.000 restaurantes</strong> que pararam de financiar marketplaces e começaram a construir seus próprios impérios.
            </p>
            
            <Card className="p-8 bg-card text-card-foreground shadow-2xl">
              <div className="text-center space-y-4">
                <p className="text-2xl font-bold">
                  Economize até <span className="text-primary text-4xl">R$ {savingsYearly.toLocaleString('pt-BR')}/ano</span>
                </p>
                <p className="text-muted-foreground">
                  Baseado em um faturamento de R$ {monthlyRevenue.toLocaleString('pt-BR')}/mês
                </p>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#calculadora" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full text-lg h-14 px-8 shadow-lg hover:shadow-xl transition-shadow">
                  <Calculator className="mr-2 h-5 w-5" />
                  Calcular Minha Economia
                </Button>
              </a>
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full text-lg h-14 px-8 bg-transparent text-white border-white hover:bg-white/10">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Testar 7 Dias Grátis
                </Button>
              </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-6 justify-center text-sm opacity-90 pt-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>Sem taxa de setup</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>Cancele quando quiser</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>Suporte 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges - Compliance & Security */}
      <section className="border-y bg-muted/20 py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-medium">Certificado SSL</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-5 w-5 text-green-600" />
              <span className="font-medium">LGPD Compliant</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Dados Criptografados</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-medium">PCI DSS Level 1</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Google Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo e Descrição */}
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <Store className="w-8 h-8 text-primary" />
                <h3 className="text-xl font-display font-bold">Mostralo</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Sistema completo de delivery próprio. Pare de pagar 25% de taxa e tenha controle total do seu negócio.
              </p>
            </div>

            {/* Produto */}
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#recursos" className="hover:text-foreground cursor-pointer">Recursos</a></li>
                <li><a href="#plans" className="hover:text-foreground cursor-pointer">Preços</a></li>
                <li><a href="#" className="hover:text-foreground cursor-pointer">Demo</a></li>
                <li><a href="#integracao-ia" className="hover:text-foreground cursor-pointer">Integração IA</a></li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/termos" className="hover:text-foreground">Termos de Uso</Link></li>
                <li><Link to="/privacidade" className="hover:text-foreground">Privacidade</Link></li>
                <li><Link to="/suporte" className="hover:text-foreground">Suporte</Link></li>
                <li>
                  <Link 
                    to="/seja-vendedor" 
                    className="text-primary font-semibold hover:text-primary/80 flex items-center gap-1"
                  >
                    <Briefcase className="w-3 h-3" />
                    Trabalhe Conosco
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Suporte 24/7</li>
                <li>Chat Online</li>
                <li>WhatsApp</li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-6">
            {/* Copyright */}
            <div className="text-center text-sm text-muted-foreground mb-4">
              <p>© 2024 Mostralo. Todos os direitos reservados.</p>
              <p className="mt-2">Desenvolvido no Brasil 🇧🇷</p>
            </div>
            
            {/* LGPD Disclaimer */}
            <div className="text-center text-xs text-muted-foreground space-y-2 max-w-3xl mx-auto">
              <p className="font-semibold">
                🔒 Seus dados estão protegidos pela LGPD
              </p>
              <p>
                Este site coleta dados pessoais para fins de prestação de serviços, conforme nossa{' '}
                <Link to="/privacidade" className="text-primary hover:underline">
                  Política de Privacidade
                </Link>
                . Ao navegar, você concorda com nossa política de cookies e termos de uso.
              </p>
              <p className="text-xs opacity-75">
                Para exercer seus direitos (acesso, correção, exclusão), entre em contato: privacidade@mostralo.com.br
              </p>
              
              {/* Botão de Configurações de Privacidade */}
              <div className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Abrir o modal de PrivacyConsent
                    const privacyButton = document.querySelector('[data-privacy-trigger]');
                    if (privacyButton) {
                      (privacyButton as HTMLElement).click();
                    }
                  }}
                  className="text-xs"
                >
                  <Shield className="w-3 h-3 mr-2" />
                  Gerenciar Preferências de Privacidade
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Dashboard Footer - Mostralo Branding */}
      <DashboardFooter />

      {/* Cookie Banner e Privacy Components */}
      <CookieBanner />
      {/* PrivacyConsent renderizado mas com trigger oculto - acionado pelo botão no rodapé */}
      <PrivacyConsent />
      
      {/* Botão WhatsApp para captura de leads */}
      <WhatsAppLeadButton />
    </div>
  );
};

export default Index;
