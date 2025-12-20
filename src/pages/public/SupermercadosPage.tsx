import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, Store, TrendingUp, Calculator, MapPin, Smartphone, 
  MessageCircle, Search, Instagram, Gift, Users, CreditCard, 
  BarChart3, Rocket, Phone, ChevronRight, Copy, Check, Menu, X,
  Building2, Percent, Clock, Heart, Star, Zap, Target, Award,
  ArrowRight, ShoppingBag, Truck, Bell, Calendar, DollarSign
} from 'lucide-react';
import { WhatsAppLeadButton } from '@/components/leads/WhatsAppLeadButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useMasterWhatsApp } from '@/hooks/useMasterWhatsApp';
import { toast } from 'sonner';

const sections = [
  { id: 'hero', label: 'Início', icon: Store },
  { id: 'grandes', label: 'Os Grandes', icon: Building2 },
  { id: 'mercado', label: 'O Mercado', icon: BarChart3 },
  { id: 'problema', label: 'O Problema', icon: TrendingUp },
  { id: 'oportunidade', label: 'Oportunidade', icon: Rocket },
  { id: 'economia', label: 'Economia', icon: Calculator },
  { id: 'vantagem', label: 'Vantagem Local', icon: MapPin },
  { id: 'catalogo', label: 'Catálogo', icon: Smartphone },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'google', label: 'Google Shopping', icon: Search },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'fidelidade', label: 'Fidelidade', icon: Gift },
  { id: 'casos', label: 'Casos', icon: Users },
  { id: 'planos', label: 'Planos', icon: CreditCard },
  { id: 'comparativo', label: 'Comparativo', icon: BarChart3 },
  { id: 'roi', label: 'ROI', icon: TrendingUp },
  { id: 'implementacao', label: 'Implementação', icon: Rocket },
  { id: 'contato', label: 'Contato', icon: Phone },
];

function Section({ id, children, className = '' }: { id: string; children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
  return (
    <section
      id={id}
      ref={ref}
      className={`py-16 md:py-24 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
    >
      {children}
    </section>
  );
}

export default function SupermercadosPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  
  // Calculator state
  const [faturamento, setFaturamento] = useState(300000);
  const [percentualDelivery, setPercentualDelivery] = useState(20);
  
  // Hook para buscar configurações de WhatsApp
  const { getWhatsAppLink } = useMasterWhatsApp();

  const deliveryValue = faturamento * (percentualDelivery / 100);
  const taxaMarketplace = deliveryValue * 0.27;
  const taxaEntrega = deliveryValue * 0.05;
  const totalPerdidoMes = taxaMarketplace + taxaEntrega;
  const totalPerdidoAno = totalPerdidoMes * 12;
  const mensalidadeMostralo = 397.90;
  const totalMostraloAno = mensalidadeMostralo * 12;
  const economiaAnual = totalPerdidoAno - totalMostraloAno;
  const ganhoWhatsApp = 4200 * 12;
  const roiPercentual = ((economiaAnual + ganhoWhatsApp - totalMostraloAno) / totalMostraloAno * 100).toFixed(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
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
      element.scrollIntoView({ behavior: 'smooth' });
      setSidebarOpen(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const copyPageText = () => {
    const text = `# PROPOSTA COMERCIAL - MOSTRALO PARA SUPERMERCADOS LOCAIS

## Seu Mercado de Bairro. Tecnologia de Rede Nacional. Zero Taxas.

Brasileiro vai 74x ao ano no mercado de bairro. É hora de transformar essa lealdade em vendas digitais sem pagar 27% ao iFood.

---

## OS GRANDES ESTÃO INVESTINDO BILHÕES EM VENDAS ONLINE

### Vendas Online das Grandes Redes (2024)

| Rede | E-commerce 2024 | % da Receita | Crescimento |
|------|-----------------|--------------|-------------|
| Carrefour Brasil | R$ 11,7 bilhões | 10,5% | +30,2% |
| GPA (Pão de Açúcar) | R$ 2,2 bilhões | 12,2% | +18% |
| Assaí | 14M usuários app | - | +32% |

### Investimento em Marketing Digital

- Carrefour: R$ 500.000+/mês em Google Ads
- GPA: R$ 300.000+/mês em Google Ads
- Assaí: R$ 200.000+/mês em Google Ads

A PERGUNTA: Você tem milhões para competir com eles em marketing?

COM MOSTRALO: Você aparece AO LADO deles no Google Shopping gastando R$ 0.

---

## O MERCADO DE SUPERMERCADOS NO BRASIL

### Dados do Setor 2024 (Fontes: ABRAS, NielsenIQ, IBGE)

| Métrica | Valor |
|---------|-------|
| Faturamento do setor | R$ 1,067 trilhão |
| Participação no PIB | 9,12% |
| Total de lojas | 424.120 |
| Visitas mercado bairro/ano | 74 vezes |
| Visitas grandes redes/ano | 16 vezes |
| Brasileiros comprando online | 75% |

O brasileiro prefere o mercado de bairro 4,6x mais que grandes redes. Mas 75% também querem a opção de comprar online.

---

## O PROBLEMA DOS SUPERMERCADOS LOCAIS

### Impacto das Taxas de Marketplace

- iFood/Rappi cobram 12-27% por pedido
- A cada R$ 1.000 vendidos = R$ 270 perdidos
- Cliente pertence ao marketplace, não a você
- Dados de vendas ficam com eles
- Sem canal direto de comunicação

### Cálculo Real de Perda

Supermercado com R$ 500 mil/mês e 20% delivery:
- Delivery mensal: R$ 100.000
- Taxa 27%: R$ 27.000/mês
- PERDA ANUAL: R$ 324.000

---

## A OPORTUNIDADE DIGITAL

### Crescimento do E-commerce de PMEs (Fonte: MDIC, IBGE)

| Métrica | Valor |
|---------|-------|
| Crescimento vendas online MPEs | +1.200% (2019-2024) |
| Empresas que vendem online | 79,2% |
| Lojas virtuais ativas no Brasil | 1,9 milhão |
| WhatsApp nas vendas de supermercado | 16% |

A revolução digital já aconteceu. 79,2% das empresas brasileiras já vendem online. A pergunta é: você está entre elas?

---

## ECONOMIA REAL - CALCULADORA

### Exemplo: Supermercado com R$ 300.000/mês (20% delivery)

**COM iFood/Rappi (27% taxa):**
- Delivery mensal: R$ 60.000
- Taxa marketplace: R$ 16.200/mês
- Taxa entrega: R$ 3.000/mês
- TOTAL PERDIDO: R$ 230.400/ano

**COM MOSTRALO + ENTREGADOR PRÓPRIO:**
- Mensalidade: R$ 397,90/mês
- Taxas: R$ 0
- TOTAL: R$ 4.775/ano

💰 ECONOMIA ANUAL: R$ 225.625
📊 ROI: 5.677%
⏱️ Payback: 8 dias

---

## A VANTAGEM DO MERCADO LOCAL

| Fator | Mercado de Bairro | Grande Rede |
|-------|-------------------|-------------|
| Frequência de visitas | 74x/ano | 16x/ano |
| Proximidade | 5-10 min | 20-40 min |
| Atendimento | Personalizado | Padronizado |
| Crédito/Fiado | Possível | Impossível |
| Conhece cliente | Pelo nome | Pelo CPF |
| Produtos locais | Sim | Limitado |

Você já tem lealdade. O Mostralo digitaliza essa relação sem intermediários.

---

## CATÁLOGO DIGITAL ESPECIALIZADO

### Categorias Pré-Configuradas

🥩 Açougue | 🥬 Hortifruti | 🧀 Frios | 🍞 Padaria
🧹 Limpeza | 🧴 Higiene | 🍺 Bebidas | 🥫 Mercearia

### Funcionalidades Específicas

- Foto de produtos por kg/unidade
- Controle de estoque em tempo real
- Promoções relâmpago
- Lista de compras salva
- Repetir último pedido

---

## WHATSAPP MARKETING - RECUPERAÇÃO AUTOMÁTICA DE CLIENTES

### O Problema Invisível

- 68% dos clientes nunca voltam após 30 dias
- Cada cliente perdido = R$ 350/mês em média
- 500 clientes × 50 perdidos/mês = R$ 17.500 evaporando

### Penetração do WhatsApp em Supermercados

"WhatsApp já representa 16% das vendas de supermercado online" - Kantar 2024

### Fluxo de Recuperação Automática

1. Sistema monitora última compra de cada cliente
2. Após X dias sem voltar, gatilho é acionado
3. Mensagem personalizada enviada no WhatsApp
4. Cliente recebe oferta exclusiva e retorna

### Exemplos de Mensagens Automáticas

**Dia 7 (Lembrete):**
"Oi [nome]! 🛒 Já está na hora de repor sua geladeira? Ofertas especiais hoje:
🥩 Picanha R$ 49,90/kg
🧀 Mussarela R$ 39,90/kg"

**Dia 15 (Saudade):**
"[nome], sentimos sua falta! 😊 Faz 15 dias. Ganhe 10% OFF na próxima compra acima de R$ 100. Use: VOLTEI10"

**Dia 30 (Urgência):**
"[nome], último lembrete! 🎁 15% OFF + Entrega Grátis. Código: SAUDADE15 | Válido 48h"

### Campanhas Automatizadas

| Campanha | Gatilho | Exemplo |
|----------|---------|---------|
| Feira da semana | Terça/Quarta | "🥬 Hortifruti fresquinho!" |
| Reposição | 15-30 dias | "Hora de repor a despensa?" |
| Fim de semana | Quinta-feira | "🍖 Churrasco de domingo?" |
| Aniversário | Data cadastrada | "🎂 Parabéns! 20% OFF" |

### KPIs Esperados

- 23% taxa de recuperação
- R$ 4.200/mês aumento médio
- 98% taxa de abertura
- 8h/mês economizadas

---

## GOOGLE SHOPPING - APAREÇA AO LADO DO CARREFOUR GRÁTIS

### O Problema Atual

Cliente pesquisa: "cerveja gelada perto de mim"
- Google mostra: Carrefour, Pão de Açúcar, iFood
- Seu mercado: INVISÍVEL

### Com Mostralo

Cliente pesquisa: "cerveja gelada perto de mim"
- Google mostra: SEU MERCADO com preço, foto, distância
- Cliente clica: vai direto para sua loja
- R$ 0 de taxa por clique

### Comparativo de Investimento em Marketing

| Quem Paga Google Ads | Investimento Mensal |
|----------------------|---------------------|
| Carrefour | R$ 500.000+/mês |
| GPA | R$ 300.000+/mês |
| Mercado local (tráfego pago) | R$ 2.000-10.000/mês |
| **Com Mostralo** | **R$ 0** |

### Como Funciona Tecnicamente

1. Mostralo gera feed XML com todos seus produtos
2. Feed é enviado ao Google Merchant Center
3. Google exibe produtos nas buscas locais
4. Cliente clica e compra direto no seu site
5. Zero intermediário, zero taxa

### Estatísticas de Busca Local

- "Mercado perto de mim" +200% buscas/ano
- 46% das buscas do Google são locais
- 78% das buscas locais resultam em compra

---

## INSTAGRAM SHOPPING - VITRINE DIGITAL DO BAIRRO

### O Cenário Atual

- 1,9 milhão de e-commerces ativos no Brasil
- 79,2% das empresas já vendem online
- Quem não está no Instagram Shopping perde para quem está

### Fluxo de Integração

1. Catálogo Mostralo → Sincronização automática
2. Meta Commerce Manager → Aprovação automática
3. Instagram Shop → Cliente navega
4. Checkout direto → Pedido no seu mercado

### Estatísticas do Instagram

- 70% pesquisam produtos no Instagram
- 95 milhões de usuários no Brasil
- 50% descobrem produtos via Stories
- 83% seguem empresas locais

### Estratégia de Conteúdo

| Tipo | Frequência | Objetivo |
|------|------------|----------|
| Ofertas do dia | Diário | Vendas |
| Hortifruti fresco | 3x/semana | Qualidade |
| Receita fácil | 2x/semana | Engajamento |
| Bastidores | 1x/semana | Humanização |
| Reels dica rápida | 2x/semana | Alcance |

### O que Mostralo Faz Automaticamente

- Sincroniza estoque em tempo real
- Atualiza preços e promoções
- Gera feed CSV para Meta Commerce
- Remove produtos sem estoque

---

## PROGRAMA DE FIDELIDADE PRÓPRIO

### Funcionalidades

- Pontos por compra: R$ 1 = 1 ponto
- Resgate: 1.000 pts = R$ 10 OFF
- Níveis: Bronze, Prata, Ouro
- Cashback: 2-5%
- Cupons exclusivos por histórico

### Por que isso importa

- Dados são SEUS (não do marketplace)
- Você conhece hábitos de compra
- Pode se comunicar diretamente
- Recompensa quem é fiel

---

## CASOS DE SUCESSO

"Saímos do iFood e economizamos R$ 8.500/mês. Agora conhecemos cada cliente pelo nome."
— Mercado São Jorge, São Paulo

"WhatsApp Marketing recuperou 340 clientes no primeiro mês. Vendemos R$ 12 mil a mais."
— Supermercado Familiar, Belo Horizonte

"Aparecemos no Google antes do Carrefour da região. Sem pagar nada por clique."
— Mercadinho do Zé, Curitiba

### Métricas do Segmento

- Ticket médio 25% maior que marketplace
- Recompra 3x mais frequente
- Margem 27% maior sem taxas
- NPS aumenta 40 pontos

---

## PLANOS E INVESTIMENTO

| Plano | Mensal | Ideal para |
|-------|--------|------------|
| Essencial | R$ 397,90 | Até 300 produtos |
| Profissional | R$ 597,90 | 300-1.000 produtos |
| Empresarial | R$ 997,90 | 1.000+ produtos |

### Todos os planos incluem:

- Catálogo digital ilimitado
- WhatsApp Marketing automatizado
- Google Shopping (feed XML)
- Instagram Shopping (feed CSV)
- Programa de fidelidade
- Relatórios de vendas
- Suporte WhatsApp

---

## COMPARATIVO DETALHADO

| Aspecto | iFood/Rappi | Mostralo |
|---------|-------------|----------|
| Taxa por pedido | 12-27% | 0% |
| Cliente pertence a | Marketplace | Você |
| Dados de vendas | Marketplace | Você |
| WhatsApp Marketing | ❌ | ✅ |
| Google Shopping | ❌ | ✅ |
| Instagram Shopping | ❌ | ✅ |
| Fidelidade própria | ❌ | ✅ |
| Personalização | Limitada | Total |
| Suporte | Robô | Humano |

---

## ROI CALCULADO

Para supermercado com R$ 300.000/mês (20% delivery):

- Investimento anual Mostralo: R$ 4.775
- Economia vs marketplace: R$ 225.625/ano
- Ganho adicional WhatsApp: R$ 50.400/ano

**ROI = 5.677%**
**Payback = 8 dias**

---

## IMPLEMENTAÇÃO SIMPLES

| Fase | Tempo | Atividade |
|------|-------|-----------|
| 1 | Dia 1-3 | Cadastro de produtos |
| 2 | Dia 4-5 | Configuração WhatsApp |
| 3 | Dia 6-7 | Ativação Google/Instagram |
| 4 | Dia 8+ | Operação plena |

### Suporte Incluído

- Treinamento personalizado
- Grupo WhatsApp de suporte
- Tutoriais em vídeo
- Migração de dados assistida

---

## PRÓXIMOS PASSOS

1. Agendar demonstração gratuita
2. Falar com consultor no WhatsApp
3. Ver tour virtual da plataforma
4. Receber proposta por email

📞 WhatsApp: (11) 94194-1427
🌐 mostralo.com.br

---

Fontes: ABRAS 2025, NielsenIQ 2024, IBGE 2024, MDIC 2024, Kantar 2024, SA Mais Varejo 2024
`;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Texto copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-xl">Mostralo</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-16 bottom-0 w-64 bg-background border-r border-border z-40 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <nav className="p-4 space-y-1 overflow-y-auto h-full">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSection === section.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pt-16">
        <div className="container mx-auto px-4 max-w-5xl">
          
          {/* Hero Section */}
          <Section id="hero" className="pt-24">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">
                <ShoppingCart className="w-4 h-4" />
                Para Supermercados Locais
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Seu Mercado de Bairro.
                <span className="block text-primary">Tecnologia de Rede Nacional.</span>
                <span className="block text-green-500">Zero Taxas.</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Brasileiro vai <span className="text-primary font-bold">74x ao ano</span> no mercado de bairro. 
                É hora de transformar essa lealdade em vendas digitais sem pagar 27% ao iFood.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8">
                {[
                  { value: 'R$ 1 tri', label: 'Setor 2024', icon: DollarSign },
                  { value: '424 mil', label: 'Lojas Brasil', icon: Store },
                  { value: '74x/ano', label: 'Visitas Bairro', icon: Users },
                  { value: '75%', label: 'Compram Online', icon: ShoppingBag },
                ].map((kpi, index) => (
                  <Card key={index} className="bg-card/50 border-border">
                    <CardContent className="p-4 text-center">
                      <kpi.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-primary">{kpi.value}</div>
                      <div className="text-xs text-muted-foreground">{kpi.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={() => scrollToSection('economia')}>
                  <Calculator className="w-5 h-5 mr-2" />
                  Ver Economia
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="https://wa.me/5511941941427" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Falar com Consultor
                  </a>
                </Button>
              </div>
            </div>
          </Section>

          {/* Os Grandes Section */}
          <Section id="grandes">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Os Grandes Estão Investindo <span className="text-primary">Bilhões</span> em Vendas Online
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Enquanto grandes redes faturam bilhões no digital, supermercados locais ficam invisíveis. Até agora.
                </p>
              </div>

              <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-500" />
                    Vendas Online das Grandes Redes (2024)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2">Rede</th>
                          <th className="text-right py-3 px-2">E-commerce 2024</th>
                          <th className="text-right py-3 px-2">% Receita</th>
                          <th className="text-right py-3 px-2">Crescimento</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-2 font-medium">Carrefour Brasil</td>
                          <td className="text-right py-3 px-2 text-primary font-bold">R$ 11,7 bilhões</td>
                          <td className="text-right py-3 px-2">10,5%</td>
                          <td className="text-right py-3 px-2 text-green-500">+30,2%</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-2 font-medium">GPA (Pão de Açúcar)</td>
                          <td className="text-right py-3 px-2 text-primary font-bold">R$ 2,2 bilhões</td>
                          <td className="text-right py-3 px-2">12,2%</td>
                          <td className="text-right py-3 px-2 text-green-500">+18%</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-2 font-medium">Assaí</td>
                          <td className="text-right py-3 px-2 text-primary font-bold">14M usuários app</td>
                          <td className="text-right py-3 px-2">-</td>
                          <td className="text-right py-3 px-2 text-green-500">+32%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-red-500" />
                    Investimento em Marketing Digital (Estimativa)
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { rede: 'Carrefour', valor: 'R$ 500.000+/mês' },
                      { rede: 'GPA', valor: 'R$ 300.000+/mês' },
                      { rede: 'Assaí', valor: 'R$ 200.000+/mês' },
                    ].map((item, index) => (
                      <div key={index} className="bg-background/50 rounded-lg p-4 text-center">
                        <div className="text-lg font-bold">{item.rede}</div>
                        <div className="text-red-500 font-bold">{item.valor}</div>
                        <div className="text-xs text-muted-foreground">em Google Ads</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold mb-2">A Pergunta:</h3>
                  <p className="text-lg text-muted-foreground mb-4">
                    Você tem milhões para competir com eles em marketing?
                  </p>
                  <div className="bg-green-500/20 rounded-lg p-4 inline-block">
                    <p className="text-lg font-bold text-green-500">
                      COM MOSTRALO: Você aparece AO LADO deles no Google Shopping gastando R$ 0.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* O Mercado Section */}
          <Section id="mercado">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  O Mercado de Supermercados no <span className="text-primary">Brasil</span>
                </h2>
                <p className="text-muted-foreground">Dados do setor 2024 | Fontes: ABRAS, NielsenIQ, IBGE</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { value: 'R$ 1,067 tri', label: 'Faturamento 2024', sublabel: 'ABRAS 2025' },
                  { value: '9,12%', label: 'do PIB', sublabel: 'ABRAS 2025' },
                  { value: '424.120', label: 'Lojas no Brasil', sublabel: 'ABRAS 2025' },
                  { value: '30 milhões', label: 'Consumidores', sublabel: 'Atendidos' },
                ].map((stat, index) => (
                  <Card key={index} className="bg-card/50">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                      <div className="text-sm font-medium">{stat.label}</div>
                      <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-gradient-to-r from-primary/10 to-green-500/10 border-primary/20">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-primary">74x</div>
                      <div className="text-lg font-medium">ao ano</div>
                      <div className="text-sm text-muted-foreground">Visitas ao mercado de bairro</div>
                      <div className="text-xs text-muted-foreground mt-1">Fonte: NielsenIQ</div>
                    </div>
                    <div className="text-center">
                      <div className="text-6xl font-bold text-muted-foreground">16x</div>
                      <div className="text-lg font-medium">ao ano</div>
                      <div className="text-sm text-muted-foreground">Visitas a grandes redes</div>
                      <div className="text-xs text-muted-foreground mt-1">Fonte: NielsenIQ</div>
                    </div>
                  </div>
                  <div className="text-center mt-6 pt-6 border-t border-border">
                    <p className="text-lg">
                      O brasileiro prefere o mercado de bairro <span className="text-primary font-bold">4,6x mais</span> que grandes redes.
                      <br />Mas <span className="text-green-500 font-bold">75%</span> também querem a opção de comprar online.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* O Problema Section */}
          <Section id="problema">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  O <span className="text-red-500">Problema</span> dos Supermercados Locais
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: Percent, title: 'Taxa 12-27%', desc: 'A cada R$ 1.000 vendidos, perde R$ 270' },
                  { icon: Users, title: 'Cliente do App', desc: 'Não sabe quem comprou' },
                  { icon: BarChart3, title: 'Dados Perdidos', desc: 'Ficam com o marketplace' },
                  { icon: Building2, title: 'Competição Desleal', desc: 'Grandes redes têm apps próprios' },
                  { icon: DollarSign, title: 'Marketing Caro', desc: 'Google Ads custa R$ 2-5/clique' },
                  { icon: MessageCircle, title: 'Sem Canal Direto', desc: 'Não consegue falar com cliente' },
                ].map((item, index) => (
                  <Card key={index} className="bg-red-500/5 border-red-500/20">
                    <CardContent className="p-6">
                      <item.icon className="w-8 h-8 text-red-500 mb-3" />
                      <h3 className="font-bold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-red-500/10 border-red-500/30">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold mb-4 text-red-500">💸 Cálculo Real de Perda</h3>
                  <p className="text-lg mb-4">
                    Supermercado com <span className="font-bold">R$ 500 mil/mês</span> e 20% em delivery:
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-background/50 rounded-lg p-4">
                      <div className="text-2xl font-bold">R$ 100.000</div>
                      <div className="text-sm text-muted-foreground">Delivery mensal</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-red-500">R$ 27.000</div>
                      <div className="text-sm text-muted-foreground">Taxa 27%/mês</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-red-500">R$ 324.000</div>
                      <div className="text-sm text-muted-foreground">PERDA ANUAL</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Oportunidade Section */}
          <Section id="oportunidade">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  A <span className="text-green-500">Oportunidade</span> Digital
                </h2>
                <p className="text-muted-foreground">Dados: MDIC, IBGE, Kantar 2024</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { value: '+1.200%', label: 'Crescimento MPEs', sublabel: 'Vendas online 2019-2024', color: 'text-green-500' },
                  { value: '79,2%', label: 'Empresas Online', sublabel: 'Já vendem na internet', color: 'text-blue-500' },
                  { value: '1,9 milhão', label: 'Lojas Virtuais', sublabel: 'Ativas no Brasil', color: 'text-purple-500' },
                  { value: '16%', label: 'Via WhatsApp', sublabel: 'Vendas de supermercado', color: 'text-primary' },
                ].map((stat, index) => (
                  <Card key={index} className="bg-card/50">
                    <CardContent className="p-6 text-center">
                      <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                      <div className="text-sm font-medium">{stat.label}</div>
                      <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20">
                <CardContent className="p-6 text-center">
                  <Zap className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">A revolução digital já aconteceu.</h3>
                  <p className="text-lg text-muted-foreground">
                    <span className="text-green-500 font-bold">79,2%</span> das empresas brasileiras já vendem online.
                    <br />A pergunta é: <span className="text-primary font-bold">você está entre elas?</span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Economia Section */}
          <Section id="economia">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  <span className="text-green-500">Economia</span> Real - Calculadora
                </h2>
                <p className="text-muted-foreground">Ajuste os valores e veja quanto você pode economizar</p>
              </div>

              <Card className="bg-card">
                <CardContent className="p-6 space-y-8">
                  {/* Sliders */}
                  <div className="space-y-6">
                    <div>
                      <label className="flex justify-between mb-2">
                        <span className="font-medium">Faturamento Mensal</span>
                        <span className="text-primary font-bold">{formatCurrency(faturamento)}</span>
                      </label>
                      <Slider
                        value={[faturamento]}
                        onValueChange={(v) => setFaturamento(v[0])}
                        min={50000}
                        max={2000000}
                        step={10000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>R$ 50 mil</span>
                        <span>R$ 2 milhões</span>
                      </div>
                    </div>

                    <div>
                      <label className="flex justify-between mb-2">
                        <span className="font-medium">Percentual em Delivery</span>
                        <span className="text-primary font-bold">{percentualDelivery}%</span>
                      </label>
                      <Slider
                        value={[percentualDelivery]}
                        onValueChange={(v) => setPercentualDelivery(v[0])}
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
                  </div>

                  {/* Results */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* iFood/Rappi */}
                    <Card className="bg-red-500/10 border-red-500/30">
                      <CardContent className="p-6">
                        <h3 className="font-bold text-red-500 mb-4 flex items-center gap-2">
                          <X className="w-5 h-5" />
                          COM iFood/Rappi (27%)
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Delivery mensal:</span>
                            <span className="font-medium">{formatCurrency(deliveryValue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Taxa marketplace (27%):</span>
                            <span className="font-medium text-red-500">{formatCurrency(taxaMarketplace)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Taxa entrega (5%):</span>
                            <span className="font-medium text-red-500">{formatCurrency(taxaEntrega)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-red-500/30">
                            <span className="font-bold">TOTAL PERDIDO/ANO:</span>
                            <span className="font-bold text-red-500">{formatCurrency(totalPerdidoAno)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Mostralo */}
                    <Card className="bg-green-500/10 border-green-500/30">
                      <CardContent className="p-6">
                        <h3 className="font-bold text-green-500 mb-4 flex items-center gap-2">
                          <Check className="w-5 h-5" />
                          COM MOSTRALO
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Mensalidade:</span>
                            <span className="font-medium">{formatCurrency(mensalidadeMostralo)}/mês</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Taxas por pedido:</span>
                            <span className="font-medium text-green-500">R$ 0</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Taxa de entrega:</span>
                            <span className="font-medium text-green-500">R$ 0</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-green-500/30">
                            <span className="font-bold">TOTAL/ANO:</span>
                            <span className="font-bold text-green-500">{formatCurrency(totalMostraloAno)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Summary */}
                  <Card className="bg-gradient-to-r from-primary/20 to-green-500/20 border-primary/30">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-4xl font-bold text-green-500">{formatCurrency(economiaAnual)}</div>
                          <div className="text-sm text-muted-foreground">Economia Anual</div>
                        </div>
                        <div>
                          <div className="text-4xl font-bold text-primary">{roiPercentual}%</div>
                          <div className="text-sm text-muted-foreground">ROI</div>
                        </div>
                        <div>
                          <div className="text-4xl font-bold text-primary">8 dias</div>
                          <div className="text-sm text-muted-foreground">Payback</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Vantagem Local Section */}
          <Section id="vantagem">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  A <span className="text-primary">Vantagem</span> do Mercado Local
                </h2>
                <p className="text-muted-foreground">Por que você já está na frente</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4">Fator</th>
                      <th className="text-center py-4 px-4 text-primary">Mercado de Bairro</th>
                      <th className="text-center py-4 px-4 text-muted-foreground">Grande Rede</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { fator: 'Frequência de visitas', bairro: '74x/ano', rede: '16x/ano' },
                      { fator: 'Proximidade', bairro: '5-10 min', rede: '20-40 min' },
                      { fator: 'Atendimento', bairro: 'Personalizado', rede: 'Padronizado' },
                      { fator: 'Crédito/Fiado', bairro: 'Possível', rede: 'Impossível' },
                      { fator: 'Conhece cliente', bairro: 'Pelo nome', rede: 'Pelo CPF' },
                      { fator: 'Produtos locais', bairro: 'Sim', rede: 'Limitado' },
                    ].map((row, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="py-4 px-4 font-medium">{row.fator}</td>
                        <td className="text-center py-4 px-4 text-primary font-bold">{row.bairro}</td>
                        <td className="text-center py-4 px-4 text-muted-foreground">{row.rede}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="p-6 text-center">
                  <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-xl font-medium">
                    Você já tem <span className="text-primary font-bold">lealdade</span>. 
                    <br />O Mostralo digitaliza essa relação <span className="text-green-500 font-bold">sem intermediários</span>.
                  </p>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Catálogo Section */}
          <Section id="catalogo">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Catálogo Digital <span className="text-primary">Especializado</span>
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { emoji: '🥩', title: 'Açougue', items: ['Cortes bovinos', 'Aves', 'Suínos', 'Peixes'] },
                  { emoji: '🥬', title: 'Hortifruti', items: ['Verduras', 'Legumes', 'Frutas', 'Temperos'] },
                  { emoji: '🧀', title: 'Frios/Laticínios', items: ['Queijos', 'Frios', 'Iogurtes', 'Manteiga'] },
                  { emoji: '🍞', title: 'Padaria', items: ['Pães', 'Bolos', 'Salgados', 'Doces'] },
                  { emoji: '🧹', title: 'Limpeza', items: ['Detergentes', 'Desinfetantes', 'Esponjas', 'Multiuso'] },
                  { emoji: '🧴', title: 'Higiene', items: ['Shampoos', 'Sabonetes', 'Papel', 'Fraldas'] },
                  { emoji: '🍺', title: 'Bebidas', items: ['Cervejas', 'Refrigerantes', 'Sucos', 'Águas'] },
                  { emoji: '🥫', title: 'Mercearia', items: ['Arroz/Feijão', 'Massas', 'Óleos', 'Enlatados'] },
                ].map((cat, index) => (
                  <Card key={index} className="bg-card/50">
                    <CardContent className="p-4">
                      <div className="text-3xl mb-2">{cat.emoji}</div>
                      <h3 className="font-bold mb-2">{cat.title}</h3>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {cat.items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid md:grid-cols-5 gap-4">
                {[
                  { icon: ShoppingBag, label: 'Foto por kg/unidade' },
                  { icon: BarChart3, label: 'Estoque em tempo real' },
                  { icon: Zap, label: 'Promoções relâmpago' },
                  { icon: Heart, label: 'Lista de compras salva' },
                  { icon: Clock, label: 'Repetir último pedido' },
                ].map((feat, index) => (
                  <Card key={index} className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <feat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                      <div className="text-xs font-medium">{feat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Section>

          {/* WhatsApp Marketing Section */}
          <Section id="whatsapp">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  <span className="text-green-500">WhatsApp Marketing</span> - Recuperação Automática
                </h2>
                <p className="text-muted-foreground">
                  "WhatsApp já representa <span className="text-green-500 font-bold">16%</span> das vendas de supermercado online" - Kantar 2024
                </p>
              </div>

              {/* O Problema Invisível */}
              <Card className="bg-red-500/10 border-red-500/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-red-500 mb-4">🚨 O Problema Invisível</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-background/50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-red-500">68%</div>
                      <div className="text-sm">dos clientes nunca voltam após 30 dias</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-red-500">R$ 350</div>
                      <div className="text-sm">perdidos por cliente/mês (média)</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-red-500">R$ 17.500</div>
                      <div className="text-sm">evaporando (500 clientes × 50 perdidos)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fluxo de Recuperação */}
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-green-500 mb-4">🔄 Fluxo de Recuperação Automática</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    {[
                      { step: '1', title: 'Monitora', desc: 'Sistema monitora última compra' },
                      { step: '2', title: 'Gatilho', desc: 'Após X dias, gatilho acionado' },
                      { step: '3', title: 'Mensagem', desc: 'WhatsApp personalizado enviado' },
                      { step: '4', title: 'Retorno', desc: 'Cliente recebe oferta e volta' },
                    ].map((item, index) => (
                      <div key={index} className="bg-background/50 rounded-lg p-4 text-center relative">
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white font-bold flex items-center justify-center mx-auto mb-2">
                          {item.step}
                        </div>
                        <div className="font-bold">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.desc}</div>
                        {index < 3 && (
                          <ArrowRight className="w-4 h-4 text-green-500 absolute -right-2 top-1/2 -translate-y-1/2 hidden md:block" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Exemplos de Mensagens */}
              <Card className="bg-card">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">💬 Exemplos de Mensagens Automáticas</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                      <div className="text-sm font-bold text-blue-500 mb-2">📅 Dia 7 (Lembrete)</div>
                      <p className="text-xs">
                        "Oi [nome]! 🛒 Já está na hora de repor sua geladeira? Ofertas especiais hoje:
                        🥩 Picanha R$ 49,90/kg
                        🧀 Mussarela R$ 39,90/kg"
                      </p>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                      <div className="text-sm font-bold text-yellow-500 mb-2">💛 Dia 15 (Saudade)</div>
                      <p className="text-xs">
                        "[nome], sentimos sua falta! 😊 Faz 15 dias. Ganhe 10% OFF na próxima compra acima de R$ 100. Use: VOLTEI10"
                      </p>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                      <div className="text-sm font-bold text-red-500 mb-2">🔥 Dia 30 (Urgência)</div>
                      <p className="text-xs">
                        "[nome], último lembrete! 🎁 15% OFF + Entrega Grátis. Código: SAUDADE15 | Válido 48h"
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Campanhas Automatizadas */}
              <Card className="bg-card">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">📊 Campanhas Automatizadas para Supermercados</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2">Campanha</th>
                          <th className="text-left py-2 px-2">Gatilho</th>
                          <th className="text-left py-2 px-2">Exemplo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { camp: 'Feira da semana', gatilho: 'Terça/Quarta', exemplo: '🥬 Hortifruti fresquinho!' },
                          { camp: 'Reposição', gatilho: '15-30 dias', exemplo: 'Hora de repor a despensa?' },
                          { camp: 'Fim de semana', gatilho: 'Quinta-feira', exemplo: '🍖 Churrasco de domingo?' },
                          { camp: 'Aniversário', gatilho: 'Data cadastrada', exemplo: '🎂 Parabéns! 20% OFF' },
                          { camp: 'Promoção relâmpago', gatilho: 'Manual', exemplo: '⚡ Só hoje: Cerveja R$ 3,99' },
                        ].map((row, index) => (
                          <tr key={index} className="border-b border-border/50">
                            <td className="py-2 px-2 font-medium">{row.camp}</td>
                            <td className="py-2 px-2">{row.gatilho}</td>
                            <td className="py-2 px-2 text-muted-foreground">{row.exemplo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: '23%', label: 'Taxa de Recuperação' },
                  { value: 'R$ 4.200', label: 'Aumento Médio/Mês' },
                  { value: '98%', label: 'Taxa de Abertura' },
                  { value: '8h/mês', label: 'Economizadas' },
                ].map((kpi, index) => (
                  <Card key={index} className="bg-green-500/10 border-green-500/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-500">{kpi.value}</div>
                      <div className="text-xs text-muted-foreground">{kpi.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Section>

          {/* Google Shopping Section */}
          <Section id="google">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  <span className="text-blue-500">Google Shopping</span> - Apareça ao Lado do Carrefour
                </h2>
                <p className="text-muted-foreground">Sem pagar por clique</p>
              </div>

              {/* O Problema Atual */}
              <Card className="bg-red-500/10 border-red-500/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-red-500 mb-4">❌ O Problema Atual</h3>
                  <div className="space-y-2">
                    <p className="font-medium">Cliente pesquisa: "cerveja gelada perto de mim"</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-500 text-sm">Google mostra: Carrefour</span>
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-500 text-sm">Pão de Açúcar</span>
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-500 text-sm">iFood</span>
                    </div>
                    <p className="text-red-500 font-bold">Seu mercado: INVISÍVEL</p>
                  </div>
                </CardContent>
              </Card>

              {/* Com Mostralo */}
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-green-500 mb-4">✅ Com Mostralo</h3>
                  <div className="space-y-2">
                    <p className="font-medium">Cliente pesquisa: "cerveja gelada perto de mim"</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm font-bold">Google mostra: SEU MERCADO</span>
                      <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">com preço</span>
                      <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">foto</span>
                      <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">distância</span>
                    </div>
                    <p className="text-green-500 font-bold">R$ 0 de taxa por clique</p>
                  </div>
                </CardContent>
              </Card>

              {/* Comparativo de Investimento */}
              <Card className="bg-card">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">💰 Comparativo de Investimento em Marketing</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2">Quem Paga Google Ads</th>
                          <th className="text-right py-3 px-2">Investimento Mensal</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-2">Carrefour</td>
                          <td className="text-right py-3 px-2 text-red-500 font-bold">R$ 500.000+/mês</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-2">GPA</td>
                          <td className="text-right py-3 px-2 text-red-500 font-bold">R$ 300.000+/mês</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-2">Mercado local (tráfego pago)</td>
                          <td className="text-right py-3 px-2 text-yellow-500 font-bold">R$ 2.000-10.000/mês</td>
                        </tr>
                        <tr className="bg-green-500/10">
                          <td className="py-3 px-2 font-bold">Com Mostralo</td>
                          <td className="text-right py-3 px-2 text-green-500 font-bold text-lg">R$ 0</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Como Funciona */}
              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-blue-500 mb-4">⚙️ Como Funciona Tecnicamente</h3>
                  <div className="grid md:grid-cols-5 gap-4">
                    {[
                      { step: '1', title: 'Feed XML', desc: 'Mostralo gera com seus produtos' },
                      { step: '2', title: 'Merchant Center', desc: 'Feed enviado ao Google' },
                      { step: '3', title: 'Buscas Locais', desc: 'Google exibe seus produtos' },
                      { step: '4', title: 'Clique Direto', desc: 'Cliente vai para sua loja' },
                      { step: '5', title: 'Zero Taxa', desc: 'Sem intermediário' },
                    ].map((item, index) => (
                      <div key={index} className="bg-background/50 rounded-lg p-4 text-center">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center mx-auto mb-2">
                          {item.step}
                        </div>
                        <div className="font-bold text-sm">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { value: '+200%', label: 'Buscas "mercado perto de mim"', sublabel: 'Crescimento anual' },
                  { value: '46%', label: 'Buscas locais', sublabel: 'do total do Google' },
                  { value: '78%', label: 'Resultam em compra', sublabel: 'Buscas locais' },
                ].map((stat, index) => (
                  <Card key={index} className="bg-blue-500/10 border-blue-500/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-500">{stat.value}</div>
                      <div className="text-sm font-medium">{stat.label}</div>
                      <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Section>

          {/* Instagram Shopping Section */}
          <Section id="instagram">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  <span className="text-pink-500">Instagram Shopping</span> - Vitrine Digital do Bairro
                </h2>
              </div>

              {/* Cenário */}
              <Card className="bg-purple-500/10 border-purple-500/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-purple-500 mb-4">📊 O Cenário Atual</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-background/50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-purple-500">1,9 milhão</div>
                      <div className="text-sm">de e-commerces ativos no Brasil</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-purple-500">79,2%</div>
                      <div className="text-sm">das empresas já vendem online</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-red-500">❌</div>
                      <div className="text-sm">Quem não está, perde para quem está</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fluxo de Integração */}
              <Card className="bg-pink-500/10 border-pink-500/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-pink-500 mb-4">🔄 Fluxo de Integração</h3>
                  <div className="grid md:grid-cols-5 gap-4">
                    {[
                      { step: '1', title: 'Catálogo Mostralo', icon: ShoppingBag },
                      { step: '2', title: 'Meta Commerce', icon: Smartphone },
                      { step: '3', title: 'Instagram Shop', icon: Instagram },
                      { step: '4', title: 'Cliente Navega', icon: Users },
                      { step: '5', title: 'Pedido Direto', icon: ShoppingCart },
                    ].map((item, index) => (
                      <div key={index} className="bg-background/50 rounded-lg p-4 text-center relative">
                        <div className="w-8 h-8 rounded-full bg-pink-500 text-white font-bold flex items-center justify-center mx-auto mb-2">
                          {item.step}
                        </div>
                        <item.icon className="w-6 h-6 text-pink-500 mx-auto mb-2" />
                        <div className="text-xs font-medium">{item.title}</div>
                        {index < 4 && (
                          <ArrowRight className="w-4 h-4 text-pink-500 absolute -right-2 top-1/2 -translate-y-1/2 hidden md:block" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas do Instagram */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: '70%', label: 'Pesquisam produtos no Instagram' },
                  { value: '95M', label: 'Usuários no Brasil' },
                  { value: '50%', label: 'Descobrem via Stories' },
                  { value: '83%', label: 'Seguem empresas locais' },
                ].map((stat, index) => (
                  <Card key={index} className="bg-pink-500/10 border-pink-500/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-pink-500">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Estratégia de Conteúdo */}
              <Card className="bg-card">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">📸 Estratégia de Conteúdo para Supermercados</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2">Tipo</th>
                          <th className="text-left py-2 px-2">Frequência</th>
                          <th className="text-left py-2 px-2">Objetivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { tipo: 'Ofertas do dia', freq: 'Diário', objetivo: 'Vendas' },
                          { tipo: 'Hortifruti fresco', freq: '3x/semana', objetivo: 'Qualidade' },
                          { tipo: 'Receita fácil', freq: '2x/semana', objetivo: 'Engajamento' },
                          { tipo: 'Bastidores', freq: '1x/semana', objetivo: 'Humanização' },
                          { tipo: 'Reels dica rápida', freq: '2x/semana', objetivo: 'Alcance' },
                        ].map((row, index) => (
                          <tr key={index} className="border-b border-border/50">
                            <td className="py-2 px-2 font-medium">{row.tipo}</td>
                            <td className="py-2 px-2">{row.freq}</td>
                            <td className="py-2 px-2 text-muted-foreground">{row.objetivo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* O que Mostralo faz */}
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-green-500 mb-4">✅ O que Mostralo Faz Automaticamente</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      'Sincroniza estoque em tempo real',
                      'Atualiza preços e promoções',
                      'Gera feed CSV para Meta Commerce',
                      'Remove produtos sem estoque',
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-2 bg-background/50 rounded-lg p-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Fidelidade Section */}
          <Section id="fidelidade">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Programa de <span className="text-primary">Fidelidade</span> Próprio
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: Star, title: 'Pontos por Compra', desc: 'R$ 1 = 1 ponto' },
                  { icon: Gift, title: 'Resgate de Prêmios', desc: '1.000 pts = R$ 10 OFF' },
                  { icon: Award, title: 'Níveis de Cliente', desc: 'Bronze, Prata, Ouro' },
                ].map((item, index) => (
                  <Card key={index} className="bg-primary/5 border-primary/20">
                    <CardContent className="p-6 text-center">
                      <item.icon className="w-10 h-10 text-primary mx-auto mb-3" />
                      <h3 className="font-bold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold mb-4">💡 Por que isso importa?</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { icon: Users, label: 'Dados são SEUS' },
                      { icon: BarChart3, label: 'Conhece hábitos de compra' },
                      { icon: MessageCircle, label: 'Comunicação direta' },
                      { icon: Heart, label: 'Recompensa fiéis' },
                    ].map((item, index) => (
                      <div key={index} className="flex flex-col items-center gap-2">
                        <item.icon className="w-8 h-8 text-primary" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Casos de Sucesso Section */}
          <Section id="casos">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Casos de <span className="text-green-500">Sucesso</span>
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    quote: 'Saímos do iFood e economizamos R$ 8.500/mês. Agora conhecemos cada cliente pelo nome.',
                    author: 'Mercado São Jorge',
                    location: 'São Paulo',
                  },
                  {
                    quote: 'WhatsApp Marketing recuperou 340 clientes no primeiro mês. Vendemos R$ 12 mil a mais.',
                    author: 'Supermercado Familiar',
                    location: 'Belo Horizonte',
                  },
                  {
                    quote: 'Aparecemos no Google antes do Carrefour da região. Sem pagar nada por clique.',
                    author: 'Mercadinho do Zé',
                    location: 'Curitiba',
                  },
                ].map((testimonial, index) => (
                  <Card key={index} className="bg-card">
                    <CardContent className="p-6">
                      <div className="text-4xl text-primary mb-4">"</div>
                      <p className="text-sm mb-4">{testimonial.quote}</p>
                      <div className="text-sm">
                        <span className="font-bold">{testimonial.author}</span>
                        <span className="text-muted-foreground"> — {testimonial.location}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: '+25%', label: 'Ticket médio vs marketplace' },
                  { value: '3x', label: 'Mais recompra' },
                  { value: '+27%', label: 'Margem sem taxas' },
                  { value: '+40 pts', label: 'NPS médio' },
                ].map((stat, index) => (
                  <Card key={index} className="bg-green-500/10 border-green-500/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-500">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Section>

          {/* Planos Section */}
          <Section id="planos">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Planos e <span className="text-primary">Investimento</span>
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { name: 'Essencial', price: 'R$ 397,90', ideal: 'Até 300 produtos', popular: false },
                  { name: 'Profissional', price: 'R$ 597,90', ideal: '300-1.000 produtos', popular: true },
                  { name: 'Empresarial', price: 'R$ 997,90', ideal: '1.000+ produtos', popular: false },
                ].map((plan, index) => (
                  <Card key={index} className={`relative ${plan.popular ? 'border-primary border-2' : ''}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                        MAIS POPULAR
                      </div>
                    )}
                    <CardContent className="p-6 text-center">
                      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                      <div className="text-3xl font-bold text-primary mb-1">{plan.price}</div>
                      <div className="text-sm text-muted-foreground mb-4">/mês</div>
                      <div className="text-sm">{plan.ideal}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-card">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-center">✅ Todos os planos incluem:</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      'Catálogo digital ilimitado',
                      'WhatsApp Marketing automatizado',
                      'Google Shopping (feed XML)',
                      'Instagram Shopping (feed CSV)',
                      'Programa de fidelidade',
                      'Relatórios de vendas',
                      'Suporte WhatsApp',
                      'Treinamento incluído',
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Comparativo Section */}
          <Section id="comparativo">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Comparativo <span className="text-primary">Detalhado</span>
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4">Aspecto</th>
                      <th className="text-center py-4 px-4 text-red-500">iFood/Rappi</th>
                      <th className="text-center py-4 px-4 text-green-500">Mostralo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { aspecto: 'Taxa por pedido', ifood: '12-27%', mostralo: '0%' },
                      { aspecto: 'Cliente pertence a', ifood: 'Marketplace', mostralo: 'Você' },
                      { aspecto: 'Dados de vendas', ifood: 'Marketplace', mostralo: 'Você' },
                      { aspecto: 'WhatsApp Marketing', ifood: '❌', mostralo: '✅' },
                      { aspecto: 'Google Shopping', ifood: '❌', mostralo: '✅' },
                      { aspecto: 'Instagram Shopping', ifood: '❌', mostralo: '✅' },
                      { aspecto: 'Fidelidade própria', ifood: '❌', mostralo: '✅' },
                      { aspecto: 'Personalização', ifood: 'Limitada', mostralo: 'Total' },
                      { aspecto: 'Suporte', ifood: 'Robô', mostralo: 'Humano' },
                    ].map((row, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="py-3 px-4 font-medium">{row.aspecto}</td>
                        <td className="text-center py-3 px-4 text-red-500">{row.ifood}</td>
                        <td className="text-center py-3 px-4 text-green-500 font-bold">{row.mostralo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>

          {/* ROI Section */}
          <Section id="roi">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  <span className="text-green-500">ROI</span> Calculado
                </h2>
                <p className="text-muted-foreground">Para supermercado com R$ 300.000/mês (20% delivery)</p>
              </div>

              <Card className="bg-gradient-to-br from-green-500/10 to-primary/10 border-green-500/30">
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-3 gap-8 text-center">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Investimento anual Mostralo</div>
                      <div className="text-3xl font-bold">{formatCurrency(totalMostraloAno)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Economia vs marketplace</div>
                      <div className="text-3xl font-bold text-green-500">{formatCurrency(economiaAnual)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Ganho WhatsApp Marketing</div>
                      <div className="text-3xl font-bold text-green-500">{formatCurrency(ganhoWhatsApp)}</div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-border">
                    <div className="grid md:grid-cols-2 gap-8 text-center">
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">ROI</div>
                        <div className="text-5xl font-bold text-primary">{roiPercentual}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Payback</div>
                        <div className="text-5xl font-bold text-primary">8 dias</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Implementação Section */}
          <Section id="implementacao">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Implementação <span className="text-primary">Simples</span>
                </h2>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { fase: '1', tempo: 'Dia 1-3', atividade: 'Cadastro de produtos' },
                  { fase: '2', tempo: 'Dia 4-5', atividade: 'Configuração WhatsApp' },
                  { fase: '3', tempo: 'Dia 6-7', atividade: 'Ativação Google/Instagram' },
                  { fase: '4', tempo: 'Dia 8+', atividade: 'Operação plena' },
                ].map((item, index) => (
                  <Card key={index} className="bg-card">
                    <CardContent className="p-6 text-center">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-3">
                        {item.fase}
                      </div>
                      <div className="text-sm text-muted-foreground">{item.tempo}</div>
                      <div className="font-bold">{item.atividade}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-center">🎓 Suporte Incluído</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      '📞 Treinamento personalizado',
                      '📱 Grupo WhatsApp de suporte',
                      '📚 Tutoriais em vídeo',
                      '🔧 Migração de dados assistida',
                    ].map((item, index) => (
                      <div key={index} className="text-center text-sm">{item}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Contato Section */}
          <Section id="contato">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Próximos <span className="text-primary">Passos</span>
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Button size="lg" className="h-16 bg-green-600 hover:bg-green-700" asChild>
                  <a href={getWhatsAppLink('supermercados')} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-6 h-6 mr-2" />
                    Falar com Consultor
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="h-16" asChild>
                  <a href={getWhatsAppLink('supermercados')} target="_blank" rel="noopener noreferrer">
                    <Calendar className="w-6 h-6 mr-2" />
                    Agendar Demonstração
                  </a>
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground pt-8">
                <p>📞 WhatsApp: (11) 94194-1427</p>
                <p>🌐 mostralo.com.br</p>
              </div>
            </div>
          </Section>

          {/* Copy Button */}
          <div className="py-8 text-center">
            <Button
              size="lg"
              variant="outline"
              onClick={copyPageText}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-green-500" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copiar Todo o Texto
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Copie o conteúdo formatado para usar em IA ou apresentações
            </p>
          </div>

          {/* Footer */}
          <footer className="py-12 border-t border-border text-center text-sm text-muted-foreground">
            <p>Fontes: ABRAS 2025, NielsenIQ 2024, IBGE 2024, MDIC 2024, Kantar 2024, SA Mais Varejo 2024</p>
            <p className="mt-2">© {new Date().getFullYear()} Mostralo. Todos os direitos reservados.</p>
          </footer>

        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <WhatsAppLeadButton />
    </div>
  );
}
