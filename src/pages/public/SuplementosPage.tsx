import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, Menu, X, ChevronRight, Smartphone, Package, MessageCircle, 
  BarChart3, Tag, Clock, ShoppingCart, Palette, MapPin, Users, 
  Image, AlertTriangle, Check, ArrowRight, Star, Shield, Database,
  Heart, Target, Zap, TrendingUp, CreditCard, Copy, Search, Instagram,
  Globe, Percent, Calendar, Gift, Camera, Share2, Dumbbell, Timer,
  Flame, Apple, Award, Sparkles, Trophy, RefreshCw, Bell, Truck
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DashboardFooter } from '@/components/admin/DashboardFooter';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useMasterWhatsApp } from '@/hooks/useMasterWhatsApp';

const sections = [
  { id: 'dor-suplementos', title: 'A Dor do Mercado', icon: AlertTriangle },
  { id: 'solucao', title: 'Sua Loja Online', icon: Store },
  { id: 'catalogo', title: 'Catálogo Digital', icon: Dumbbell },
  { id: 'whatsapp', title: 'WhatsApp Marketing', icon: MessageCircle },
  { id: 'recompra', title: 'Ciclo de Recompra', icon: RefreshCw },
  { id: 'clientes', title: 'Base de Clientes', icon: Users },
  { id: 'google-shopping', title: 'Google Shopping', icon: Search },
  { id: 'instagram', title: 'Instagram Shopping', icon: Instagram },
  { id: 'delivery', title: 'Delivery', icon: Truck },
  { id: 'fidelizacao', title: 'Fidelização', icon: Heart },
  { id: 'cases', title: 'Cases de Uso', icon: Trophy },
  { id: 'comparativo', title: 'Comparativo', icon: Target },
  { id: 'calculadora', title: 'Economia', icon: Percent },
  { id: 'depoimentos', title: 'Depoimentos', icon: Star },
  { id: 'planos', title: 'Planos', icon: CreditCard },
  { id: 'roi', title: 'ROI', icon: TrendingUp },
  { id: 'timeline', title: 'Implementação', icon: Calendar },
  { id: 'comecar', title: 'Começar', icon: Zap },
];

export default function SuplementosPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [faturamento, setFaturamento] = useState(50000);
  
  // Hook para buscar configurações de WhatsApp
  const { getWhatsAppLink } = useMasterWhatsApp();

  const heroRef = useScrollReveal();
  const dorRef = useScrollReveal();
  const solucaoRef = useScrollReveal();
  const catalogoRef = useScrollReveal();
  const whatsappRef = useScrollReveal();
  const recompraRef = useScrollReveal();
  const clientesRef = useScrollReveal();
  const googleRef = useScrollReveal();
  const instagramRef = useScrollReveal();
  const deliveryRef = useScrollReveal();
  const fidelizacaoRef = useScrollReveal();
  const casesRef = useScrollReveal();
  const comparativoRef = useScrollReveal();
  const calculadoraRef = useScrollReveal();
  const depoimentosRef = useScrollReveal();
  const planosRef = useScrollReveal();
  const roiRef = useScrollReveal();
  const timelineRef = useScrollReveal();
  const comecarRef = useScrollReveal();

  // Cálculos da calculadora
  const taxaMarketplace = 0.18; // 18% média Mercado Livre
  const taxaMensal = faturamento * taxaMarketplace;
  const freteSubsidiado = faturamento * 0.02;
  const totalTaxas = taxaMensal + freteSubsidiado;
  const mensalidadeMostralo = 397.90;
  const economiaMensal = totalTaxas - mensalidadeMostralo;
  const economiaAnual = economiaMensal * 12;

  const copyPageText = async () => {
    const pageText = `# GUIA COMPLETO MOSTRALO PARA LOJAS DE SUPLEMENTOS

## O MERCADO DE SUPLEMENTOS NO BRASIL

### Estatísticas do Segmento:
- 📊 Mercado brasileiro: US$ 10 bilhões (2024)
- 📈 Crescimento anual: +8%
- 👥 Consumidores ativos: 10+ milhões de brasileiros
- 💰 Ticket médio: R$ 250-350 por compra
- 🔄 Ciclo de recompra: 30-45 dias
- 📦 Taxa Mercado Livre: 16-20% + frete

## A DOR DA LOJA DE SUPLEMENTOS

### O Problema:
- 🏪 Concorrência com grandes players: Growth Supplements, Integral Médica, Netshoes
- 💸 Taxas abusivas do Mercado Livre: 16-20% por venda
- 📱 Cliente pesquisa "Whey protein preço" e vai pro concorrente
- 🗒️ Clientes esquecem de repor: Perdem 30-45 dias de venda
- ⏰ Sem lembrete de recompra: Cliente compra do primeiro que oferecer
- 📊 Sem base de clientes: Não sabe preferências de sabor, tipo de treino

### Por que clientes não voltam:
- Não lembram de comprar quando acaba
- Encontram promoção do concorrente
- Você não entra em contato
- Sem programa de fidelidade

## SUA LOJA DE SUPLEMENTOS ONLINE - A SOLUÇÃO

✅ Loja própria: Sem taxas de marketplace (0%)
✅ WhatsApp Marketing: "Seu Whey está acabando!" - 23% de recompra
✅ Google Shopping: Apareça em "Whey protein [cidade]"
✅ Instagram Shopping: Fotos com preço e link direto
✅ Base de clientes: Sabor preferido, tipo de treino, frequência
✅ Delivery próprio: Atleta precisa rápido, você entrega
✅ Programa de pontos: Fidelização por compra

## CATÁLOGO DIGITAL POR CATEGORIA

💪 PROTEÍNAS:
- Whey Protein (Concentrado, Isolado, Hidrolisado)
- Albumina, Caseína
- Proteína vegana (Ervilha, Arroz)
- Beef Protein

🔋 PRÉ-TREINOS:
- Caffeine, Beta-alanina
- Vasodilatadores (Arginina, Citrulina)
- Pré-treinos complexos

🏃 AMINOÁCIDOS:
- BCAA (2:1:1, 4:1:1, 8:1:1)
- Glutamina
- L-Arginina, L-Carnitina
- EAA (Aminoácidos Essenciais)

⚡ CREATINA:
- Monohidratada
- Creapure (alemã)
- Micronizada

🥗 EMAGRECEDORES:
- Termogênicos
- L-Carnitina
- CLA, Óleo de Cártamo

🍌 HIPERCALÓRICOS:
- Mass gainers
- Maltodextrina
- Waxy Maize

💊 VITAMINAS E MINERAIS:
- Multivitamínicos
- Ômega 3
- Vitamina D, ZMA
- Colágeno

🎽 ACESSÓRIOS:
- Coqueteleiras
- Luvas, Cintos
- Bolsas térmicas

## WHATSAPP MARKETING PARA SUPLEMENTOS

### Lembretes de Recompra Automáticos:

📅 WHEY PROTEIN (30 dias):
"Oi [Nome]! 🏋️ Seu Whey Protein Chocolate deve estar acabando! Quer que eu separe mais um pote pra você? Temos pronta entrega!"

📅 CREATINA (60 dias):
"Fala [Nome]! 💪 Sua Creatina deve estar no final. Chegou lote novo da Creapure! Quer garantir a sua?"

📅 PRÉ-TREINO (45 dias):
"E aí [Nome]! ⚡ Seu pré-treino deve estar acabando. Sem energia pro treino? Tenho promoção especial pra clientes VIP!"

📅 VITAMINAS (60 dias):
"Olá [Nome]! 💊 Hora de repor suas vitaminas! Chegou Ômega 3 em promoção, quer aproveitar?"

### Campanhas Sazonais:
- 🏖️ Projeto Verão: Outubro-Dezembro
- 💪 Volta às Academias: Janeiro
- 🖤 Black Friday Fitness: Novembro
- 🎁 Natal Fit: Dezembro

### Resultados Esperados:
- 23% taxa de recompra com lembretes
- R$ 2.400/mês em vendas recuperadas
- 8 horas/mês economizadas em ligações
- 98% taxa de abertura vs 20% email

## CICLO DE RECOMPRA POR PRODUTO

| Produto | Duração Média | Lembrete Ideal |
|---------|---------------|----------------|
| Whey 900g | 30 dias | Dia 25 |
| Whey 2kg | 60 dias | Dia 55 |
| Creatina 300g | 60 dias | Dia 55 |
| Pré-treino 300g | 45 dias | Dia 40 |
| BCAA 300g | 45 dias | Dia 40 |
| Multivitamínico | 60 dias | Dia 55 |
| Ômega 3 | 90 dias | Dia 85 |

## GOOGLE SHOPPING + INSTAGRAM SHOPPING

🔍 GOOGLE SHOPPING:
- Seus produtos aparecem em "Whey protein [cidade]"
- Foto, preço e link direto pra sua loja
- Feed XML automático gerado pelo sistema
- R$ 0 de taxa por clique
- Concorra com Growth, Netshoes, Amazon

📸 INSTAGRAM SHOPPING:
- Poste fotos de produtos com preço
- Stories de "Chegou!" com link direto
- Reels mostrando resultados
- Feed CSV automático

📊 BUSCAS MENSAIS:
- "Whey protein preço": 135.000/mês
- "Creatina comprar": 74.000/mês
- "Pré treino melhor": 49.000/mês
- "BCAA para que serve": 40.000/mês

## CASES DE USO - LOJAS DE SUPLEMENTOS

### Case 1: Loja de Bairro
- Antes: R$ 35.000/mês, 70% vendas presenciais
- Depois: R$ 58.000/mês, 45% vendas online
- Diferença: +65% faturamento
- Segredo: WhatsApp lembrando recompra

### Case 2: E-commerce Mercado Livre
- Antes: R$ 80.000/mês, R$ 14.400 em taxas (18%)
- Depois: R$ 80.000/mês, R$ 397,90 Mostralo
- Economia: R$ 14.002/mês = R$ 168.024/ano
- Segredo: Migrou clientes pro site próprio

### Case 3: Personal Trainer Revendedor
- Antes: Vendia R$ 8.000/mês pros alunos, sem organização
- Depois: R$ 15.000/mês, catálogo profissional
- Diferença: +87% faturamento
- Segredo: Programa de indicação + WhatsApp

## COMPARATIVO: SEM MOSTRALO vs COM MOSTRALO

| Situação | Sem Mostralo | Com Mostralo |
|----------|--------------|--------------|
| Cliente pesquisa Whey | Vai pro Mercado Livre | Encontra SUA loja |
| Acabou o suplemento | Esquece de comprar | Recebe lembrete WhatsApp |
| Taxa por venda | 16-20% Mercado Livre | 0% |
| Base de clientes | Não tem | Completa com preferências |
| Marketing | Paga anúncios | WhatsApp + Google Shopping |
| Fidelização | Não existe | Programa de pontos |
| Ticket médio | R$ 250 | R$ 350 (combos sugeridos) |

## CALCULADORA DE ECONOMIA

### Exemplo: Faturamento R$ 50.000/mês no Mercado Livre

COM MERCADO LIVRE:
- Taxa média (18%): R$ 9.000/mês
- Frete subsidiado: R$ 1.000/mês
- Total taxas: R$ 10.000/mês

COM MOSTRALO:
- Mensalidade: R$ 397,90/mês
- Taxas: R$ 0

💰 ECONOMIA: R$ 9.602/mês = R$ 115.224/ano

### Bônus WhatsApp Marketing:
- 23% de recompra = +R$ 2.400/mês em vendas recuperadas
- Valor de mercado do serviço: R$ 800-1.500/mês
- Incluído em todos os planos!

## PLANOS

### Essencial: R$ 397,90/mês
- Catálogo digital completo
- Pedidos por WhatsApp
- Google Shopping integrado
- Instagram Shopping integrado
- 1 perfil de rede social
- Agendamento ilimitado de posts

### Profissional: R$ 597,90/mês (Mais Popular)
- Tudo do Essencial +
- WhatsApp Marketing completo
- Lembretes de recompra automáticos
- Campanhas de remarketing
- Relatórios de vendas

### Empresarial: R$ 997,90/mês
- Tudo do Profissional +
- Multi-lojas
- API completa
- Suporte prioritário

## ROI (RETORNO SOBRE INVESTIMENTO)

### Investimento Anual: R$ 4.774,80 (R$ 397,90 x 12)

### Retorno:
- Economia taxas ML: R$ 115.224/ano
- Vendas recuperadas WhatsApp: R$ 28.800/ano (R$ 2.400 x 12)
- Aumento ticket médio: R$ 12.000/ano
- Total Retorno: R$ 156.024/ano

### ROI: 3.167% ao ano

A cada R$ 1 investido, você recebe R$ 31,67 de volta!

## IMPLEMENTAÇÃO

### Semana 1: Setup Inicial
- Criação da conta
- Configuração da loja
- Upload do catálogo

### Semana 2: Integração
- WhatsApp Business conectado
- Google Shopping ativado
- Instagram Shopping configurado

### Semana 3: Marketing
- Primeira campanha de recompra
- Posts nas redes sociais
- Comunicado aos clientes

### Semana 4: Otimização
- Análise de resultados
- Ajustes de mensagens
- Programa de fidelidade ativo

---
Conteúdo do Mostralo - Plataforma para Lojas de Suplementos
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
              <span className="text-orange-600 dark:text-orange-400 font-medium text-sm">
                Para Suplementos
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
              <span className="block text-orange-600 dark:text-orange-400 font-medium">Para Suplementos</span>
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
        <section ref={heroRef.ref} className="bg-gradient-to-br from-orange-500/10 via-background to-amber-500/10 dark:from-orange-500/5 dark:to-amber-500/5 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <Dumbbell className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Para Lojas de Suplementos</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Sua Loja de Suplementos Competindo com Gigantes Online
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              <span className="text-red-500 font-semibold">Mercado Livre cobra 18% por venda.</span> Growth, Netshoes e Amazon dominam o Google. 
              Seus clientes esquecem de repor o Whey e compram do concorrente.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              0% de taxa • Lembrete de recompra automático • Google Shopping • WhatsApp Marketing
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="gap-2 bg-orange-600 hover:bg-orange-700">
                  Criar Minha Loja Online <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" onClick={() => scrollToSection('calculadora')}>
                Ver Economia
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
              <Card className="bg-background/50 border-orange-500/20">
                <CardContent className="p-4 text-center">
                  <Globe className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">US$ 10bi</p>
                  <p className="text-xs text-muted-foreground">mercado brasileiro</p>
                </CardContent>
              </Card>
              <Card className="bg-background/50 border-green-500/20">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">+8%</p>
                  <p className="text-xs text-muted-foreground">crescimento anual</p>
                </CardContent>
              </Card>
              <Card className="bg-background/50 border-blue-500/20">
                <CardContent className="p-4 text-center">
                  <RefreshCw className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">30-45d</p>
                  <p className="text-xs text-muted-foreground">ciclo de recompra</p>
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

        {/* Section: A Dor do Mercado */}
        <section id="dor-suplementos" ref={dorRef.ref} className="py-16 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">A Dor da Loja de Suplementos</h2>
                <p className="text-muted-foreground">Por que você está perdendo vendas para os grandes players?</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="bg-destructive/5 border-destructive/20 dark:bg-destructive/10">
                <CardContent className="p-6">
                  <CreditCard className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Taxas Abusivas do ML</h3>
                  <p className="text-sm text-muted-foreground">
                    Mercado Livre cobra <span className="font-semibold">16-20% por venda</span>. 
                    Em R$ 50.000/mês, você perde R$ 9.000 só de taxa!
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20 dark:bg-destructive/10">
                <CardContent className="p-6">
                  <Search className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Concorrência no Google</h3>
                  <p className="text-sm text-muted-foreground">
                    Growth, Netshoes e Amazon aparecem primeiro em 
                    <span className="font-semibold"> "Whey protein preço"</span>. Você nem aparece.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20 dark:bg-destructive/10">
                <CardContent className="p-6">
                  <RefreshCw className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Cliente Não Volta</h3>
                  <p className="text-sm text-muted-foreground">
                    O Whey acaba em 30 dias. <span className="font-semibold">Você não lembra o cliente.</span> 
                    Ele compra do primeiro que aparecer.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20 dark:bg-destructive/10">
                <CardContent className="p-6">
                  <Users className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Sem Base de Clientes</h3>
                  <p className="text-sm text-muted-foreground">
                    Não sabe o sabor preferido, tipo de treino ou quando vai precisar repor. 
                    <span className="font-semibold"> Zero personalização.</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20 dark:bg-destructive/10">
                <CardContent className="p-6">
                  <Bell className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Sem Marketing de Recompra</h3>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">68% dos clientes não voltam</span> porque você não entra em contato. 
                    Perde venda todo mês.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20 dark:bg-destructive/10">
                <CardContent className="p-6">
                  <Target className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Ticket Baixo</h3>
                  <p className="text-sm text-muted-foreground">
                    Cliente compra só o Whey. <span className="font-semibold">Sem sugestão de combo:</span> 
                    Whey + Creatina + BCAA = ticket 3x maior.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/5">
              <CardContent className="p-6">
                <p className="text-center text-lg">
                  <span className="font-bold text-amber-600 dark:text-amber-400">Resultado:</span> Você trabalha muito, 
                  paga taxas absurdas, perde clientes recorrentes e não consegue competir com os gigantes online.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section: Solução */}
        <section id="solucao" ref={solucaoRef.ref} className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Store className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Sua Loja de Suplementos Online</h2>
                <p className="text-muted-foreground">A solução completa para competir com os gigantes</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <Check className="h-8 w-8 text-green-500 mb-4" />
                  <h3 className="font-bold text-foreground mb-2">0% de Taxa por Venda</h3>
                  <p className="text-sm text-muted-foreground">
                    Chega de pagar 18% pro Mercado Livre. Seu dinheiro fica com você.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <MessageCircle className="h-8 w-8 text-green-500 mb-4" />
                  <h3 className="font-bold text-foreground mb-2">WhatsApp Lembrete Automático</h3>
                  <p className="text-sm text-muted-foreground">
                    "Seu Whey está acabando!" - 23% dos clientes recompram com lembrete.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <Search className="h-8 w-8 text-green-500 mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Google Shopping Integrado</h3>
                  <p className="text-sm text-muted-foreground">
                    Apareça em "Whey protein [cidade]" ao lado dos grandes players.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <Instagram className="h-8 w-8 text-green-500 mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Instagram Shopping</h3>
                  <p className="text-sm text-muted-foreground">
                    Poste fotos com preço e link direto. Stories de promoção com clique pra comprar.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <Users className="h-8 w-8 text-green-500 mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Base de Clientes Completa</h3>
                  <p className="text-sm text-muted-foreground">
                    Sabor preferido, tipo de treino, frequência de compra. Tudo registrado.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <Heart className="h-8 w-8 text-green-500 mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Programa de Fidelidade</h3>
                  <p className="text-sm text-muted-foreground">
                    Pontos por compra. Cliente fiel = cliente que não vai pro concorrente.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section: Catálogo Digital */}
        <section id="catalogo" ref={catalogoRef.ref} className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Catálogo Digital Completo</h2>
                <p className="text-muted-foreground">Organize seus produtos por categoria</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-background border-orange-500/20">
                <CardContent className="p-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-xl">💪</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Proteínas</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Whey Concentrado, Isolado, Hidrolisado</li>
                    <li>• Albumina, Caseína</li>
                    <li>• Proteína Vegana</li>
                    <li>• Beef Protein</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background border-red-500/20">
                <CardContent className="p-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-xl">🔋</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Pré-Treinos</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Caffeine, Beta-alanina</li>
                    <li>• Vasodilatadores</li>
                    <li>• Arginina, Citrulina</li>
                    <li>• Pré-treinos complexos</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background border-blue-500/20">
                <CardContent className="p-4">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-xl">🏃</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Aminoácidos</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• BCAA (2:1:1, 4:1:1, 8:1:1)</li>
                    <li>• Glutamina</li>
                    <li>• L-Arginina, L-Carnitina</li>
                    <li>• EAA Essenciais</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background border-yellow-500/20">
                <CardContent className="p-4">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-xl">⚡</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Creatina</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Monohidratada</li>
                    <li>• Creapure (alemã)</li>
                    <li>• Micronizada</li>
                    <li>• HCL</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background border-green-500/20">
                <CardContent className="p-4">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-xl">🥗</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Emagrecedores</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Termogênicos</li>
                    <li>• L-Carnitina</li>
                    <li>• CLA, Óleo de Cártamo</li>
                    <li>• Bloqueadores</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background border-purple-500/20">
                <CardContent className="p-4">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-xl">🍌</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Hipercalóricos</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Mass Gainers</li>
                    <li>• Maltodextrina</li>
                    <li>• Waxy Maize</li>
                    <li>• Dextrose</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background border-cyan-500/20">
                <CardContent className="p-4">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-xl">💊</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Vitaminas</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Multivitamínicos</li>
                    <li>• Ômega 3, Vitamina D</li>
                    <li>• ZMA, Colágeno</li>
                    <li>• Minerais</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background border-pink-500/20">
                <CardContent className="p-4">
                  <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-xl">🎽</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Acessórios</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Coqueteleiras</li>
                    <li>• Luvas, Cintos</li>
                    <li>• Bolsas térmicas</li>
                    <li>• Straps, Munhequeiras</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section: WhatsApp Marketing */}
        <section id="whatsapp" ref={whatsappRef.ref} className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">WhatsApp Marketing para Suplementos</h2>
                <p className="text-muted-foreground">Recupere vendas com lembretes automáticos de recompra</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">📱 Lembretes de Recompra Automáticos</h3>
                <div className="space-y-4">
                  <Card className="bg-background border-green-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span>🏋️</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">Whey Protein (30 dias)</p>
                          <p className="text-xs text-muted-foreground italic mt-1">
                            "Oi João! 🏋️ Seu Whey Protein Chocolate deve estar acabando! Quer que eu separe mais um pote pra você? Temos pronta entrega!"
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-background border-green-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span>⚡</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">Creatina (60 dias)</p>
                          <p className="text-xs text-muted-foreground italic mt-1">
                            "Fala João! 💪 Sua Creatina deve estar no final. Chegou lote novo da Creapure! Quer garantir a sua?"
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-background border-green-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span>🔋</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">Pré-Treino (45 dias)</p>
                          <p className="text-xs text-muted-foreground italic mt-1">
                            "E aí João! ⚡ Seu pré-treino deve estar acabando. Sem energia pro treino? Tenho promoção especial pra clientes VIP!"
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">📊 Resultados Comprovados</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-green-500/10 border-green-500/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">23%</p>
                      <p className="text-sm text-muted-foreground">taxa de recompra</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-500/10 border-blue-500/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">R$ 2.400</p>
                      <p className="text-sm text-muted-foreground">vendas/mês recuperadas</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-500/10 border-purple-500/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">8h</p>
                      <p className="text-sm text-muted-foreground">economizadas/mês</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-500/10 border-orange-500/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">98%</p>
                      <p className="text-sm text-muted-foreground">taxa de abertura</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-amber-500/10 border-amber-500/30 mt-4">
                  <CardContent className="p-4">
                    <p className="text-sm text-center">
                      <span className="font-bold text-amber-600 dark:text-amber-400">Valor de mercado:</span> R$ 800-1.500/mês
                      <br />
                      <span className="text-xs text-muted-foreground">Incluído em todos os planos Mostralo!</span>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Ciclo de Recompra */}
        <section id="recompra" ref={recompraRef.ref} className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Ciclo de Recompra por Produto</h2>
                <p className="text-muted-foreground">Saiba exatamente quando lembrar seu cliente</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-4 font-semibold text-foreground border-b">Produto</th>
                    <th className="text-center p-4 font-semibold text-foreground border-b">Duração Média</th>
                    <th className="text-center p-4 font-semibold text-foreground border-b">Lembrete Ideal</th>
                    <th className="text-center p-4 font-semibold text-foreground border-b">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-4 text-foreground">Whey 900g</td>
                    <td className="p-4 text-center text-muted-foreground">30 dias</td>
                    <td className="p-4 text-center text-blue-600 dark:text-blue-400 font-semibold">Dia 25</td>
                    <td className="p-4 text-center text-xs text-green-600">"Seu Whey está acabando!"</td>
                  </tr>
                  <tr className="border-b border-border bg-muted/20">
                    <td className="p-4 text-foreground">Whey 2kg</td>
                    <td className="p-4 text-center text-muted-foreground">60 dias</td>
                    <td className="p-4 text-center text-blue-600 dark:text-blue-400 font-semibold">Dia 55</td>
                    <td className="p-4 text-center text-xs text-green-600">"Hora de repor!"</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-4 text-foreground">Creatina 300g</td>
                    <td className="p-4 text-center text-muted-foreground">60 dias</td>
                    <td className="p-4 text-center text-blue-600 dark:text-blue-400 font-semibold">Dia 55</td>
                    <td className="p-4 text-center text-xs text-green-600">"Creatina nova chegou!"</td>
                  </tr>
                  <tr className="border-b border-border bg-muted/20">
                    <td className="p-4 text-foreground">Pré-treino 300g</td>
                    <td className="p-4 text-center text-muted-foreground">45 dias</td>
                    <td className="p-4 text-center text-blue-600 dark:text-blue-400 font-semibold">Dia 40</td>
                    <td className="p-4 text-center text-xs text-green-600">"Sem energia pro treino?"</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-4 text-foreground">BCAA 300g</td>
                    <td className="p-4 text-center text-muted-foreground">45 dias</td>
                    <td className="p-4 text-center text-blue-600 dark:text-blue-400 font-semibold">Dia 40</td>
                    <td className="p-4 text-center text-xs text-green-600">"BCAA em promoção!"</td>
                  </tr>
                  <tr className="border-b border-border bg-muted/20">
                    <td className="p-4 text-foreground">Multivitamínico</td>
                    <td className="p-4 text-center text-muted-foreground">60 dias</td>
                    <td className="p-4 text-center text-blue-600 dark:text-blue-400 font-semibold">Dia 55</td>
                    <td className="p-4 text-center text-xs text-green-600">"Vitaminas em dia?"</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-4 text-foreground">Ômega 3</td>
                    <td className="p-4 text-center text-muted-foreground">90 dias</td>
                    <td className="p-4 text-center text-blue-600 dark:text-blue-400 font-semibold">Dia 85</td>
                    <td className="p-4 text-center text-xs text-green-600">"Ômega acabando!"</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section: Base de Clientes */}
        <section id="clientes" ref={clientesRef.ref} className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Base de Clientes Inteligente</h2>
                <p className="text-muted-foreground">Conheça cada cliente em detalhes</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-background">
                <CardContent className="p-6">
                  <Database className="h-8 w-8 text-purple-500 mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Perfil Completo</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Sabor preferido (Chocolate, Baunilha...)</li>
                    <li>• Tipo de treino (Hipertrofia, Emagrecer)</li>
                    <li>• Marca favorita</li>
                    <li>• Objetivo fitness</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-6">
                  <BarChart3 className="h-8 w-8 text-blue-500 mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Histórico de Compras</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Última compra de cada produto</li>
                    <li>• Frequência de recompra</li>
                    <li>• Ticket médio</li>
                    <li>• Produtos mais comprados</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-6">
                  <Target className="h-8 w-8 text-green-500 mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Segmentação</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Clientes VIP (alto ticket)</li>
                    <li>• Iniciantes (primeira compra)</li>
                    <li>• Inativos (não compra há 60 dias)</li>
                    <li>• Recorrentes (compra todo mês)</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section: Google Shopping */}
        <section id="google-shopping" ref={googleRef.ref} className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Search className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Google Shopping Integrado</h2>
                <p className="text-muted-foreground">Apareça nas buscas junto com os grandes</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">🔍 Como Funciona</h3>
                <div className="space-y-4">
                  <Card className="bg-background border-blue-500/20">
                    <CardContent className="p-4">
                      <p className="font-semibold text-foreground mb-2">1. Feed XML Automático</p>
                      <p className="text-sm text-muted-foreground">
                        Sistema gera automaticamente o feed de produtos no formato que o Google exige.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-background border-blue-500/20">
                    <CardContent className="p-4">
                      <p className="font-semibold text-foreground mb-2">2. Produtos Aparecem nas Buscas</p>
                      <p className="text-sm text-muted-foreground">
                        "Whey protein [cidade]" → Seu produto aparece com foto, preço e link.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-background border-blue-500/20">
                    <CardContent className="p-4">
                      <p className="font-semibold text-foreground mb-2">3. Zero Taxa por Clique</p>
                      <p className="text-sm text-muted-foreground">
                        Diferente de anúncios pagos, o Google Shopping orgânico é gratuito!
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">📊 Buscas Mensais</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-foreground">"Whey protein preço"</span>
                    <span className="font-bold text-blue-600">135.000/mês</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-foreground">"Creatina comprar"</span>
                    <span className="font-bold text-blue-600">74.000/mês</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-foreground">"Pré treino melhor"</span>
                    <span className="font-bold text-blue-600">49.000/mês</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-foreground">"BCAA para que serve"</span>
                    <span className="font-bold text-blue-600">40.000/mês</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Instagram Shopping */}
        <section id="instagram" ref={instagramRef.ref} className="py-16 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center">
                <Instagram className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Instagram Shopping</h2>
                <p className="text-muted-foreground">Venda diretamente pelo Instagram</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-background">
                <CardContent className="p-6 text-center">
                  <Camera className="h-10 w-10 text-pink-500 mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Fotos com Preço</h3>
                  <p className="text-sm text-muted-foreground">
                    Poste fotos dos produtos com preço visível e link direto para compra.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-6 text-center">
                  <Zap className="h-10 w-10 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Stories de "Chegou!"</h3>
                  <p className="text-sm text-muted-foreground">
                    Novos lotes, sabores exclusivos. Crie urgência e venda rápido.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-6 text-center">
                  <Share2 className="h-10 w-10 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Feed CSV Automático</h3>
                  <p className="text-sm text-muted-foreground">
                    Sistema gera o feed no formato que o Instagram/Meta exige.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section: Delivery */}
        <section id="delivery" ref={deliveryRef.ref} className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Delivery Próprio</h2>
                <p className="text-muted-foreground">Atleta precisa rápido, você entrega</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-background border-blue-500/20">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">✅ Vantagens</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Sem taxa de marketplace (0%)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Entrega no mesmo dia</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Contato direto com cliente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Gestão de entregadores próprios</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-orange-500/10 border-orange-500/30">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">🏋️ Perfil do Cliente Fitness</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li>• Treina 5-6x por semana</li>
                    <li>• Precisa de reposição urgente</li>
                    <li>• Valoriza agilidade</li>
                    <li>• Paga bem por conveniência</li>
                    <li>• Cliente fiel quando bem atendido</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section: Fidelização */}
        <section id="fidelizacao" ref={fidelizacaoRef.ref} className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center">
                <Heart className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Programa de Fidelidade</h2>
                <p className="text-muted-foreground">Cliente fiel não vai pro concorrente</p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-background">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-bronze-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-orange-700" />
                  </div>
                  <h3 className="font-bold text-foreground">Bronze</h3>
                  <p className="text-xs text-muted-foreground">R$ 500 em compras</p>
                  <p className="text-sm text-orange-600 font-semibold mt-2">5% de desconto</p>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-gray-300/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-gray-500" />
                  </div>
                  <h3 className="font-bold text-foreground">Prata</h3>
                  <p className="text-xs text-muted-foreground">R$ 1.500 em compras</p>
                  <p className="text-sm text-gray-600 font-semibold mt-2">10% de desconto</p>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="font-bold text-foreground">Ouro</h3>
                  <p className="text-xs text-muted-foreground">R$ 3.000 em compras</p>
                  <p className="text-sm text-yellow-600 font-semibold mt-2">15% de desconto</p>
                </CardContent>
              </Card>

              <Card className="bg-background border-purple-500/30">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trophy className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-foreground">Diamante</h3>
                  <p className="text-xs text-muted-foreground">R$ 5.000 em compras</p>
                  <p className="text-sm text-purple-600 font-semibold mt-2">20% de desconto</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section: Cases */}
        <section id="cases" ref={casesRef.ref} className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Cases de Sucesso</h2>
                <p className="text-muted-foreground">Resultados reais de lojas de suplementos</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Store className="h-5 w-5 text-green-600" />
                    <span className="font-bold text-foreground">Loja de Bairro</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Antes:</span> <span className="text-foreground">R$ 35.000/mês</span></p>
                    <p><span className="text-muted-foreground">Depois:</span> <span className="text-green-600 font-bold">R$ 58.000/mês</span></p>
                    <p className="text-green-600 font-bold text-lg">+65% faturamento</p>
                    <p className="text-xs text-muted-foreground mt-2">Segredo: WhatsApp lembrando recompra</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <span className="font-bold text-foreground">E-commerce ML</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Antes:</span> <span className="text-foreground">R$ 14.400/mês em taxas</span></p>
                    <p><span className="text-muted-foreground">Depois:</span> <span className="text-blue-600 font-bold">R$ 397,90/mês</span></p>
                    <p className="text-blue-600 font-bold text-lg">R$ 168.024/ano economizados</p>
                    <p className="text-xs text-muted-foreground mt-2">Segredo: Migrou clientes pro site próprio</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Dumbbell className="h-5 w-5 text-purple-600" />
                    <span className="font-bold text-foreground">Personal Revendedor</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Antes:</span> <span className="text-foreground">R$ 8.000/mês</span></p>
                    <p><span className="text-muted-foreground">Depois:</span> <span className="text-purple-600 font-bold">R$ 15.000/mês</span></p>
                    <p className="text-purple-600 font-bold text-lg">+87% faturamento</p>
                    <p className="text-xs text-muted-foreground mt-2">Segredo: Programa de indicação + WhatsApp</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section: Comparativo */}
        <section id="comparativo" ref={comparativoRef.ref} className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Comparativo: Sem vs Com Mostralo</h2>
                <p className="text-muted-foreground">Veja a diferença na prática</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-background rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-4 font-semibold text-foreground">Situação</th>
                    <th className="text-center p-4 font-semibold text-red-600">❌ Sem Mostralo</th>
                    <th className="text-center p-4 font-semibold text-green-600">✅ Com Mostralo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-4 text-foreground font-medium">Cliente pesquisa Whey</td>
                    <td className="p-4 text-center text-red-600">Vai pro Mercado Livre</td>
                    <td className="p-4 text-center text-green-600">Encontra SUA loja</td>
                  </tr>
                  <tr className="border-b border-border bg-muted/20">
                    <td className="p-4 text-foreground font-medium">Acabou o suplemento</td>
                    <td className="p-4 text-center text-red-600">Esquece de comprar</td>
                    <td className="p-4 text-center text-green-600">Recebe lembrete WhatsApp</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-4 text-foreground font-medium">Taxa por venda</td>
                    <td className="p-4 text-center text-red-600 font-bold">16-20% ML</td>
                    <td className="p-4 text-center text-green-600 font-bold">0%</td>
                  </tr>
                  <tr className="border-b border-border bg-muted/20">
                    <td className="p-4 text-foreground font-medium">Base de clientes</td>
                    <td className="p-4 text-center text-red-600">Não tem</td>
                    <td className="p-4 text-center text-green-600">Completa com preferências</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-4 text-foreground font-medium">Marketing</td>
                    <td className="p-4 text-center text-red-600">Paga anúncios</td>
                    <td className="p-4 text-center text-green-600">WhatsApp + Google Shopping</td>
                  </tr>
                  <tr className="border-b border-border bg-muted/20">
                    <td className="p-4 text-foreground font-medium">Fidelização</td>
                    <td className="p-4 text-center text-red-600">Não existe</td>
                    <td className="p-4 text-center text-green-600">Programa de pontos</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-foreground font-medium">Ticket médio</td>
                    <td className="p-4 text-center text-red-600">R$ 250</td>
                    <td className="p-4 text-center text-green-600 font-bold">R$ 350 (combos)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section: Calculadora */}
        <section id="calculadora" ref={calculadoraRef.ref} className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Percent className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Calculadora de Economia</h2>
                <p className="text-muted-foreground">Quanto você economiza saindo do Mercado Livre</p>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              <Card className="bg-background">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Faturamento mensal no Mercado Livre
                    </label>
                    <input
                      type="range"
                      min="10000"
                      max="200000"
                      step="5000"
                      value={faturamento}
                      onChange={(e) => setFaturamento(Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-2xl font-bold text-foreground mt-2">
                      R$ {faturamento.toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                      <h4 className="font-bold text-red-600 mb-3">❌ Com Mercado Livre</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taxa ML (18%):</span>
                          <span className="text-red-600 font-semibold">R$ {taxaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Frete subsidiado:</span>
                          <span className="text-red-600 font-semibold">R$ {freteSubsidiado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-red-200">
                          <span className="font-bold text-foreground">Total taxas:</span>
                          <span className="text-red-600 font-bold">R$ {totalTaxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <h4 className="font-bold text-green-600 mb-3">✅ Com Mostralo</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mensalidade:</span>
                          <span className="text-green-600 font-semibold">R$ 397,90</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taxas por venda:</span>
                          <span className="text-green-600 font-semibold">R$ 0,00</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-green-200">
                          <span className="font-bold text-foreground">Total:</span>
                          <span className="text-green-600 font-bold">R$ 397,90/mês</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card className="bg-gradient-to-r from-green-500 to-emerald-500 mt-6">
                    <CardContent className="p-6 text-center text-white">
                      <p className="text-sm opacity-90">💰 Sua economia</p>
                      <p className="text-3xl font-bold">R$ {economiaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</p>
                      <p className="text-lg font-semibold mt-1">= R$ {economiaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano</p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section: Depoimentos */}
        <section id="depoimentos" ref={depoimentosRef.ref} className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Depoimentos</h2>
                <p className="text-muted-foreground">O que dizem donos de lojas de suplementos</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-background">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">
                    "Parei de pagar R$ 12.000/mês pro Mercado Livre. Migrei meus clientes pro site próprio e 
                    agora tenho controle total. O WhatsApp de recompra é sensacional!"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <span className="font-bold text-orange-600">RC</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Rafael Costa</p>
                      <p className="text-xs text-muted-foreground">Suplementos Premium - SP</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">
                    "Meus clientes adoram receber lembrete quando o Whey está acabando. 
                    Aumentei a recorrência em 40% só com essa funcionalidade!"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="font-bold text-blue-600">JM</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Julia Mendes</p>
                      <p className="text-xs text-muted-foreground">Fit Store - RJ</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">
                    "Como personal trainer, vendo suplementos pros meus alunos. O catálogo profissional 
                    e o programa de fidelidade dobraram minhas vendas!"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <span className="font-bold text-green-600">PS</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Pedro Santos</p>
                      <p className="text-xs text-muted-foreground">Personal Trainer - MG</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section: Planos */}
        <section id="planos" ref={planosRef.ref} className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Planos</h2>
                <p className="text-muted-foreground">Escolha o ideal para sua loja</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-background">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">Essencial</h3>
                  <p className="text-3xl font-bold text-foreground mb-4">R$ 397,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Catálogo digital completo</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Pedidos por WhatsApp</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Google Shopping integrado</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Instagram Shopping</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 1 perfil de rede social</li>
                  </ul>
                  <Link to="/signup">
                    <Button variant="outline" className="w-full">Começar</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-background border-primary border-2 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                  Mais Popular
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">Profissional</h3>
                  <p className="text-3xl font-bold text-primary mb-4">R$ 597,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Tudo do Essencial +</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> WhatsApp Marketing completo</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Lembretes de recompra automáticos</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Campanhas de remarketing</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Relatórios de vendas</li>
                  </ul>
                  <Link to="/signup">
                    <Button className="w-full">Começar</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">Empresarial</h3>
                  <p className="text-3xl font-bold text-foreground mb-4">R$ 997,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Tudo do Profissional +</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Multi-lojas</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> API completa</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Suporte prioritário</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Gestor dedicado</li>
                  </ul>
                  <Link to="/signup">
                    <Button variant="outline" className="w-full">Começar</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section: ROI */}
        <section id="roi" ref={roiRef.ref} className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">ROI - Retorno sobre Investimento</h2>
                <p className="text-muted-foreground">Quanto você ganha investindo no Mostralo</p>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-500/30 max-w-2xl mx-auto">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <p className="text-muted-foreground">Investimento Anual (Plano Essencial)</p>
                  <p className="text-2xl font-bold text-foreground">R$ 4.774,80</p>
                  <p className="text-xs text-muted-foreground">(R$ 397,90 x 12 meses)</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between p-3 bg-background rounded-lg">
                    <span className="text-muted-foreground">Economia taxas ML (R$ 50k/mês)</span>
                    <span className="font-bold text-green-600">R$ 115.224/ano</span>
                  </div>
                  <div className="flex justify-between p-3 bg-background rounded-lg">
                    <span className="text-muted-foreground">Vendas recuperadas WhatsApp</span>
                    <span className="font-bold text-green-600">R$ 28.800/ano</span>
                  </div>
                  <div className="flex justify-between p-3 bg-background rounded-lg">
                    <span className="text-muted-foreground">Aumento ticket médio</span>
                    <span className="font-bold text-green-600">R$ 12.000/ano</span>
                  </div>
                </div>

                <div className="text-center p-4 bg-green-500 rounded-lg text-white">
                  <p className="text-sm opacity-90">Total Retorno Anual</p>
                  <p className="text-3xl font-bold">R$ 156.024</p>
                  <p className="text-lg mt-2">ROI: <span className="font-bold">3.167%</span></p>
                  <p className="text-sm opacity-90 mt-1">A cada R$ 1 investido, você recebe R$ 31,67</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section: Timeline */}
        <section id="timeline" ref={timelineRef.ref} className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Implementação em 4 Semanas</h2>
                <p className="text-muted-foreground">Seu cronograma de sucesso</p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-background border-t-4 border-t-blue-500">
                <CardContent className="p-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mb-3">1</div>
                  <h3 className="font-bold text-foreground mb-2">Setup Inicial</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Criação da conta</li>
                    <li>• Configuração da loja</li>
                    <li>• Upload do catálogo</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background border-t-4 border-t-green-500">
                <CardContent className="p-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm mb-3">2</div>
                  <h3 className="font-bold text-foreground mb-2">Integração</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• WhatsApp Business</li>
                    <li>• Google Shopping ativo</li>
                    <li>• Instagram Shopping</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background border-t-4 border-t-purple-500">
                <CardContent className="p-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mb-3">3</div>
                  <h3 className="font-bold text-foreground mb-2">Marketing</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Primeira campanha recompra</li>
                    <li>• Posts nas redes</li>
                    <li>• Comunicado aos clientes</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background border-t-4 border-t-orange-500">
                <CardContent className="p-4">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm mb-3">4</div>
                  <h3 className="font-bold text-foreground mb-2">Otimização</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Análise de resultados</li>
                    <li>• Ajustes de mensagens</li>
                    <li>• Programa de fidelidade ativo</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section: CTA Final */}
        <section id="comecar" ref={comecarRef.ref} className="py-16 bg-gradient-to-br from-orange-500/10 via-background to-amber-500/10 dark:from-orange-500/5 dark:to-amber-500/5">
          <div className="container mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Dumbbell className="h-8 w-8 text-orange-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Pronto para Parar de Pagar 18% pro Mercado Livre?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Junte-se às lojas de suplementos que já economizam mais de R$ 100.000/ano 
              e recuperam clientes automaticamente com WhatsApp Marketing.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Link to="/signup">
                <Button size="lg" className="gap-2 bg-orange-600 hover:bg-orange-700">
                  Criar Minha Loja Agora <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href={getWhatsAppLink('suplementos_guia')} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950">
                  <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
                </Button>
              </a>
              <Link to="/#plans">
                <Button variant="outline" size="lg">
                  Ver Planos
                </Button>
              </Link>
            </div>

            {/* Botão Copiar Texto */}
            <Button
              variant="outline"
              onClick={copyPageText}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Texto Copiado!' : 'Copiar Todo o Texto para IA'}
            </Button>
          </div>
        </section>

        {/* Footer */}
        <DashboardFooter />
      </main>
    </div>
  );
}
