import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Pizza,
  Timer,
  Monitor,
  Printer,
  Bike,
  MessageSquare,
  Check,
  X,
  Star,
  Phone,
  TrendingUp,
  Wallet,
  Users,
  Zap,
  ArrowRight,
  BadgePercent,
  ChefHat,
  Utensils,
} from "lucide-react";
import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/useSEO";
import { useState } from "react";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";

const NichoPizzariasPage = () => {
  usePageSEO({
    title: "Mostralo para Pizzarias | Sistema Completo Delivery e Salão",
    description: "Sistema completo para pizzarias: cardápio digital com montador meia-meia, KDS para cozinha, gestão de entregas e WhatsApp Marketing. Taxa 0% por pedido.",
    keywords: "sistema pizzaria, cardápio digital pizza, KDS pizzaria, delivery pizza, montador meia-meia, gestão pizzaria",
  });

  const [openFaq, setOpenFaq] = useState<string | undefined>(undefined);

  const plans = [
    {
      name: "Essencial",
      price: "249,90",
      originalPrice: "397,90",
      description: "Cardápio Digital + PDV + Impressão Automática",
      features: [
        "Cardápio com Montador de Pizza",
        "Impressão térmica automática",
        "Gestão de pedidos",
        "Suporte 7 dias",
      ],
      popular: false,
    },
    {
      name: "Profissional",
      price: "397,00",
      originalPrice: "597,90",
      description: "KDS + Gestão de Entregadores + WhatsApp Marketing",
      features: [
        "Tudo do Essencial",
        "KDS (Monitor de Cozinha)",
        "Gestão de Entregas",
        "WhatsApp Marketing Automático",
        "Relatórios avançados",
      ],
      popular: true,
    },
    {
      name: "Premium",
      price: "597,00",
      originalPrice: "997,90",
      description: "Multi-lojas, API e Suporte Prioritário",
      features: [
        "Tudo do Profissional",
        "Multi-lojas",
        "Integrações (iFood, Rappi)",
        "API completa",
        "Suporte Prioritário 24h",
      ],
      popular: false,
    },
  ];

  const testimonials = [
    {
      name: "Marcos",
      business: "Pizzaria do Bairro - SP",
      quote: "Antes pagava R$ 4.500/mês de taxa. Hoje pago R$ 397 fixo.",
      savings: "R$ 4.100",
    },
    {
      name: "Fernanda",
      business: "Pizza Express - RJ",
      quote: "O KDS organizou minha cozinha. Zero pizza atrasada.",
      savings: "0 atrasos",
    },
    {
      name: "Roberto",
      business: "Forno a Lenha - MG",
      quote: "Recuperei 28 clientes inativos no primeiro mês.",
      savings: "+28 clientes",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 mb-6">
              <Pizza className="w-5 h-5 text-orange-500" />
              <span className="text-orange-400 font-medium">Para Pizzarias Delivery & Salão</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Pare de dar{" "}
              <span className="text-orange-500">"fatias"</span>{" "}
              do seu lucro para o iFood.
            </h1>
            
            <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-3xl mx-auto">
              O Mostralo é o sistema All-in-One que elimina taxas por pedido, 
              organiza sua cozinha com KDS e coloca sua pizzaria no bolso do 
              cliente com um cardápio digital inteligente.
            </p>
            
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 animate-pulse"
              >
                QUERO MINHA PIZZARIA LUCRATIVA
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 mt-10">
              <div className="flex items-center gap-2 text-zinc-400">
                <BadgePercent className="w-5 h-5 text-orange-500" />
                <span>Taxa 0%</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Monitor className="w-5 h-5 text-orange-500" />
                <span>KDS integrado</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Pizza className="w-5 h-5 text-orange-500" />
                <span>Meia-meia fácil</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 md:py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Você faz a pizza, eles ficam com o lucro.{" "}
              <span className="text-orange-500">Até quando?</span>
            </h2>
            <p className="text-lg text-zinc-400">
              Vender 100 pizzas e pagar 25 delas em taxas para aplicativos é insustentável. 
              O Mostralo devolve o controle do seu faturamento e dos dados dos seus clientes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">Taxa 0% por Pedido</h3>
                <p className="text-zinc-400">
                  Pague apenas uma mensalidade fixa, não importa quanto você venda.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Pizza className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">Montador de Pizza Inteligente</h3>
                <p className="text-zinc-400">
                  Meia-meia, bordas recheadas e adicionais. O cliente monta a pizza sozinho, sem erros.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Monitor className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">KDS (Monitor de Cozinha)</h3>
                <p className="text-zinc-400">
                  Adeus aos papéis perdidos. Organize a produção por tempo de espera e evite atrasos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Transforme sua Operação em uma{" "}
              <span className="text-orange-500">Máquina de Vendas</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-orange-500" />
                  </div>
                  <span className="text-2xl font-bold text-orange-500">-80%</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">O Fim do Telefone Ocupado</h3>
                <p className="text-zinc-400">
                  Central de pedidos instantânea via WhatsApp. Seu cliente faz o pedido em segundos 
                  e ele cai direto na cozinha e na sua impressora térmica.
                </p>
                <p className="text-sm text-orange-400 mt-3">ligações a menos</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-orange-500" />
                  </div>
                  <span className="text-2xl font-bold text-orange-500">+23%</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">WhatsApp Marketing Automático</h3>
                <p className="text-zinc-400">
                  "João não pede pizza há 15 dias?" O Mostralo identifica e envia um cupom 
                  de desconto de "saudade" automaticamente.
                </p>
                <p className="text-sm text-orange-400 mt-3">recuperação de clientes</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Utensils className="w-6 h-6 text-orange-500" />
                  </div>
                  <span className="text-2xl font-bold text-orange-500">0</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">Comanda Digital e App do Garçom</h3>
                <p className="text-zinc-400">
                  Se você tem salão, seus garçons lançam os pedidos pelo celular e a cozinha 
                  recebe na hora. Agilidade máxima, erro zero.
                </p>
                <p className="text-sm text-orange-400 mt-3">erros de pedido</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Proof Section - Math */}
      <section className="py-16 md:py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              A conta que vai{" "}
              <span className="text-orange-500">mudar o seu ano</span>
            </h2>
          </div>

          <div className="max-w-lg mx-auto">
            <Card className="bg-zinc-900 border-orange-500/30 overflow-hidden">
              <div className="bg-orange-500/10 p-4 border-b border-orange-500/20">
                <h3 className="text-xl font-bold text-center text-orange-400">
                  Faturamento Mensal: R$ 20.000,00
                </h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <X className="w-5 h-5 text-red-500" />
                    <span className="text-zinc-300">Taxas iFood (25%)</span>
                  </div>
                  <span className="text-red-500 font-bold">- R$ 5.000,00</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-zinc-300">Mostralo (Profissional)</span>
                  </div>
                  <span className="text-green-500 font-bold">R$ 597,90</span>
                </div>

                <div className="bg-orange-500/20 rounded-xl p-4 mt-4">
                  <div className="text-center">
                    <p className="text-sm text-orange-300 mb-1">LUCRO EXTRA NO SEU BOLSO</p>
                    <p className="text-4xl font-bold text-orange-500">R$ 4.402,10</p>
                    <p className="text-orange-300">por mês</p>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <p className="text-zinc-400">
                    Economia anual:{" "}
                    <span className="text-orange-500 font-bold">R$ 52.825,20</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pizzarias que já{" "}
              <span className="text-orange-500">faturam mais</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-orange-500 text-orange-500" />
                    ))}
                  </div>
                  <p className="text-zinc-300 mb-4 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-100">{testimonial.name}</p>
                      <p className="text-sm text-zinc-500">{testimonial.business}</p>
                    </div>
                    <div className="bg-orange-500/20 px-3 py-1 rounded-full">
                      <span className="text-orange-400 font-bold text-sm">{testimonial.savings}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-16 md:py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para ter uma{" "}
              <span className="text-orange-500">pizzaria profissional?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`bg-zinc-900 border-2 transition-all hover:-translate-y-1 relative ${
                  plan.popular 
                    ? "border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.2)]" 
                    : "border-zinc-800 hover:border-orange-500/50"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      MAIS ESCOLHIDO
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl text-zinc-100">{plan.name}</CardTitle>
                  <p className="text-sm text-zinc-500">{plan.description}</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <span className="text-sm text-zinc-500 line-through">R$ {plan.originalPrice}</span>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm text-zinc-400">R$</span>
                      <span className="text-4xl font-bold text-orange-500">{plan.price}</span>
                      <span className="text-sm text-zinc-400">/mês</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 text-left mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                        <span className="text-zinc-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/signup">
                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? "bg-orange-500 hover:bg-orange-600 text-white" 
                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                      }`}
                    >
                      Começar Agora
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300"
              >
                QUERO TESTAR GRÁTIS AGORA
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Perguntas <span className="text-orange-500">Frequentes</span>
            </h2>

            <Accordion type="single" collapsible value={openFaq} onValueChange={setOpenFaq}>
              <AccordionItem value="item-1" className="border-zinc-800">
                <AccordionTrigger className="text-zinc-100 hover:text-orange-500">
                  <div className="flex items-center gap-3">
                    <Pizza className="w-5 h-5 text-orange-500" />
                    Como funciona o montador de pizza meia-meia?
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  O cliente seleciona os sabores de cada metade direto no cardápio digital. 
                  O sistema calcula o preço automaticamente (maior valor ou média, você configura). 
                  O pedido chega formatado para a cozinha: "MEIA Calabresa + MEIA Frango". 
                  Também funciona com bordas recheadas e adicionais!
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-zinc-800">
                <AccordionTrigger className="text-zinc-100 hover:text-orange-500">
                  <div className="flex items-center gap-3">
                    <Printer className="w-5 h-5 text-orange-500" />
                    O sistema imprime direto na impressora térmica?
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  Sim! Assim que o pedido é confirmado, ele imprime automaticamente na sua 
                  impressora de 80mm ou 58mm. Você configura uma vez e funciona sempre. 
                  Também temos integração com KDS (Monitor de Cozinha) para quem prefere 
                  produção 100% digital.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-zinc-800">
                <AccordionTrigger className="text-zinc-100 hover:text-orange-500">
                  <div className="flex items-center gap-3">
                    <Bike className="w-5 h-5 text-orange-500" />
                    Posso usar com iFood e Mostralo ao mesmo tempo?
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  Claro! Muitos clientes começam assim para fazer a transição gradual. 
                  O objetivo é você conquistar seus próprios clientes e reduzir a 
                  dependência do iFood com o tempo. Com o WhatsApp Marketing, você 
                  começa a criar sua base própria de clientes fiéis.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-zinc-900 border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Pizza className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-zinc-100">Mostralo</span>
            </div>
            <p className="text-zinc-400 mb-6">
              Sua pizzaria, seu lucro, sua liberdade.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
              <Link to="/" className="hover:text-orange-500 transition-colors">Início</Link>
              <Link to="/funcionalidades" className="hover:text-orange-500 transition-colors">Funcionalidades</Link>
              <Link to="/suporte" className="hover:text-orange-500 transition-colors">Suporte</Link>
              <Link to="/termos" className="hover:text-orange-500 transition-colors">Termos</Link>
              <Link to="/privacidade" className="hover:text-orange-500 transition-colors">Privacidade</Link>
            </div>
            <p className="text-zinc-600 text-sm mt-6">
              © 2024 Mostralo.com.br - Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>

      <WhatsAppLeadButton />
    </div>
  );
};

export default NichoPizzariasPage;
