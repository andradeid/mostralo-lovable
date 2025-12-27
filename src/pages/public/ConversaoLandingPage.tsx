import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Tablet, 
  BarChart3,
  UtensilsCrossed,
  Pill,
  Dog,
  Store,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  Star
} from "lucide-react";
import { usePageSEO } from "@/hooks/useSEO";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";

const ConversaoLandingPage = () => {
  usePageSEO({
    title: "Mostralo - Pare de Pagar Taxas Abusivas | Sistema All-in-One",
    description: "Elimine comissões de 25% do iFood. Sistema completo para delivery, restaurantes, pet shops e varejo. Taxa zero, automação total e recuperação de clientes.",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const painPoints = [
    {
      icon: TrendingDown,
      title: "Taxas Abusivas",
      description: "No iFood, você trabalha para eles crescerem. No Mostralo, a taxa é 0%.",
      color: "text-red-500"
    },
    {
      icon: Zap,
      title: "Caos Operacional",
      description: "Pare de usar 5 sistemas diferentes. Centralize tudo em uma única tela.",
      color: "text-yellow-500"
    },
    {
      icon: Users,
      title: "Abandono de Clientes",
      description: "68% dos clientes não voltam. Nós mudamos isso com automação.",
      color: "text-blue-500"
    }
  ];

  const niches = [
    {
      icon: UtensilsCrossed,
      title: "Gastronomia",
      features: ["Cardápio Digital", "KDS (Cozinha)", "App do Garçom"],
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Pill,
      title: "Suplementos",
      features: ["Recorrência de vendas", "PDV ultra-rápido", "Controle de estoque"],
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Dog,
      title: "Pet Shops",
      features: ["Gestão de serviços", "Vendas de ração", "Programa de fidelização"],
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Store,
      title: "Varejo Local",
      features: ["Catálogo online", "Entrega inteligente", "Multi-lojas"],
      color: "from-blue-500 to-cyan-500"
    }
  ];

  const secretWeapons = [
    {
      icon: MessageSquare,
      title: "WhatsApp Marketing",
      subtitle: "O vendedor que não dorme",
      description: "Recupere 23% dos seus clientes inativos automaticamente com o SENTINELA.",
      stat: "+23%",
      statLabel: "recuperação"
    },
    {
      icon: Tablet,
      title: "Totem de Autoatendimento",
      subtitle: "Tecnologia de gigante no seu balcão",
      description: "Reduza filas e economize com atendentes. Experiência premium para seus clientes.",
      stat: "-40%",
      statLabel: "tempo de espera"
    },
    {
      icon: BarChart3,
      title: "Financeiro & Gestão",
      subtitle: "Dashboard completo",
      description: "Saiba centavo por centavo o seu lucro real. Relatórios que fazem sentido.",
      stat: "100%",
      statLabel: "controle"
    }
  ];

  const plans = [
    {
      name: "Essencial",
      price: "397,90",
      description: "O início da sua independência",
      features: ["Cardápio Digital", "Gestão de Pedidos", "Delivery", "Suporte 7 dias"],
      popular: false
    },
    {
      name: "Profissional",
      price: "597,90",
      description: "Sistema completo de crescimento",
      features: ["Tudo do Essencial", "WhatsApp Marketing", "Relatórios Avançados", "Promoções", "KDS"],
      popular: true
    },
    {
      name: "Premium",
      price: "997,90",
      description: "Para quem quer escala e multi-lojas",
      features: ["Tudo do Profissional", "Totem Autoatendimento", "SENTINELA", "Integrações", "Multi-lojas"],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section - ATENÇÃO */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Ecossistema All-in-One
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Pare de trabalhar para{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                pagar taxas.
              </span>
              <br />
              Comece a construir seu{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                próprio império.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-zinc-400 mb-8 max-w-3xl mx-auto">
              O Mostralo é o único ecossistema All-in-One que elimina comissões abusivas, 
              automatiza sua operação de ponta a ponta e recupera seus clientes no piloto automático.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg px-8 py-6 rounded-xl shadow-lg shadow-orange-500/25"
              >
                <Link to="/signup">
                  QUERO MEU TESTE GRÁTIS
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white text-lg px-8 py-6 rounded-xl"
              >
                <Link to="/demo">Ver demonstração</Link>
              </Button>
            </div>
            
            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span>0% de taxas</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Setup em 48h</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span>+500 lojas ativas</span>
              </div>
            </div>
          </div>
          
          {/* Mockup visual */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-gradient-to-b from-zinc-800/50 to-zinc-900/50 rounded-2xl border border-zinc-800 p-4 shadow-2xl shadow-orange-500/10">
              <div className="bg-zinc-900 rounded-xl p-6 min-h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <BarChart3 className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-zinc-500">Dashboard Mostralo</p>
                  <p className="text-2xl font-bold text-white mt-2">Controle Total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problema Section - INTERESSE */}
      <section className="py-20 lg:py-32 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              O mercado mudou.{" "}
              <span className="text-orange-500">Você vai ficar para trás?</span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Hoje você é refém dos marketplaces. Eles ficam com 25% do seu faturamento, 
              escondem seus dados e roubam seus clientes. O Mostralo devolve o poder para você.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {painPoints.map((point, index) => (
              <Card 
                key={index} 
                className="bg-zinc-900/80 border-zinc-800 p-8 hover:border-orange-500/50 transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${point.color}`}>
                  <point.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{point.title}</h3>
                <p className="text-zinc-400">{point.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Nichos Section - INTERESSE */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Uma solução,{" "}
              <span className="text-orange-500">infinitas possibilidades.</span>
            </h2>
            <p className="text-lg text-zinc-400">
              Sistema adaptável para qualquer tipo de negócio.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {niches.map((niche, index) => (
              <Card 
                key={index}
                className="bg-zinc-900/50 border-zinc-800 p-6 hover:border-orange-500/50 hover:-translate-y-2 transition-all duration-300 group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${niche.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <niche.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{niche.title}</h3>
                <ul className="space-y-2">
                  {niche.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2 text-sm text-zinc-400">
                      <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Armas Secretas Section - DESEJO */}
      <section className="py-20 lg:py-32 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
              Funcionalidades de Elite
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              As <span className="text-orange-500">Armas Secretas</span> do seu negócio
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Recursos exclusivos que transformam seu negócio em uma máquina de vendas.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {secretWeapons.map((weapon, index) => (
              <Card 
                key={index}
                className="bg-gradient-to-b from-zinc-900 to-zinc-900/50 border-zinc-800 p-8 hover:border-orange-500/50 transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/25 group-hover:scale-110 transition-transform">
                    <weapon.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <p className="text-sm text-orange-400 font-medium mb-1">{weapon.subtitle}</p>
                  <h3 className="text-xl font-semibold text-white mb-3">{weapon.title}</h3>
                  <p className="text-zinc-400 mb-6">{weapon.description}</p>
                  
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-orange-500">{weapon.stat}</span>
                    <span className="text-sm text-zinc-500">{weapon.statLabel}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparação Section - DESEJO */}
      <section className="py-20 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              A matemática não mente:{" "}
              <span className="text-orange-500">Economize mais de R$ 33.000,00 por ano.</span>
            </h2>
            <p className="text-lg text-zinc-400">
              Veja a diferença real no seu bolso.
            </p>
          </div>
          
          <Card className="bg-zinc-900/80 border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 font-medium">Critério</TableHead>
                    <TableHead className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-red-400 font-semibold">iFood</span>
                        <span className="text-xs text-zinc-500">(25% taxa)</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-orange-400 font-semibold">Mostralo</span>
                        <span className="text-xs text-zinc-500">(0% taxa)</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-zinc-800">
                    <TableCell className="text-zinc-300">Faturamento Mensal</TableCell>
                    <TableCell className="text-center text-zinc-400">R$ 13.500</TableCell>
                    <TableCell className="text-center text-zinc-400">R$ 13.500</TableCell>
                  </TableRow>
                  <TableRow className="border-zinc-800">
                    <TableCell className="text-zinc-300">Taxa/Comissão</TableCell>
                    <TableCell className="text-center text-red-400 font-semibold">- R$ 3.375</TableCell>
                    <TableCell className="text-center text-green-400 font-semibold">R$ 0</TableCell>
                  </TableRow>
                  <TableRow className="border-zinc-800">
                    <TableCell className="text-zinc-300">Lucro Líquido</TableCell>
                    <TableCell className="text-center text-zinc-400">R$ 10.125</TableCell>
                    <TableCell className="text-center text-white font-semibold">R$ 13.500</TableCell>
                  </TableRow>
                  <TableRow className="border-zinc-800 bg-orange-500/10">
                    <TableCell className="text-white font-semibold">Economia Anual</TableCell>
                    <TableCell className="text-center text-zinc-500">-</TableCell>
                    <TableCell className="text-center">
                      <span className="text-2xl font-bold text-orange-400">+ R$ 40.500</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
          
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-full px-6 py-3">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <span className="text-lg">
                <span className="text-orange-400 font-bold">R$ 2.777/mês</span>
                <span className="text-zinc-400"> de economia média</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Planos Section - AÇÃO */}
      <section className="py-20 lg:py-32 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Escolha o plano ideal para o{" "}
              <span className="text-orange-500">seu momento.</span>
            </h2>
            <p className="text-lg text-zinc-400">
              Sem fidelidade. Cancele quando quiser.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index}
                className={`relative p-8 transition-all duration-300 ${
                  plan.popular 
                    ? 'bg-gradient-to-b from-orange-500/20 to-zinc-900 border-orange-500 scale-105 shadow-xl shadow-orange-500/20' 
                    : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white border-0 px-4 py-1">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      MAIS ESCOLHIDO
                    </Badge>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-zinc-400 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-zinc-500">R$</span>
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-zinc-500">/mês</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  asChild
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white' 
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  <Link to="/signup">
                    Começar agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
          
          {/* CTA Final */}
          <div className="mt-16 text-center">
            <Button 
              asChild 
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg px-12 py-6 rounded-xl shadow-lg shadow-orange-500/25"
            >
              <Link to="/signup">
                QUERO COMEÇAR AGORA
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <p className="mt-6 text-sm text-zinc-500">
              Sem fidelidade • Suporte 7 dias por semana • Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-zinc-500">
            © {new Date().getFullYear()} Mostralo.com.br • Todos os direitos reservados
          </p>
        </div>
      </footer>
      
      <WhatsAppLeadButton />
    </div>
  );
};

export default ConversaoLandingPage;
