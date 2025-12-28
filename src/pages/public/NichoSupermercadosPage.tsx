import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePageSEO } from "@/hooks/useSEO";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { 
  ShoppingBag, 
  Timer, 
  DollarSign, 
  Truck, 
  Store, 
  Leaf,
  Smartphone,
  Package,
  CheckCircle2,
  Star,
  Zap,
  BarChart3,
  MessageCircle,
  Tablet,
  ArrowRight,
  Check,
  X,
  MapPin,
  Clock,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";

const NichoSupermercadosPage = () => {
  usePageSEO({
    title: "Mostralo para Supermercados de Bairro | Catálogo Online + PDV + Delivery",
    description: "Sistema completo para mercadinhos, mercearias e hortifrutis. Catálogo online por categorias, PDV ultra-rápido, delivery inteligente e Clique e Retire. Taxa 0% sobre vendas.",
    keywords: "sistema supermercado bairro, catálogo mercadinho, pdv mercearia, delivery hortifruti, clique retire mercado, gestão estoque supermercado"
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/30">
              <ShoppingBag className="w-4 h-4" />
              Para Supermercados, Mercadinhos e Hortifrutis
            </span>
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Leve o seu supermercado para o{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-green-400">
                celular dos seus vizinhos
              </span>{" "}
              e venda muito mais.
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-3xl mx-auto">
              O Mostralo é o ecossistema All-in-One que une seu PDV de balcão a um delivery de bairro profissional. 
              Sem taxas por pedido, com controle de estoque e fidelização automática via WhatsApp.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
                >
                  <Store className="w-5 h-5 mr-2" />
                  MODERNIZAR MEU MERCADO
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              {[
                { icon: DollarSign, text: "Taxa 0%" },
                { icon: ShoppingBag, text: "Catálogo Completo" },
                { icon: Zap, text: "PDV Ultra-Rápido" },
                { icon: Package, text: "Clique e Retire" }
              ].map((badge, index) => (
                <div key={index} className="flex items-center gap-2 text-zinc-400">
                  <badge.icon className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problema Section */}
      <section className="py-16 md:py-24 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Por que ser{" "}
              <span className="text-orange-400">refém dos grandes apps?</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Não deixe o lucro das suas gôndolas ir para a mão de terceiros.
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-12">
            <Card className="bg-zinc-900/80 border-red-500/30 p-6">
              <p className="text-zinc-300 text-center text-lg">
                No supermercado de bairro, o cliente quer rapidez. Mas pagar{" "}
                <span className="text-red-400 font-bold">25% de taxa</span> por um pedido de 
                "compras do mês" ou "itens esquecidos" acaba com a sua margem. 
                O Mostralo dá a <span className="text-green-400 font-semibold">tecnologia dos grandes</span> para o lojista local.
              </p>
            </Card>
          </div>

          {/* Grid de 3 Soluções */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: ShoppingBag,
                title: "Catálogo Online Completo",
                description: "Organize por categorias (Limpeza, Bebidas, Padaria, Hortifruti). Seu cliente faz o 'mercadinho' pelo celular e você recebe o pedido pronto para separar.",
                color: "orange"
              },
              {
                icon: Zap,
                title: "PDV Ultra-Rápido",
                description: "Venda no balcão com agilidade. Busca rápida por nome e integração total com o estoque. Atenda a fila do pão ou do caixa sem travamentos.",
                color: "green"
              },
              {
                icon: Truck,
                title: "Delivery Inteligente",
                description: "Defina taxas de entrega por distância ou bairros vizinhos. Garanta que o pedido chegue em minutos e seja o número #1 em conveniência na sua região.",
                color: "orange"
              }
            ].map((solution, index) => (
              <Card 
                key={index} 
                className="bg-zinc-900 border-zinc-800 hover:border-green-500/50 transition-all duration-300 group"
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-xl bg-${solution.color}-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <solution.icon className={`w-7 h-7 text-${solution.color}-400`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{solution.title}</h3>
                  <p className="text-zinc-400">{solution.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Inteligência que Gera Recorrência */}
      <section className="py-16 md:py-24 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Inteligência que{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-green-400">
                gera recorrência
              </span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Tecnologia que trabalha enquanto você abastece as prateleiras.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: MessageCircle,
                title: "Recorrência via WhatsApp",
                description: "O cliente compra produtos de limpeza todo mês? O Mostralo identifica o comportamento e envia ofertas automáticas para garantir que ele compre de você, e não do concorrente.",
                stat: "+45%",
                statLabel: "vendas recorrentes",
                color: "green"
              },
              {
                icon: Tablet,
                title: "Totem para Hortifruti/Padaria",
                description: "Instale um Totem de Autoatendimento no setor de padaria ou frios. O cliente pede, retira a senha e continua fazendo compras. Menos filas, mais vendas.",
                stat: "0",
                statLabel: "filas",
                color: "orange"
              },
              {
                icon: BarChart3,
                title: "Gestão Financeira e Estoque",
                description: "Tenha relatórios de quais itens estão 'encalhados' e quais são os campeões de venda. Tome decisões baseadas em dados reais de lucro.",
                stat: "100%",
                statLabel: "controle",
                color: "green"
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-xl bg-${feature.color}-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-7 h-7 text-${feature.color}-400`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-zinc-400 mb-4">{feature.description}</p>
                  <div className="pt-4 border-t border-zinc-800">
                    <span className={`text-3xl font-bold text-${feature.color}-400`}>{feature.stat}</span>
                    <span className="text-zinc-500 text-sm ml-2">{feature.statLabel}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Clique e Retire Section */}
      <section className="py-16 md:py-24 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/30 mb-6">
              <Package className="w-4 h-4" />
              Clique e Retire
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Comprou no trabalho?{" "}
              <span className="text-green-400">Só passa pra buscar.</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              O cliente faz as compras pelo celular enquanto está no trabalho e avisa que vai passar pra retirar. 
              Quando ele chega, as sacolas já estão prontas. Conveniência máxima para o vizinho ocupado.
            </p>
          </div>

          {/* Fluxo Visual */}
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-4 md:gap-8">
              {[
                {
                  step: "1",
                  icon: Smartphone,
                  title: "PEDIDO",
                  subtitle: "Cliente faz pelo celular",
                  color: "orange"
                },
                {
                  step: "2",
                  icon: Package,
                  title: "SEPARAÇÃO",
                  subtitle: "Equipe prepara as sacolas",
                  color: "green"
                },
                {
                  step: "3",
                  icon: CheckCircle2,
                  title: "RETIRADA",
                  subtitle: "Sacolas prontas",
                  color: "orange"
                }
              ].map((item, index) => (
                <div key={index} className="relative">
                  <Card className="bg-zinc-900 border-zinc-800 hover:border-green-500/50 transition-all duration-300 text-center p-6">
                    <div className={`w-8 h-8 rounded-full bg-${item.color}-500 text-white font-bold flex items-center justify-center mx-auto mb-4 text-sm`}>
                      {item.step}
                    </div>
                    <div className={`w-16 h-16 rounded-2xl bg-${item.color}-500/20 flex items-center justify-center mx-auto mb-4`}>
                      <item.icon className={`w-8 h-8 text-${item.color}-400`} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-zinc-400 text-sm">{item.subtitle}</p>
                  </Card>
                  {index < 2 && (
                    <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-8 h-8 text-zinc-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-zinc-500 mt-8 text-sm">
              Compre online, retire na loja em minutos
            </p>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-16 md:py-24 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              O Cálculo da{" "}
              <span className="text-orange-400">Independência</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Economize o valor de um caminhão de mercadorias por ano.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="bg-zinc-900 border-2 border-orange-500/30 overflow-hidden">
              <CardContent className="p-0">
                {/* Header App Terceiro */}
                <div className="p-6 border-b border-zinc-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                      <X className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-300">Faturamento via App Terceiro (R$ 20.000/mês)</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Faturamento mensal:</span>
                      <span className="text-white font-medium">R$ 20.000,00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-400">❌ Taxa App (25%):</span>
                      <span className="text-red-400 font-medium">- R$ 5.000,00</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-800">
                      <span className="text-zinc-300 font-medium">Lucro líquido:</span>
                      <span className="text-zinc-300 font-bold">R$ 15.000,00</span>
                    </div>
                  </div>
                </div>

                {/* Header Mostralo */}
                <div className="p-6 border-b border-zinc-800 bg-green-500/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-300">Faturamento via Mostralo (R$ 20.000/mês)</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Faturamento mensal:</span>
                      <span className="text-white font-medium">R$ 20.000,00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-400">✅ Taxa Mostralo:</span>
                      <span className="text-green-400 font-medium">R$ 0,00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-400">✅ Mensalidade Profissional:</span>
                      <span className="text-zinc-400 font-medium">- R$ 397,00</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-800">
                      <span className="text-zinc-300 font-medium">Lucro líquido:</span>
                      <span className="text-green-400 font-bold">R$ 19.603,00</span>
                    </div>
                  </div>
                </div>

                {/* Resultado */}
                <div className="p-6 bg-gradient-to-r from-orange-500/10 to-green-500/10">
                  <div className="grid md:grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-zinc-900/50 rounded-xl">
                      <p className="text-zinc-400 text-sm mb-1">LUCRO EXTRA MENSAL</p>
                      <p className="text-3xl font-bold text-orange-400">R$ 4.603,00</p>
                    </div>
                    <div className="p-4 bg-zinc-900/50 rounded-xl">
                      <p className="text-zinc-400 text-sm mb-1">ECONOMIA ANUAL</p>
                      <p className="text-3xl font-bold text-green-400">R$ 55.236,00</p>
                    </div>
                  </div>
                  <p className="text-center text-zinc-400 mt-4 text-sm">
                    💡 Reinvista em estoque ou reforma da fachada!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-16 md:py-24 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Mercados de bairro que{" "}
              <span className="text-green-400">já vendem mais</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                quote: "O catálogo online fez meus vizinhos pedirem pelo celular em vez de ir no mercado grande. Virei a conveniência da rua.",
                author: "Seu Antônio",
                business: "Mercadinho do Antônio - SP",
                rating: 5
              },
              {
                quote: "O Clique e Retire foi sucesso total. O pessoal do escritório compra na hora do almoço e passa só pra buscar.",
                author: "Dona Rosa",
                business: "Hortifruti da Rosa - MG",
                rating: 5
              },
              {
                quote: "Saí do app e economizo R$ 4.000/mês. Esse dinheiro virou estoque extra pro fim de semana.",
                author: "Carlos",
                business: "Mercearia Central - RJ",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-zinc-900 border-zinc-800 hover:border-green-500/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-orange-400 text-orange-400" />
                    ))}
                  </div>
                  <p className="text-zinc-300 mb-4 italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold text-white">{testimonial.author}</p>
                    <p className="text-zinc-500 text-sm">{testimonial.business}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-16 md:py-24 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Planos que acompanham{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-green-400">
                seu crescimento
              </span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Pronto para ser o mercado mais tecnológico do bairro?
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Plano Essencial */}
            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-300">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-4">
                    <Package className="w-6 h-6 text-zinc-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Essencial</h3>
                  <p className="text-zinc-500 text-sm">Catálogo Online + PDV + Relatórios</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">R$ 249</span>
                  <span className="text-zinc-500">,90/mês</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {[
                    "Catálogo online por categorias",
                    "PDV de balcão ultra-rápido",
                    "Controle de estoque básico",
                    "Suporte 7 dias"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button variant="outline" className="w-full border-zinc-700 text-white hover:bg-zinc-800">
                    Começar
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plano Profissional */}
            <Card className="bg-zinc-900 border-2 border-orange-500 hover:border-orange-400 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-green-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                O MAIS INDICADO
              </div>
              <CardContent className="p-6 pt-8">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Profissional</h3>
                  <p className="text-zinc-500 text-sm">WhatsApp Marketing + Entregadores + Financeiro</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-orange-400">R$ 397</span>
                  <span className="text-zinc-500">,00/mês</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {[
                    "Tudo do Essencial",
                    "WhatsApp Marketing automático",
                    "Gestão de entregadores",
                    "Delivery por distância/bairro",
                    "Clique e Retire"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-zinc-300 text-sm">
                      <Check className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30">
                    Começar Agora
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plano Empresarial */}
            <Card className="bg-zinc-900 border-zinc-800 hover:border-green-500/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                    <Store className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Empresarial</h3>
                  <p className="text-zinc-500 text-sm">Multi-lojas e integrações via API</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">R$ 597</span>
                  <span className="text-zinc-500">,00/mês</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {[
                    "Tudo do Profissional",
                    "Multi-lojas",
                    "Totem para setores",
                    "API completa",
                    "Suporte Prioritário 24h"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button variant="outline" className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10">
                    Falar com Vendas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Perguntas{" "}
              <span className="text-green-400">Frequentes</span>
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-zinc-900 border border-zinc-800 rounded-lg px-6">
                <AccordionTrigger className="text-white hover:text-orange-400 text-left">
                  Posso organizar o catálogo por categorias?
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  Sim! O Mostralo permite criar categorias ilimitadas: Limpeza, Bebidas, Hortifruti, 
                  Padaria, Frios, Congelados, etc. O cliente navega como em um supermercado online, 
                  mas compra de você, o lojista do bairro.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-zinc-900 border border-zinc-800 rounded-lg px-6">
                <AccordionTrigger className="text-white hover:text-orange-400 text-left">
                  Como funciona o Clique e Retire?
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  O cliente faz o pedido pelo celular e seleciona "Retirar na Loja". 
                  Sua equipe separa os produtos e, quando o cliente chega, as sacolas já estão prontas. 
                  Ideal para quem mora ou trabalha perto e não quer esperar entrega.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-zinc-900 border border-zinc-800 rounded-lg px-6">
                <AccordionTrigger className="text-white hover:text-orange-400 text-left">
                  Consigo definir taxas diferentes por bairro?
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  Sim! O Mostralo permite configurar taxas de entrega por distância ou por bairros específicos. 
                  Você pode cobrar mais barato pra vizinhos próximos e ajustar o valor pra bairros mais distantes, 
                  garantindo lucro em cada entrega.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            Pronto para ser o{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-green-400">
              mercado do bairro
            </span>{" "}
            mais tecnológico?
          </h2>
          <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
            Teste grátis por 7 dias. Sem compromisso, sem cartão de crédito.
          </p>
          <Link to="/signup">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              COMEÇAR TESTE GRÁTIS
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-zinc-950 border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-zinc-500 text-sm">
              Mostralo.com.br | O parceiro do comércio de bairro.
            </p>
            <div className="flex gap-6">
              {["Início", "Funcionalidades", "Suporte", "Termos", "Privacidade"].map((link, index) => (
                <a key={index} href="#" className="text-zinc-500 hover:text-orange-400 text-sm transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Lead Button */}
      <WhatsAppLeadButton />
    </div>
  );
};

export default NichoSupermercadosPage;
