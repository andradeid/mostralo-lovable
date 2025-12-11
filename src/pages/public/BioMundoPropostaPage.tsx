import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';
import {
  Leaf, TrendingUp, DollarSign, Store, ShoppingCart, MessageCircle,
  Search, Instagram, Bot, Award, CreditCard, BarChart3, Calculator,
  Rocket, Phone, Mail, ChevronRight, CheckCircle2, XCircle, ArrowRight,
  Target, Users, Package, Percent, Clock, Shield, Star, Building2,
  Copy, Menu, X, ExternalLink, Zap, PiggyBank, Trophy, MapPin
} from 'lucide-react';

const BioMundoPropostaPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('oportunidade');
  const [faturamentoLoja, setFaturamentoLoja] = useState([100000]);
  const [percentualDelivery, setPercentualDelivery] = useState([30]);
  
  const sectionRefs = {
    oportunidade: useRef<HTMLElement>(null),
    problema: useRef<HTMLElement>(null),
    numeros: useRef<HTMLElement>(null),
    economiaLoja: useRef<HTMLElement>(null),
    impactoRede: useRef<HTMLElement>(null),
    catalogo: useRef<HTMLElement>(null),
    whatsapp: useRef<HTMLElement>(null),
    google: useRef<HTMLElement>(null),
    instagram: useRef<HTMLElement>(null),
    bia: useRef<HTMLElement>(null),
    casos: useRef<HTMLElement>(null),
    planos: useRef<HTMLElement>(null),
    comparativo: useRef<HTMLElement>(null),
    roi: useRef<HTMLElement>(null),
    implantacao: useRef<HTMLElement>(null),
    contato: useRef<HTMLElement>(null),
  };

  const scrollToSection = (sectionId: string) => {
    const ref = sectionRefs[sectionId as keyof typeof sectionRefs];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
    setMobileMenuOpen(false);
  };

  const menuItems = [
    { id: 'oportunidade', label: 'A Oportunidade', icon: Star },
    { id: 'problema', label: 'O Problema', icon: XCircle },
    { id: 'numeros', label: 'Números Bio Mundo', icon: BarChart3 },
    { id: 'economiaLoja', label: 'Economia por Loja', icon: Calculator },
    { id: 'impactoRede', label: 'Impacto na Rede', icon: TrendingUp },
    { id: 'catalogo', label: 'Catálogo Digital', icon: Package },
    { id: 'whatsapp', label: 'WhatsApp Marketing', icon: MessageCircle },
    { id: 'google', label: 'Google Shopping', icon: Search },
    { id: 'instagram', label: 'Instagram Shopping', icon: Instagram },
    { id: 'bia', label: 'Integração BIA', icon: Bot },
    { id: 'casos', label: 'Casos de Sucesso', icon: Trophy },
    { id: 'planos', label: 'Planos', icon: CreditCard },
    { id: 'comparativo', label: 'Comparativo', icon: BarChart3 },
    { id: 'roi', label: 'ROI Calculado', icon: PiggyBank },
    { id: 'implantacao', label: 'Implantação', icon: Rocket },
    { id: 'contato', label: 'Contato', icon: Phone },
  ];

  // Cálculos dinâmicos
  const deliveryMensal = (faturamentoLoja[0] * percentualDelivery[0]) / 100;
  const taxaIfood = deliveryMensal * 0.27;
  const taxaEntrega = deliveryMensal * 0.05;
  const custoIfoodMensal = taxaIfood + taxaEntrega;
  const custoIfoodAnual = custoIfoodMensal * 12;
  const custoMostraloAnual = 397.90 * 12;
  const economiaPorLoja = custoIfoodAnual - custoMostraloAnual;

  const copyPageText = () => {
    const textContent = `
# PROPOSTA EXCLUSIVA PARA BIO MUNDO
## Mostralo - Delivery + Marketing Digital em Uma Só Plataforma

---

## 🌟 A OPORTUNIDADE ÚNICA

A Bio Mundo está em um momento estratégico único:
- 170+ lojas em operação em 22 estados + DF
- Faturamento R$ 250 milhões (2024) → R$ 300M (2025) → R$ 500M (2026)
- BIA (Inteligência Artificial) em desenvolvimento para atendimento
- 4x vencedora do Prêmio ABF de Excelência em Franchising

**Oportunidade:** Eliminar intermediários no delivery e integrar marketing digital à operação.

---

## 🔴 O PROBLEMA ATUAL

### Lojas Bio Mundo no iFood pagando 27% de taxa:
- Bio Mundo - Beiramar Shopping (Florianópolis)
- Outras unidades também presentes em marketplaces

### Impacto Real:
| Problema | Consequência |
|----------|--------------|
| Taxa iFood 27% | R$ 27 perdidos a cada R$ 100 vendidos |
| Cliente do iFood | Não pertence à Bio Mundo |
| Dados de venda | Pertencem ao iFood |
| Recompra | Cliente volta pelo app, não pela loja |

### Estatística Chocante:
Se apenas 10% do faturamento da rede (R$ 25M) passar por marketplaces:
**Bio Mundo perde R$ 6,75 MILHÕES/ANO em taxas**

---

## 📊 NÚMEROS DA BIO MUNDO (RECONHECIMENTO)

| Métrica | Valor | Fonte |
|---------|-------|-------|
| Lojas em operação | 170+ | biomundo.com.br |
| Estados + DF | 22 + 1 | Site oficial |
| Faturamento 2024 | R$ 250 milhões | Mercado & Consumo |
| Projeção 2025 | R$ 300 milhões | FoodBiz Brasil |
| Meta 2026 | R$ 500 milhões | Entrevista Edmar Mothé |
| SKUs no portfólio | 3.000+ | Site oficial |
| Produtos marca própria | 180 | Mercado & Consumo |
| % vendas a granel | 20% | FoodBiz Brasil |
| % suplementos esportivos | ~50% | Mercado & Consumo |
| Prêmios ABF | 4 consecutivos | Site oficial |

---

## 💰 ECONOMIA POR LOJA

### Simulação (Faturamento R$ 100.000/mês, 30% delivery):

**COM IFOOD (27% + 5% entrega):**
- Delivery mensal: R$ 30.000
- Taxa iFood (27%): R$ 8.100/mês
- Taxa entrega (5%): R$ 1.500/mês
- **TOTAL PERDIDO: R$ 9.600/mês = R$ 115.200/ano**

**COM MOSTRALO + ENTREGADOR PRÓPRIO:**
- Mensalidade: R$ 397,90/mês
- Taxas por pedido: R$ 0
- **TOTAL: R$ 4.775/ano**

### 💰 ECONOMIA POR LOJA: R$ 110.425/ano

---

## 🚀 IMPACTO NA REDE (170+ LOJAS)

| Cenário | Lojas | Economia/Loja | Total Anual |
|---------|-------|---------------|-------------|
| Conservador | 50 | R$ 110.425 | R$ 5,5 milhões |
| Moderado | 100 | R$ 110.425 | R$ 11 milhões |
| Agressivo | 170 | R$ 110.425 | R$ 18,7 milhões |

**R$ 18,7 milhões reinvestidos = 74 novas lojas Bio Slim (R$ 250k cada)**

---

## 📱 CATÁLOGO DIGITAL ESPECIALIZADO

### Categorias pré-configuradas para Bio Mundo:

**🥜 Granel:** Castanhas, Grãos, Farinhas, Temperos, Chás
**💊 Suplementos:** Whey Protein, Creatina, BCAA, Vitaminas, Ômega 3
**🧴 Cosméticos:** Dermocosméticos, Shampoos naturais, Óleos essenciais, Skincare
**🍫 Funcionais:** Barras proteicas, Snacks fit, Chocolates 70%, Granolas

### Funcionalidades:
✅ Fotos de produtos a granel com preço/kg
✅ Indicação "Sem glúten", "Vegano", "Zero açúcar"
✅ Produtos marca própria destacados
✅ Sugestão de kits (ex: "Kit Treino Completo")

---

## 💬 WHATSAPP MARKETING PARA BIO MUNDO

### Campanhas Automatizadas:

| Campanha | Gatilho | Exemplo |
|----------|---------|---------|
| Reposição Suplementos | 30 dias após compra | "Seu Whey está acabando? 🏋️" |
| Lembrete Vitaminas | Fim do pote | "Hora de repor suas vitaminas!" |
| Promoções Sazonais | Verão/Inverno | "Protetor solar em promoção ☀️" |
| Aniversário | Data cadastrada | "Parabéns! 15% OFF hoje 🎂" |
| Recuperação | 15 dias sem compra | "Sentimos sua falta!" |

### KPIs Esperados:
- 📊 23% taxa de recuperação de clientes
- 📈 R$ 2.400/mês aumento médio por loja
- 💬 98% taxa de abertura no WhatsApp

---

## 🔍 GOOGLE SHOPPING ZERO TAXA

### Como funciona:
1. Cliente pesquisa: "creatina [cidade]" ou "whey protein perto de mim"
2. Google mostra produtos da Bio Mundo local
3. Cliente compra direto - R$ 0 de taxa por clique

### Estatísticas do segmento:
- 🔍 "Suplementos perto de mim" cresce 180% ao ano
- 🔍 "Loja de produtos naturais" +150% de buscas

---

## 📸 INSTAGRAM SHOPPING

### Estratégia para Bio Mundo:
- Posts de produtos com preço e link de compra
- Stories "Chegou!" com novidades
- Compra direto pelo Instagram

### Conteúdo sugerido:
- "Antes e Depois" de clientes fitness
- Dicas de nutricionistas parceiros
- Receitas com produtos Bio Mundo

---

## 🤖 INTEGRAÇÃO COM BIA (IA DA BIO MUNDO)

### Oportunidade Estratégica:
A Bio Mundo está desenvolvendo a BIA para atendimento e vendas.

### Proposta de Integração:
BIA (Atendimento) → Mostralo (Catálogo + Pedidos) → Entrega Própria

### Benefícios:
✅ BIA faz atendimento via chat
✅ Mostralo processa pedidos e pagamentos
✅ Dados unificados em uma plataforma
✅ Franqueado tem visão completa

---

## 📈 CASOS DE SUCESSO NO SEGMENTO

### Depoimentos:
- "Saí do iFood e economizo R$ 8 mil/mês" - Casa Natural, SP
- "WhatsApp Marketing recuperou 23% dos clientes" - Mundo Fit, RJ
- "Apareço no Google antes das grandes redes" - Empório Verde, MG

### Métricas:
- Ticket médio 35% maior que iFood
- Recompra 4x mais frequente
- Margem 27% maior sem taxas

---

## 💳 PLANOS E INVESTIMENTO

| Plano | Mensal/Loja | Anual/Loja | Para 170 Lojas |
|-------|-------------|------------|----------------|
| Essencial | R$ 397,90 | R$ 4.775 | R$ 811.750/ano |
| Profissional | R$ 597,90 | R$ 7.175 | R$ 1.219.750/ano |
| Empresarial | R$ 997,90 | R$ 11.975 | R$ 2.035.750/ano |

### Proposta para rede:
- 📉 Desconto progressivo por volume
- 🎯 Implantação faseada
- 🤝 Suporte dedicado para franqueadora
- 📊 Dashboard consolidado para matriz

---

## 📊 COMPARATIVO DETALHADO

| Aspecto | iFood | Mostralo |
|---------|-------|----------|
| Taxa por pedido | 27% | 0% |
| Cliente pertence a | iFood | Bio Mundo |
| Dados de vendas | iFood | Bio Mundo |
| Marketing WhatsApp | ❌ | ✅ Incluído |
| Google Shopping | ❌ | ✅ Incluído |
| Instagram Shopping | ❌ | ✅ Incluído |
| Personalização | Limitada | Total |
| Integração com BIA | ❌ | ✅ Possível |

---

## 📈 ROI CALCULADO

### Por Loja:
- Investimento anual: R$ 4.775
- Economia vs iFood: R$ 115.200/ano
- Ganho WhatsApp: R$ 28.800/ano
- **ROI: 2.918%**
- **Payback: 15 dias**

### Para toda a rede (170 lojas):
- Investimento total: R$ 811.750/ano
- Economia total: R$ 24.480.000/ano
- **ROI da rede: 2.915%**

---

## 🚀 PROPOSTA DE IMPLANTAÇÃO

| Fase | Período | Lojas | Objetivo |
|------|---------|-------|----------|
| Piloto | Mês 1-2 | 5-10 | Validar modelo |
| Expansão 1 | Mês 3-4 | 30 | Refinar processos |
| Expansão 2 | Mês 5-6 | 70 | Escalar |
| Rollout | Mês 7-12 | 170+ | Cobertura total |

### Suporte oferecido:
- Gerente de conta dedicado
- Treinamento para franqueados
- Customização de categorias
- Relatórios consolidados
- Integração com sistemas Bio Mundo

---

## 📞 CONTATO DIRETO

**Próximos Passos:**
1. Agendar apresentação com equipe comercial
2. Receber proposta formal em PDF
3. Visitar loja piloto (demonstração ao vivo)
4. Falar com consultor no WhatsApp

---

Proposta gerada por Mostralo - Delivery + Marketing Digital em Uma Só Plataforma
    `.trim();

    navigator.clipboard.writeText(textContent);
    toast.success('Texto copiado! Cole no ChatGPT ou Claude para análise.');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo Bio Mundo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#2D5016] flex items-center justify-center">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-lg hidden sm:block text-[#2D5016] dark:text-green-400">Bio Mundo</span>
            </div>
            <span className="text-muted-foreground">+</span>
            {/* Logo Mostralo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center">
                <Store className="h-6 w-6 text-[#f97316]" />
              </div>
              <span className="font-bold text-lg hidden sm:block text-[#f97316]">Mostralo</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 border-r border-border bg-background/95 backdrop-blur-sm flex-col overflow-y-auto">
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === item.id
                    ? 'bg-[#2D5016]/10 text-[#2D5016] dark:bg-green-500/10 dark:text-green-400 font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-sm overflow-y-auto">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                    activeSection === item.id
                      ? 'bg-[#2D5016]/10 text-[#2D5016] dark:bg-green-500/10 dark:text-green-400 font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="lg:ml-64 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#2D5016] via-[#3d6b1e] to-[#4a8225] text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-30" />
          
          <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-6 bg-white/20 text-white border-white/30 text-sm px-4 py-2">
                🌿 Proposta Exclusiva para Bio Mundo
              </Badge>
              
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                170 Lojas. R$ 500 Milhões em 2026.
                <span className="block text-[#f97316]">Zero Taxas de Marketplace.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Como a Bio Mundo pode economizar <strong>R$ 6,75 milhões/ano</strong> deixando de pagar 27% ao iFood
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-[#f97316] hover:bg-[#ea580c] text-white"
                  onClick={() => scrollToSection('economiaLoja')}
                >
                  Ver Economia Detalhada
                  <Calculator className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  onClick={() => scrollToSection('contato')}
                >
                  Agendar Apresentação
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 1: A Oportunidade */}
        <section ref={sectionRefs.oportunidade} id="oportunidade" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <SectionHeader
              badge="🌟 A Oportunidade"
              title="Momento Estratégico Único"
              description="A Bio Mundo está no momento perfeito para eliminar intermediários"
            />
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              {[
                { icon: Store, value: '170+', label: 'Lojas em Operação', sublabel: '22 estados + DF' },
                { icon: TrendingUp, value: 'R$ 500M', label: 'Meta 2026', sublabel: 'Crescimento acelerado' },
                { icon: Bot, value: 'BIA', label: 'IA em Desenvolvimento', sublabel: 'Oportunidade de integração' },
                { icon: Award, value: '4x', label: 'Prêmio ABF', sublabel: 'Excelência em franchising' },
              ].map((item, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow border-[#2D5016]/20">
                  <CardContent className="pt-6">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#2D5016]/10 flex items-center justify-center">
                      <item.icon className="h-7 w-7 text-[#2D5016] dark:text-green-400" />
                    </div>
                    <p className="text-3xl font-bold text-[#2D5016] dark:text-green-400">{item.value}</p>
                    <p className="font-medium mt-1">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.sublabel}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seção 2: O Problema */}
        <section ref={sectionRefs.problema} id="problema" className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <SectionHeader
              badge="🔴 O Problema"
              title="Lojas Bio Mundo no iFood Pagando 27%"
              description="A cada R$ 100 vendidos, R$ 27 vão para o iFood"
            />
            
            <div className="grid lg:grid-cols-2 gap-8 mt-12">
              <Card className="border-red-500/30 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <XCircle className="h-5 w-5" />
                    Problemas do Modelo Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { problem: 'Taxa iFood 27%', impact: 'R$ 27 perdidos a cada R$ 100 vendidos' },
                    { problem: 'Cliente do iFood', impact: 'Não pertence à Bio Mundo' },
                    { problem: 'Dados de venda', impact: 'Pertencem ao iFood, não ao franqueado' },
                    { problem: 'Recompra', impact: 'Cliente volta pelo app, não pela loja' },
                    { problem: 'Marketing', impact: 'Você paga para o iFood crescer' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background">
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">{item.problem}</p>
                        <p className="text-sm text-muted-foreground">{item.impact}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card className="border-[#f97316]/30 bg-[#f97316]/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <DollarSign className="h-5 w-5" />
                    Estatística Chocante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Se apenas <strong>10% do faturamento</strong> da rede (R$ 25M) passar por marketplaces:
                    </p>
                    <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/30">
                      <p className="text-4xl md:text-5xl font-bold text-red-600 dark:text-red-400">
                        R$ 6,75 MILHÕES
                      </p>
                      <p className="text-lg mt-2 text-red-600/80 dark:text-red-400/80">
                        perdidos em taxas por ano
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Fonte: Cálculo baseado em taxa média de 27% do iFood
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Seção 3: Números da Bio Mundo */}
        <section ref={sectionRefs.numeros} id="numeros" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <SectionHeader
              badge="📊 Reconhecimento"
              title="Conhecemos a Bio Mundo"
              description="Preparamos esta proposta específica para sua operação"
            />
            
            <Card className="mt-12">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2D5016]/10">
                    <tr>
                      <th className="text-left p-4 font-semibold">Métrica</th>
                      <th className="text-left p-4 font-semibold">Valor</th>
                      <th className="text-left p-4 font-semibold hidden md:table-cell">Fonte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { metric: 'Lojas em operação', value: '170+', source: 'biomundo.com.br' },
                      { metric: 'Estados + DF', value: '22 + 1', source: 'Site oficial' },
                      { metric: 'Faturamento 2024', value: 'R$ 250 milhões', source: 'Mercado & Consumo' },
                      { metric: 'Projeção 2025', value: 'R$ 300 milhões', source: 'FoodBiz Brasil' },
                      { metric: 'Meta 2026', value: 'R$ 500 milhões', source: 'Entrevista Edmar Mothé' },
                      { metric: 'SKUs no portfólio', value: '3.000+', source: 'Site oficial' },
                      { metric: 'Produtos marca própria', value: '180', source: 'Mercado & Consumo' },
                      { metric: '% vendas a granel', value: '20%', source: 'FoodBiz Brasil' },
                      { metric: '% suplementos esportivos', value: '~50%', source: 'Mercado & Consumo' },
                      { metric: 'Prêmios ABF', value: '4 consecutivos', source: 'Site oficial' },
                    ].map((row, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="p-4">{row.metric}</td>
                        <td className="p-4 font-semibold text-[#2D5016] dark:text-green-400">{row.value}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{row.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Seção 4: Economia por Loja (Calculadora Interativa) */}
        <section ref={sectionRefs.economiaLoja} id="economiaLoja" className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <SectionHeader
              badge="💰 Calculadora"
              title="Economia por Loja Bio Mundo"
              description="Simule a economia real para sua unidade"
            />
            
            <div className="grid lg:grid-cols-2 gap-8 mt-12">
              <Card>
                <CardHeader>
                  <CardTitle>Configure sua Simulação</CardTitle>
                  <CardDescription>Ajuste os valores conforme sua realidade</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Faturamento mensal da loja</label>
                      <span className="text-sm font-bold text-[#2D5016] dark:text-green-400">
                        {formatCurrency(faturamentoLoja[0])}
                      </span>
                    </div>
                    <Slider
                      value={faturamentoLoja}
                      onValueChange={setFaturamentoLoja}
                      min={50000}
                      max={300000}
                      step={10000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>R$ 50 mil</span>
                      <span>R$ 300 mil</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">% do faturamento via delivery</label>
                      <span className="text-sm font-bold text-[#2D5016] dark:text-green-400">
                        {percentualDelivery[0]}%
                      </span>
                    </div>
                    <Slider
                      value={percentualDelivery}
                      onValueChange={setPercentualDelivery}
                      min={10}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>10%</span>
                      <span>50%</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery mensal</span>
                      <span className="font-medium">{formatCurrency(deliveryMensal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                <Card className="border-red-500/30 bg-red-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                      <XCircle className="h-5 w-5" />
                      COM IFOOD (27% + 5% entrega)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa iFood (27%)</span>
                      <span className="font-medium text-red-600">{formatCurrency(taxaIfood)}/mês</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa entrega (5%)</span>
                      <span className="font-medium text-red-600">{formatCurrency(taxaEntrega)}/mês</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>TOTAL PERDIDO</span>
                      <span className="text-red-600">{formatCurrency(custoIfoodAnual)}/ano</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      COM MOSTRALO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mensalidade</span>
                      <span className="font-medium">R$ 397,90/mês</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxas por pedido</span>
                      <span className="font-medium text-green-600">R$ 0</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>TOTAL</span>
                      <span className="text-green-600">{formatCurrency(custoMostraloAnual)}/ano</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-[#f97316] bg-gradient-to-br from-[#f97316]/10 to-[#f97316]/5">
                  <CardContent className="py-6 text-center">
                    <p className="text-muted-foreground mb-2">💰 ECONOMIA POR LOJA</p>
                    <p className="text-4xl md:text-5xl font-bold text-[#f97316]">
                      {formatCurrency(economiaPorLoja)}
                    </p>
                    <p className="text-lg text-[#f97316]/80">por ano</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 5: Impacto na Rede */}
        <section ref={sectionRefs.impactoRede} id="impactoRede" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <SectionHeader
              badge="🚀 Escala"
              title="Impacto na Rede (170+ Lojas)"
              description="Projeção de economia para toda a franquia"
            />
            
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {[
                { cenario: 'Conservador', lojas: 50, economia: 50 * 110425, cor: 'yellow' },
                { cenario: 'Moderado', lojas: 100, economia: 100 * 110425, cor: 'green' },
                { cenario: 'Agressivo', lojas: 170, economia: 170 * 110425, cor: 'orange' },
              ].map((item, index) => (
                <Card key={index} className={`border-${item.cor}-500/30 hover:shadow-lg transition-shadow`}>
                  <CardHeader>
                    <Badge variant="outline" className="w-fit mb-2">{item.cenario}</Badge>
                    <CardTitle className="text-lg">{item.lojas} Lojas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-[#2D5016] dark:text-green-400">
                      {formatCurrency(item.economia)}
                    </p>
                    <p className="text-sm text-muted-foreground">economia por ano</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card className="mt-8 bg-gradient-to-r from-[#2D5016]/10 to-[#f97316]/10 border-[#2D5016]/30">
              <CardContent className="py-6 text-center">
                <p className="text-lg text-muted-foreground mb-2">
                  💡 R$ 18,7 milhões reinvestidos em expansão =
                </p>
                <p className="text-2xl md:text-3xl font-bold text-[#2D5016] dark:text-green-400">
                  74 novas lojas Bio Slim (R$ 250k cada)
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Seção 6: Catálogo Digital */}
        <section ref={sectionRefs.catalogo} id="catalogo" className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <SectionHeader
              badge="📱 Catálogo"
              title="Catálogo Digital Especializado"
              description="Categorias pré-configuradas para Bio Mundo"
            />
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              {[
                { icon: '🥜', titulo: 'Granel', itens: ['Castanhas', 'Grãos', 'Farinhas', 'Temperos', 'Chás'] },
                { icon: '💊', titulo: 'Suplementos', itens: ['Whey Protein', 'Creatina', 'BCAA', 'Vitaminas', 'Ômega 3'] },
                { icon: '🧴', titulo: 'Cosméticos', itens: ['Dermocosméticos', 'Shampoos naturais', 'Óleos essenciais', 'Skincare'] },
                { icon: '🍫', titulo: 'Funcionais', itens: ['Barras proteicas', 'Snacks fit', 'Chocolates 70%', 'Granolas'] },
              ].map((cat, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{cat.icon}</span>
                      {cat.titulo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {cat.itens.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                'Fotos com preço/kg',
                '"Sem glúten", "Vegano"',
                'Marca própria destacada',
                'Sugestão de kits',
                'Comparativo nutricional',
              ].map((func, index) => (
                <Card key={index} className="bg-[#2D5016]/5 border-[#2D5016]/20">
                  <CardContent className="py-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#2D5016] dark:text-green-400 shrink-0" />
                    <span className="text-sm font-medium">{func}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seção 7: WhatsApp Marketing */}
        <section ref={sectionRefs.whatsapp} id="whatsapp" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <SectionHeader
              badge="💬 WhatsApp"
              title="WhatsApp Marketing para Bio Mundo"
              description="Campanhas automatizadas que vendem enquanto você dorme"
            />
            
            <div className="grid lg:grid-cols-2 gap-8 mt-12">
              <Card>
                <CardHeader>
                  <CardTitle>Campanhas Automatizadas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { campanha: 'Reposição Suplementos', gatilho: '30 dias após compra', exemplo: '"Seu Whey está acabando? 🏋️"' },
                    { campanha: 'Lembrete Vitaminas', gatilho: 'Fim do pote', exemplo: '"Hora de repor suas vitaminas!"' },
                    { campanha: 'Promoções Sazonais', gatilho: 'Verão/Inverno', exemplo: '"Protetor solar em promoção ☀️"' },
                    { campanha: 'Aniversário', gatilho: 'Data cadastrada', exemplo: '"Parabéns! 15% OFF hoje 🎂"' },
                    { campanha: 'Recuperação', gatilho: '15 dias sem compra', exemplo: '"Sentimos sua falta!"' },
                  ].map((item, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{item.campanha}</span>
                        <Badge variant="secondary" className="text-xs">{item.gatilho}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground italic">{item.exemplo}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-green-600 dark:text-green-400">KPIs Esperados</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {[
                      { valor: '23%', label: 'Taxa de recuperação' },
                      { valor: 'R$ 2.400', label: 'Aumento médio/mês' },
                      { valor: '98%', label: 'Taxa de abertura' },
                      { valor: '8h', label: 'Economia/mês' },
                    ].map((kpi, index) => (
                      <div key={index} className="text-center p-4 rounded-lg bg-background">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{kpi.valor}</p>
                        <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                        <MessageCircle className="h-8 w-8 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">Valor de mercado</p>
                        <p className="text-2xl font-bold text-[#f97316]">R$ 800 - 1.500/mês</p>
                        <p className="text-sm text-muted-foreground">Incluído em todos os planos Mostralo</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 8: Google Shopping */}
        <section ref={sectionRefs.google} id="google" className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <SectionHeader
              badge="🔍 Google"
              title="Google Shopping Zero Taxa"
              description="Apareça nas buscas sem pagar por clique"
            />
            
            <div className="grid lg:grid-cols-2 gap-8 mt-12">
              <Card>
                <CardHeader>
                  <CardTitle>Como Funciona</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { step: '1', desc: 'Cliente pesquisa: "creatina [cidade]" ou "whey protein perto de mim"' },
                    { step: '2', desc: 'Google mostra produtos da Bio Mundo local com foto, preço e estoque' },
                    { step: '3', desc: 'Cliente compra direto - R$ 0 de taxa por clique' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-[#4285F4] text-white flex items-center justify-center font-bold shrink-0">
                        {item.step}
                      </div>
                      <p>{item.desc}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-blue-600 dark:text-blue-400">Estatísticas do Segmento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { busca: '"Suplementos perto de mim"', crescimento: '+180% ao ano' },
                    { busca: '"Loja de produtos naturais"', crescimento: '+150% de buscas' },
                    { busca: '"Whey protein preço"', crescimento: 'Milhões de buscas/mês' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-background">
                      <span className="text-sm">{item.busca}</span>
                      <Badge className="bg-blue-500">{item.crescimento}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Seção 9: Instagram Shopping */}
        <section ref={sectionRefs.instagram} id="instagram" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <SectionHeader
              badge="📸 Instagram"
              title="Instagram Shopping"
              description="Venda diretamente pelo Instagram da loja"
            />
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              {[
                { icon: ShoppingCart, titulo: 'Posts com Preço', desc: 'Produtos com link direto de compra' },
                { icon: Zap, titulo: 'Stories "Chegou!"', desc: 'Novidades com swipe up' },
                { icon: BarChart3, titulo: 'Métricas', desc: 'Engajamento por produto' },
                { icon: CreditCard, titulo: 'Checkout', desc: 'Compra sem sair do app' },
              ].map((item, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow border-pink-500/20">
                  <CardContent className="pt-6">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                      <item.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">{item.titulo}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seção 10: Integração BIA */}
        <section ref={sectionRefs.bia} id="bia" className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <SectionHeader
              badge="🤖 Integração"
              title="Integração com BIA (IA da Bio Mundo)"
              description="Potencialize a inteligência artificial que vocês estão desenvolvendo"
            />
            
            <div className="max-w-4xl mx-auto mt-12">
              <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
                <CardContent className="py-8">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-center md:text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Bot className="h-8 w-8 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">BIA</p>
                        <p className="text-sm text-muted-foreground">Atendimento</p>
                      </div>
                    </div>
                    
                    <ArrowRight className="h-8 w-8 text-muted-foreground hidden md:block" />
                    <ChevronRight className="h-8 w-8 text-muted-foreground md:hidden rotate-90" />
                    
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-[#f97316]/20 flex items-center justify-center">
                        <Store className="h-8 w-8 text-[#f97316]" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">Mostralo</p>
                        <p className="text-sm text-muted-foreground">Catálogo + Pedidos</p>
                      </div>
                    </div>
                    
                    <ArrowRight className="h-8 w-8 text-muted-foreground hidden md:block" />
                    <ChevronRight className="h-8 w-8 text-muted-foreground md:hidden rotate-90" />
                    
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Package className="h-8 w-8 text-green-500" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">Entrega</p>
                        <p className="text-sm text-muted-foreground">Própria</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {[
                  'BIA faz atendimento via chat',
                  'Mostralo processa pedidos',
                  'Dados unificados',
                  'Visão completa franqueado',
                ].map((benefit, index) => (
                  <Card key={index} className="bg-background">
                    <CardContent className="py-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Seção 11: Casos de Sucesso */}
        <section ref={sectionRefs.casos} id="casos" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <SectionHeader
              badge="📈 Resultados"
              title="Casos de Sucesso no Segmento"
              description="Lojas de produtos naturais que já migraram"
            />
            
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {[
                { depoimento: 'Saí do iFood e economizo R$ 8 mil/mês. Agora conheço meus clientes.', loja: 'Casa Natural', cidade: 'São Paulo' },
                { depoimento: 'WhatsApp Marketing recuperou 23% dos clientes que não voltavam.', loja: 'Mundo Fit', cidade: 'Rio de Janeiro' },
                { depoimento: 'Apareço no Google antes das grandes redes do bairro.', loja: 'Empório Verde', cidade: 'Belo Horizonte' },
              ].map((item, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic mb-4">"{item.depoimento}"</p>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[#2D5016]/10 flex items-center justify-center">
                        <Store className="h-5 w-5 text-[#2D5016]" />
                      </div>
                      <div>
                        <p className="font-medium">{item.loja}</p>
                        <p className="text-sm text-muted-foreground">{item.cidade}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="grid sm:grid-cols-3 gap-6 mt-8">
              {[
                { valor: '+35%', label: 'Ticket médio maior que iFood' },
                { valor: '4x', label: 'Recompra mais frequente' },
                { valor: '+27%', label: 'Margem maior sem taxas' },
              ].map((metric, index) => (
                <Card key={index} className="text-center bg-[#2D5016]/5 border-[#2D5016]/20">
                  <CardContent className="py-6">
                    <p className="text-3xl font-bold text-[#2D5016] dark:text-green-400">{metric.valor}</p>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seção 12: Planos */}
        <section ref={sectionRefs.planos} id="planos" className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <SectionHeader
              badge="💳 Investimento"
              title="Planos e Investimento"
              description="Proposta especial para rede Bio Mundo"
            />
            
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {[
                { nome: 'Essencial', mensal: 397.90, anual: 4775, rede: 811750 },
                { nome: 'Profissional', mensal: 597.90, anual: 7175, rede: 1219750, popular: true },
                { nome: 'Empresarial', mensal: 997.90, anual: 11975, rede: 2035750 },
              ].map((plano, index) => (
                <Card key={index} className={`relative ${plano.popular ? 'border-[#f97316] shadow-lg' : ''}`}>
                  {plano.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f97316]">
                      Recomendado
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle>{plano.nome}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div>
                      <p className="text-3xl font-bold">R$ {plano.mensal.toFixed(2).replace('.', ',')}</p>
                      <p className="text-sm text-muted-foreground">por loja/mês</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Anual por loja</p>
                      <p className="font-semibold">{formatCurrency(plano.anual)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Para 170 lojas</p>
                      <p className="font-bold text-[#2D5016] dark:text-green-400">
                        {formatCurrency(plano.rede)}/ano
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {[
                { icon: Percent, text: 'Desconto progressivo por volume' },
                { icon: Target, text: 'Implantação faseada' },
                { icon: Users, text: 'Suporte dedicado para franqueadora' },
                { icon: BarChart3, text: 'Dashboard consolidado para matriz' },
              ].map((item, index) => (
                <Card key={index} className="bg-background">
                  <CardContent className="py-4 flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-[#f97316] shrink-0" />
                    <span className="text-sm">{item.text}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seção 13: Comparativo */}
        <section ref={sectionRefs.comparativo} id="comparativo" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <SectionHeader
              badge="📊 Comparativo"
              title="iFood vs Mostralo"
              description="Comparação detalhada entre as plataformas"
            />
            
            <Card className="mt-12 overflow-hidden">
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-semibold">Aspecto</th>
                      <th className="text-center p-4 font-semibold text-red-600">iFood</th>
                      <th className="text-center p-4 font-semibold text-green-600">Mostralo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { aspecto: 'Taxa por pedido', ifood: '27%', mostralo: '0%' },
                      { aspecto: 'Cliente pertence a', ifood: 'iFood', mostralo: 'Bio Mundo' },
                      { aspecto: 'Dados de vendas', ifood: 'iFood', mostralo: 'Bio Mundo' },
                      { aspecto: 'Marketing WhatsApp', ifood: false, mostralo: true },
                      { aspecto: 'Google Shopping', ifood: false, mostralo: true },
                      { aspecto: 'Instagram Shopping', ifood: false, mostralo: true },
                    { aspecto: 'Personalização', ifood: 'Limitada', mostralo: 'Total' },
                      { aspecto: 'Integração com BIA', ifood: false, mostralo: true },
                    ].map((row, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="p-4 font-medium">{row.aspecto}</td>
                        <td className="p-4 text-center">
                          {typeof row.ifood === 'boolean' ? (
                            row.ifood ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-red-600 font-medium">{row.ifood}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {typeof row.mostralo === 'boolean' ? (
                            row.mostralo ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-green-600 font-medium">{row.mostralo}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Seção 14: ROI */}
        <section ref={sectionRefs.roi} id="roi" className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <SectionHeader
              badge="📈 ROI"
              title="Retorno Sobre Investimento"
              description="Números que comprovam o valor da migração"
            />
            
            <div className="grid lg:grid-cols-2 gap-8 mt-12">
              <Card className="border-[#f97316]/30">
                <CardHeader>
                  <CardTitle>Por Loja</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Investimento anual Mostralo</span>
                    <span className="font-medium">R$ 4.775</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Economia vs iFood</span>
                    <span className="font-medium text-green-600">R$ 115.200/ano</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ganho adicional WhatsApp</span>
                    <span className="font-medium text-green-600">R$ 28.800/ano</span>
                  </div>
                  <Separator />
                  <div className="text-center py-4 bg-[#f97316]/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">ROI</p>
                    <p className="text-4xl font-bold text-[#f97316]">2.918%</p>
                  </div>
                  <div className="text-center py-4 bg-green-500/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Payback</p>
                    <p className="text-4xl font-bold text-green-600">15 dias</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-[#2D5016]/30 bg-gradient-to-br from-[#2D5016]/5 to-[#2D5016]/10">
                <CardHeader>
                  <CardTitle className="text-[#2D5016] dark:text-green-400">Para Toda a Rede (170 lojas)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Investimento total</span>
                    <span className="font-medium">R$ 811.750/ano</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Economia total</span>
                    <span className="font-medium text-green-600">R$ 19.584.000/ano</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ganho WhatsApp rede</span>
                    <span className="font-medium text-green-600">R$ 4.896.000/ano</span>
                  </div>
                  <Separator />
                  <div className="text-center py-6 bg-[#2D5016]/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Retorno Total Anual</p>
                    <p className="text-5xl font-bold text-[#2D5016] dark:text-green-400">
                      R$ 24,4 M
                    </p>
                  </div>
                  <div className="text-center py-4 bg-white/50 dark:bg-white/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">ROI da Rede</p>
                    <p className="text-4xl font-bold text-[#2D5016] dark:text-green-400">2.915%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Seção 15: Implantação */}
        <section ref={sectionRefs.implantacao} id="implantacao" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <SectionHeader
              badge="🚀 Cronograma"
              title="Proposta de Implantação"
              description="Rollout faseado para máxima eficiência"
            />
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              {[
                { fase: 'Piloto', periodo: 'Mês 1-2', lojas: '5-10', objetivo: 'Validar modelo', cor: 'blue' },
                { fase: 'Expansão 1', periodo: 'Mês 3-4', lojas: '30', objetivo: 'Refinar processos', cor: 'green' },
                { fase: 'Expansão 2', periodo: 'Mês 5-6', lojas: '70', objetivo: 'Escalar', cor: 'orange' },
                { fase: 'Rollout', periodo: 'Mês 7-12', lojas: '170+', objetivo: 'Cobertura total', cor: 'purple' },
              ].map((item, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-${item.cor}-500`} />
                  <CardHeader>
                    <Badge variant="outline" className="w-fit mb-2">{item.fase}</Badge>
                    <CardTitle className="text-lg">{item.periodo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-[#2D5016] dark:text-green-400">{item.lojas} lojas</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.objetivo}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Suporte Oferecido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    'Gerente de conta dedicado',
                    'Treinamento para franqueados',
                    'Customização de categorias',
                    'Relatórios consolidados',
                    'Integração com sistemas',
                  ].map((suporte, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-sm">{suporte}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Seção 16: Contato */}
        <section ref={sectionRefs.contato} id="contato" className="py-16 md:py-24 bg-gradient-to-br from-[#2D5016] via-[#3d6b1e] to-[#4a8225] text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-6 bg-white/20 text-white border-white/30">
                📞 Próximos Passos
              </Badge>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Vamos Transformar a Bio Mundo Juntos?
              </h2>
              
              <p className="text-lg text-white/90 mb-8">
                Agende uma apresentação exclusiva para a franqueadora e descubra como economizar R$ 18,7 milhões por ano.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                <Button
                  size="lg"
                  className="bg-white text-[#2D5016] hover:bg-white/90"
                  onClick={() => window.open('https://wa.me/5561994009368?text=Olá! Sou da Bio Mundo e gostaria de agendar uma apresentação do Mostralo.', '_blank')}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  WhatsApp
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  onClick={() => window.open('mailto:contato@mostralo.com.br?subject=Proposta Bio Mundo', '_blank')}
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Email
                </Button>
              </div>
              
              <div className="mt-12 grid sm:grid-cols-4 gap-6 text-center">
                {[
                  { icon: Phone, label: 'Apresentação', desc: 'Agendar reunião' },
                  { icon: Mail, label: 'Proposta PDF', desc: 'Receber documento' },
                  { icon: MapPin, label: 'Loja Piloto', desc: 'Visitar demo' },
                  { icon: MessageCircle, label: 'Consultor', desc: 'Tirar dúvidas' },
                ].map((item, index) => (
                  <div key={index} className="p-4 rounded-lg bg-white/10">
                    <item.icon className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-white/70">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Botão Copiar Texto */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 text-center">
            <Button
              size="lg"
              variant="outline"
              onClick={copyPageText}
              className="gap-2"
            >
              <Copy className="h-5 w-5" />
              Copiar Todo o Texto
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Cole no ChatGPT ou Claude para análise e personalização
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 bg-muted/50 border-t">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#2D5016] flex items-center justify-center">
                  <Leaf className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-[#2D5016] dark:text-green-400">Bio Mundo</span>
              </div>
              <span className="text-muted-foreground">+</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white shadow flex items-center justify-center">
                  <Store className="h-4 w-4 text-[#f97316]" />
                </div>
                <span className="font-semibold text-[#f97316]">Mostralo</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Proposta exclusiva • Delivery + Marketing Digital em Uma Só Plataforma
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

// Componente auxiliar para headers de seção
interface SectionHeaderProps {
  badge: string;
  title: string;
  description: string;
}

const SectionHeader = ({ badge, title, description }: SectionHeaderProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useScrollReveal({ ref });

  return (
    <div ref={ref} className="text-center max-w-3xl mx-auto">
      <Badge variant="outline" className="mb-4">{badge}</Badge>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default BioMundoPropostaPage;
