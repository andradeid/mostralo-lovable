import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Dumbbell, 
  Pill, 
  RefreshCw, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  MessageSquare, 
  Smartphone, 
  ShoppingCart,
  Check,
  Star,
  ChevronDown,
  ChevronUp,
  Package,
  Users,
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/useSEO";
import { useState } from "react";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";

const NichoSuplementosPage = () => {
  usePageSEO({
    title: "Mostralo para Lojas de Suplementos | Sistema All-in-One",
    description: "Sistema completo para lojas de suplementos: PDV rápido, catálogo digital, WhatsApp Marketing com automação de recorrência. Domine o lucro da sua região.",
    keywords: "sistema loja suplementos, pdv suplementos, whatsapp marketing suplementos, catálogo digital suplementos, gestão loja suplementos"
  });

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const benefits = [
    {
      icon: BarChart3,
      title: "Fim da Cegueira de Dados",
      description: "Saiba exatamente quem comprou, o que comprou e quando vai comprar de novo."
    },
    {
      icon: Zap,
      title: "Agilidade no Balcão",
      description: "PDV rápido com controle de sabores e variações (Tamanho, Peso, Sabor) em um clique."
    },
    {
      icon: DollarSign,
      title: "Independência de Taxas",
      description: "Venda online sem pagar 10-20% para marketplaces. O lucro é 100% seu."
    }
  ];

  const features = [
    {
      icon: RefreshCw,
      title: "Vendedor de Recorrência",
      subtitle: "Automação Pós-Venda",
      description: "O sistema identifica que o pré-treino do cliente vai acabar em 5 dias e envia cupom no WhatsApp automaticamente.",
      stat: "+23%",
      statLabel: "recuperação"
    },
    {
      icon: Smartphone,
      title: "Catálogo Digital Premium",
      subtitle: "Vitrine Profissional",
      description: "Uma vitrine que funciona como App no celular do cliente. Pedidos via delivery ou clique e retire.",
      stat: "3x",
      statLabel: "mais pedidos"
    },
    {
      icon: TrendingUp,
      title: "Gestão Financeira e Estoque",
      subtitle: "Controle Total",
      description: "Controle de entradas, saídas e fluxo de caixa. Saiba quais produtos têm mais giro e maior margem.",
      stat: "100%",
      statLabel: "controle"
    }
  ];

  const plans = [
    {
      name: "Essencial",
      price: "397",
      pricePromo: "249",
      description: "Foco em PDV e Catálogo Online",
      features: [
        "Cardápio Digital Premium",
        "Gestão de Pedidos",
        "Controle de Variações (Sabor/Tamanho)",
        "Suporte 7 dias"
      ],
      popular: false,
      icon: Package
    },
    {
      name: "Profissional",
      price: "597",
      pricePromo: "397",
      description: "Inclui automações de WhatsApp Marketing",
      features: [
        "Tudo do Essencial",
        "WhatsApp Marketing (Recuperação)",
        "Gestão de Entregas",
        "Relatórios Avançados",
        "Múltiplas Formas de Pagamento"
      ],
      popular: true,
      icon: Users
    },
    {
      name: "Premium",
      price: "997",
      pricePromo: "597",
      description: "Para redes de lojas com gestão centralizada",
      features: [
        "Tudo do Profissional",
        "Multi-lojas",
        "SENTINELA Completo",
        "Integrações Avançadas",
        "Suporte Prioritário"
      ],
      popular: false,
      icon: Star
    }
  ];

  const faqs = [
    {
      question: "Como funciona a integração com o WhatsApp?",
      answer: "O sistema usa a API oficial do WhatsApp para enviar mensagens automáticas baseadas no histórico de compras do cliente. Você pode configurar alertas de recompra, promoções personalizadas e mensagens de aniversário. Tudo de forma segura e sem risco de banimento."
    },
    {
      question: "Posso cadastrar diferentes sabores para o mesmo produto?",
      answer: "Sim! O sistema suporta variações ilimitadas: sabor, tamanho, peso, tipo de embalagem. Você cadastra o produto uma vez e adiciona todas as variações. No PDV, é só selecionar a variação desejada em um clique."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />
        
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-2 mb-6">
                <Dumbbell className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-400">Para Lojas de Suplementos</span>
              </div>
              
              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Não venda apenas suplementos.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                  Domine a recorrência
                </span>{" "}
                e o lucro da sua região.
              </h1>
              
              {/* Sub-headline */}
              <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-2xl mx-auto lg:mx-0">
                O Mostralo é o único ecossistema All-in-One que une seu PDV de balcão ao catálogo digital, 
                com automação de WhatsApp que avisa seu cliente quando o Whey está acabando.
              </p>
              
              {/* CTA */}
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-6 text-lg rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300"
                >
                  TRANSFORMAR MINHA LOJA AGORA
                </Button>
              </Link>
              
              {/* Trust badges */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 mt-8">
                <div className="flex items-center gap-2 text-zinc-400">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span className="text-sm">0% taxas</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span className="text-sm">+23% recuperação</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span className="text-sm">Setup em 48h</span>
                </div>
              </div>
            </div>
            
            {/* Visual mockup */}
            <div className="flex-1 relative">
              <div className="relative">
                {/* Tablet mockup */}
                <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 shadow-2xl">
                  <div className="bg-zinc-950 rounded-xl p-6 aspect-[4/3]">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <Pill className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <div className="text-lg font-bold">Whey Protein 900g</div>
                        <div className="text-orange-500 font-semibold">R$ 189,90</div>
                      </div>
                    </div>
                    <div className="h-24 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-lg flex items-end p-4">
                      <div className="flex items-end gap-1 w-full">
                        {[40, 55, 45, 70, 85, 75, 95].map((h, i) => (
                          <div 
                            key={i} 
                            className="flex-1 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Vendas da semana</span>
                      <span className="text-green-500 font-semibold flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" /> +32%
                      </span>
                    </div>
                  </div>
                </div>
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-orange-600/20 blur-3xl -z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 md:py-24 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O cliente compra uma vez e{" "}
              <span className="text-orange-500">some</span>?
            </h2>
            <p className="text-xl text-orange-500 font-semibold mb-4">
              O Mostralo resolve.
            </p>
            <p className="text-zinc-400 max-w-3xl mx-auto text-lg">
              No varejo de suplementos, o lucro está na <strong className="text-white">VOLTA</strong> do cliente. 
              Se você não tem os dados e a automação, você está perdendo dinheiro para os grandes sites todo santo dia.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card 
                key={index}
                className="bg-zinc-900 border-zinc-800 p-6 hover:border-orange-500/50 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                  <benefit.icon className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-zinc-400">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Funcionalidades de{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                Performance
              </span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Ferramentas desenvolvidas para maximizar suas vendas e fidelizar clientes
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="bg-zinc-900 border-zinc-800 p-8 hover:border-orange-500/50 transition-all duration-300 relative overflow-hidden group"
              >
                {/* Background glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-orange-500">{feature.stat}</div>
                      <div className="text-xs text-zinc-500">{feature.statLabel}</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-orange-400 uppercase tracking-wider mb-1">
                    {feature.subtitle}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-zinc-400">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Proof Section */}
      <section className="py-16 md:py-24 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                O sistema que{" "}
                <span className="text-orange-500">se paga sozinho</span>
              </h2>
            </div>
            
            <Card className="bg-zinc-900 border-orange-500/30 p-8 md:p-12">
              <p className="text-xl text-zinc-300 mb-8 text-center">
                Uma loja que recupera <strong className="text-white">15 clientes por mês</strong> através da nossa automação 
                já paga <strong className="text-orange-500">3x a mensalidade</strong> do sistema. O resto é lucro líquido no seu bolso.
              </p>
              
              <div className="grid md:grid-cols-4 gap-4 text-center">
                <div className="bg-zinc-800 rounded-xl p-4">
                  <div className="text-zinc-500 text-sm mb-1">Ticket médio</div>
                  <div className="text-2xl font-bold text-white">R$ 150</div>
                </div>
                <div className="bg-zinc-800 rounded-xl p-4">
                  <div className="text-zinc-500 text-sm mb-1">Clientes recuperados</div>
                  <div className="text-2xl font-bold text-white">15/mês</div>
                </div>
                <div className="bg-zinc-800 rounded-xl p-4">
                  <div className="text-zinc-500 text-sm mb-1">Receita extra</div>
                  <div className="text-2xl font-bold text-green-500">R$ 2.250</div>
                </div>
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4">
                  <div className="text-orange-400 text-sm mb-1">LUCRO EXTRA</div>
                  <div className="text-2xl font-bold text-orange-500">R$ 1.853</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Escolha seu nível de{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                performance
              </span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index}
                className={`relative bg-zinc-900 p-6 transition-all duration-300 ${
                  plan.popular 
                    ? 'border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.2)]' 
                    : 'border-zinc-800 hover:border-orange-500/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      MAIS ESCOLHIDO
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <plan.icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-zinc-500 text-sm mb-4">{plan.description}</p>
                  
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-zinc-500 line-through text-sm">R$ {plan.price}</span>
                    <div className="text-3xl font-bold text-white">
                      R$ <span className="text-orange-500">{plan.pricePromo}</span>
                    </div>
                  </div>
                  <div className="text-zinc-500 text-sm">/mês</div>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-zinc-300 text-sm">
                      <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Link to="/signup" className="block">
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    } transition-all duration-300`}
                  >
                    Começar Agora
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
          
          <p className="text-center text-zinc-500 mt-8">
            Sem fidelidade | Suporte 7 dias por semana | Cancele quando quiser
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Perguntas Frequentes
            </h2>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card 
                  key={index}
                  className="bg-zinc-900 border-zinc-800 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full p-6 flex items-center justify-between text-left hover:bg-zinc-800/50 transition-colors"
                  >
                    <span className="font-semibold text-white pr-4">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-zinc-400">{faq.answer}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para dominar o mercado de suplementos?
          </h2>
          <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de lojistas que já transformaram suas operações com o Mostralo.
          </p>
          
          <Link to="/signup">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-10 py-6 text-lg rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              QUERO FALAR COM UM CONSULTOR
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">Mostralo</span>
            </div>
            
            <p className="text-zinc-500 text-sm text-center">
              Mostralo.com.br | Tecnologia para quem busca o próximo nível.
            </p>
            
            <div className="flex gap-4 text-sm text-zinc-500">
              <Link to="/" className="hover:text-orange-500 transition-colors">Início</Link>
              <Link to="/funcionalidades" className="hover:text-orange-500 transition-colors">Funcionalidades</Link>
              <Link to="/suporte" className="hover:text-orange-500 transition-colors">Suporte</Link>
              <Link to="/termos-de-uso" className="hover:text-orange-500 transition-colors">Termos</Link>
            </div>
          </div>
        </div>
      </footer>
      
      <WhatsAppLeadButton />
    </div>
  );
};

export default NichoSuplementosPage;
