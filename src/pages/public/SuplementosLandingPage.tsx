import { Link } from 'react-router-dom';
import { 
  Store, Menu, X, ArrowRight, Check, Smartphone, Package,
  MessageCircle, Users, DollarSign, Zap, Clock, ShieldCheck,
  ChevronDown, Dumbbell, RefreshCw, Brain, Heart, Play, VolumeX
} from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DashboardFooter } from '@/components/admin/DashboardFooter';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function SuplementosLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [isVideo2Playing, setIsVideo2Playing] = useState(false);
  const [isVideo3Playing, setIsVideo3Playing] = useState(false);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const video3Ref = useRef<HTMLVideoElement>(null);

  const handlePlayVideo2WithSound = () => {
    if (video2Ref.current) {
      video2Ref.current.muted = false;
      video2Ref.current.play();
      setIsVideo2Playing(true);
    }
  };

  const handlePlayVideo3WithSound = () => {
    if (video3Ref.current) {
      video3Ref.current.muted = false;
      video3Ref.current.play();
      setIsVideo3Playing(true);
    }
  };

  const heroRef = useScrollReveal();
  const dorRef = useScrollReveal();
  const solucaoRef = useScrollReveal();
  const comparativoRef = useScrollReveal();
  const facilidadeRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const whatsappLink = "https://wa.me/5500000000000?text=Olá! Quero uma simulação de economia para minha loja de suplementos";

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

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Início
              </Link>
              <Link to="/funcionalidades" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Funcionalidades
              </Link>
              <Link to="/para-suplementos" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Guia Completo
              </Link>
              <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                Suplementos
              </span>
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/auth" className="hidden md:block">
                <Button variant="outline" size="sm">Entrar</Button>
              </Link>
              <Link to="/signup" className="hidden md:block">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">Começar</Button>
              </Link>
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-border mt-3 space-y-3">
              <Link to="/" className="block text-muted-foreground hover:text-foreground">Início</Link>
              <Link to="/funcionalidades" className="block text-muted-foreground hover:text-foreground">Funcionalidades</Link>
              <Link to="/para-suplementos" className="block text-muted-foreground hover:text-foreground">Guia Completo</Link>
              <div className="flex gap-2 pt-2">
                <Link to="/auth"><Button variant="outline" size="sm" className="flex-1">Entrar</Button></Link>
                <Link to="/signup"><Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">Começar</Button></Link>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Seção 1: Hero - O Impacto */}
      <section 
        ref={heroRef.ref}
        className={`pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-br from-green-500/10 via-background to-orange-500/10 dark:from-green-500/5 dark:to-orange-500/5 transition-all duration-700 ${heroRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Coluna 1: Texto */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
                <Dumbbell className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Para Lojas de Suplementos</span>
              </div>
              
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Transforme seu WhatsApp em uma{' '}
                <span className="text-green-600 dark:text-green-400">Máquina de Vendas Recorrentes</span>{' '}
                com Taxa 0%
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto lg:mx-0">
                Pare de perder <span className="text-red-500 font-semibold">25% do seu lucro</span> para os marketplaces. 
                Recupere sua margem, blinde seus clientes contra a internet e automatize a reposição de Whey e Creatina.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700 text-lg px-8 py-6">
                    <MessageCircle className="h-5 w-5" />
                    QUERO UMA SIMULAÇÃO DE ECONOMIA
                  </Button>
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 mt-10 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span>0% de taxas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span>Setup em 48h</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span>+500 lojas ativas</span>
                </div>
              </div>
            </div>

            {/* Coluna 2: Vídeo YouTube */}
            <div className="flex justify-center lg:justify-end order-first lg:order-last">
              <div className="relative max-w-md lg:max-w-lg w-full">
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-green-500/30">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/qAVS6FeQrBU?si=TSEEj6CTXkYM6cYE&controls=0" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerPolicy="strict-origin-when-cross-origin" 
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
                
                {/* Efeito de brilho atrás */}
                <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-orange-500/20 blur-xl rounded-3xl -z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 2: A Dor - O Problema */}
      <section 
        ref={dorRef.ref}
        className={`py-16 md:py-24 bg-muted/30 transition-all duration-700 ${dorRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              Por que as lojas de suplementos estão{' '}
              <span className="text-red-500">perdendo dinheiro</span> em 2025?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1: Leão das Taxas */}
            <Card className="bg-background border-red-500/20 hover:border-red-500/40 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🦁</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">O Leão das Taxas</h3>
                <p className="text-muted-foreground">
                  O iFood e Mercado Livre levam embora o lucro que deveria ser o seu pró-labore. 
                  <span className="text-red-500 font-semibold"> 18-25% por venda!</span>
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Traição Digital */}
            <Card className="bg-background border-red-500/20 hover:border-red-500/40 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">💔</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">A "Traição" Digital</h3>
                <p className="text-muted-foreground">
                  Seu cliente compra uma vez na sua loja e depois vai para a Amazon porque é "mais fácil". 
                  <span className="text-red-500 font-semibold"> Você perde o cliente para sempre.</span>
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Falta de Memória */}
            <Card className="bg-background border-red-500/20 hover:border-red-500/40 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🧠</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Falta de Memória</h3>
                <p className="text-muted-foreground">
                  Você não tem tempo de chamar cada cliente para avisar que o produto dele acabou. 
                  <span className="text-red-500 font-semibold"> Ele compra do primeiro que oferecer.</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Vídeo demonstrativo do problema */}
          <div className="mt-12 text-center">
            <p className="text-lg font-medium text-muted-foreground mb-6">
              👇 Veja na prática o que está acontecendo:
            </p>
            <div className="max-w-2xl mx-auto relative">
              <video 
                ref={video3Ref}
                src="/videos/wheydestruindo.mp4"
                muted
                playsInline
                className="w-full rounded-2xl shadow-2xl border border-red-500/30"
                onEnded={() => setIsVideo3Playing(false)}
              />
              
              {/* Overlay com botão de play - vermelho para combinar com tema */}
              {!isVideo3Playing && (
                <button
                  onClick={handlePlayVideo3WithSound}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl cursor-pointer hover:bg-black/50 transition-colors"
                >
                  <div className="flex flex-col items-center gap-3 text-white">
                    <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-xl hover:bg-red-600 transition-colors">
                      <Play className="w-10 h-10 text-white fill-white ml-1" />
                    </div>
                    <span className="text-sm font-medium flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full">
                      <VolumeX className="w-4 h-4" />
                      Clique para reproduzir com som
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Seção 3: O Diferencial Mostralo - A Solução */}
      <section 
        ref={solucaoRef.ref}
        className={`py-16 md:py-24 transition-all duration-700 ${solucaoRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              Muito mais que um cardápio:{' '}
              <span className="text-green-600 dark:text-green-400">Um Ecossistema de Fidelização</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Feature 1: Cardápio Inteligente */}
            <Card className="bg-background border-green-500/20 hover:border-green-500/40 transition-colors">
              <CardContent className="p-6 flex gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Package className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">🛒 Cardápio Inteligente</h3>
                  <p className="text-muted-foreground">
                    Organizado por objetivos (Massa, Definição, Saúde). O cliente compra em 
                    <span className="text-green-500 font-semibold"> 30 segundos</span>.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2: Reposição Automática */}
            <Card className="bg-gradient-to-br from-green-500/10 to-orange-500/10 border-2 border-green-500/40 hover:border-green-500/60 transition-colors">
              <CardContent className="p-6 flex gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <RefreshCw className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-foreground">🔄 Reposição Automática</h3>
                    <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-medium">O PULO DO GATO</span>
                  </div>
                  <p className="text-muted-foreground">
                    Nossa IA identifica quando o suplemento do cliente vai acabar e envia um lembrete no WhatsApp dele 
                    <span className="text-green-500 font-semibold"> com link de compra</span>.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3: Taxa Zero */}
            <Card className="bg-background border-green-500/20 hover:border-green-500/40 transition-colors">
              <CardContent className="p-6 flex gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">💰 Taxa Zero de Verdade</h3>
                  <p className="text-muted-foreground">
                    O dinheiro cai direto na sua conta. 
                    <span className="text-green-500 font-semibold"> Sem intermediários, sem comissões abusivas</span>.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4: CRM de Ouro */}
            <Card className="bg-background border-green-500/20 hover:border-green-500/40 transition-colors">
              <CardContent className="p-6 flex gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">📱 CRM de Ouro</h3>
                  <p className="text-muted-foreground">
                    Saiba quem são seus melhores clientes, o que eles tomam e 
                    <span className="text-green-500 font-semibold"> quando vão comprar de novo</span>.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vídeo demonstrativo */}
          <div className="mt-12 text-center">
            <p className="text-lg font-medium text-muted-foreground mb-6">
              👇 Veja como funciona a notificação de reposição:
            </p>
            <div className="max-w-2xl mx-auto relative">
              <video 
                ref={video2Ref}
                src="/videos/suplementos-notificacao.mp4"
                muted
                playsInline
                className="w-full rounded-2xl shadow-2xl border border-green-500/30"
                onEnded={() => setIsVideo2Playing(false)}
              />
              
              {/* Overlay com botão de play */}
              {!isVideo2Playing && (
                <button
                  onClick={handlePlayVideo2WithSound}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl cursor-pointer hover:bg-black/50 transition-colors"
                >
                  <div className="flex flex-col items-center gap-3 text-white">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-xl hover:bg-green-600 transition-colors">
                      <Play className="w-10 h-10 text-white fill-white ml-1" />
                    </div>
                    <span className="text-sm font-medium flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full">
                      <VolumeX className="w-4 h-4" />
                      Clique para reproduzir com som
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Seção 4: Comparativo de Lucro - O Xeque-Mate */}
      <section 
        ref={comparativoRef.ref}
        className={`py-16 md:py-24 bg-muted/30 transition-all duration-700 ${comparativoRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              Venda de Combo R$ 450:{' '}
              <span className="text-green-600 dark:text-green-400">Quem fica com o lucro?</span>
            </h2>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-semibold text-foreground bg-muted/50">Comparativo</th>
                    <th className="text-center p-4 font-semibold text-red-500 bg-red-500/5">No Marketplace</th>
                    <th className="text-center p-4 font-semibold text-green-500 bg-green-500/5">Na Mostralo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-4 font-medium text-foreground">Taxa de Pedido</td>
                    <td className="p-4 text-center">
                      <div className="text-red-500 font-bold text-lg">R$ 112,50</div>
                      <div className="text-xs text-muted-foreground">(25% do valor)</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="text-green-500 font-bold text-lg">R$ 0,00</div>
                      <div className="text-xs text-muted-foreground">(0% de taxa)</div>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-4 font-medium text-foreground">Quem fica com o dado?</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-red-500">
                        <X className="h-5 w-5" />
                        <span className="font-medium">O App</span>
                      </div>
                      <div className="text-xs text-muted-foreground">(Você não sabe quem comprou)</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-green-500">
                        <Check className="h-5 w-5" />
                        <span className="font-medium">VOCÊ</span>
                      </div>
                      <div className="text-xs text-muted-foreground">(Nome e Telefone)</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-foreground">Próxima Compra</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-red-500">
                        <span className="text-xl">🎲</span>
                        <span className="font-medium">Sorte</span>
                      </div>
                      <div className="text-xs text-muted-foreground">(Ele pode ver outra loja)</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-green-500">
                        <span className="text-xl">🎯</span>
                        <span className="font-medium">Garantida</span>
                      </div>
                      <div className="text-xs text-muted-foreground">(Lembrete Automático)</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">
              Em 10 vendas de combo por mês, você <span className="text-red-500 font-semibold">perde R$ 1.125</span> para o marketplace.
            </p>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
                <MessageCircle className="h-5 w-5" />
                QUERO PARAR DE PERDER DINHEIRO
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Seção 5: "Chave na Mão" - Facilidade */}
      <section 
        ref={facilidadeRef.ref}
        className={`py-16 md:py-24 transition-all duration-700 ${facilidadeRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              Você cuida do treino dos seus clientes,{' '}
              <span className="text-green-600 dark:text-green-400">nós cuidamos da tecnologia</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Não se preocupe com configurações complexas. Nós entregamos tudo pronto:
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Package, text: "Cadastro de produtos" },
              { icon: Smartphone, text: "Configuração de áreas de entrega" },
              { icon: Smartphone, text: "QR Codes para o balcão" },
              { icon: Users, text: "Treinamento para sua equipe" },
            ].map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-xl"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium text-foreground">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-6 py-3">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                Configuração em até 48 horas
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Seção 6: FAQ - Quebra de Objeções */}
      <section 
        ref={faqRef.ref}
        className={`py-16 md:py-24 bg-muted/30 transition-all duration-700 ${faqRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              Dúvidas Frequentes
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-background border border-border rounded-xl px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Funciona para quem tem pouco estoque?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                <span className="text-green-500 font-semibold">Sim!</span> O controle é em tempo real. 
                Você pode marcar produtos como "esgotado" instantaneamente e o sistema atualiza automaticamente 
                para seus clientes. Ideal para lojas de todos os tamanhos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-background border border-border rounded-xl px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Já tenho um site, preciso da Mostralo?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                <span className="text-green-500 font-semibold">Com certeza!</span> Sites convencionais são lentos para o delivery de bairro. 
                A Mostralo é focada em conversão rápida via WhatsApp. Seu cliente compra em 30 segundos, 
                não em 5 minutos preenchendo cadastro. Além disso, você ganha o lembrete de recompra automático 
                que nenhum site oferece.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-background border border-border rounded-xl px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                Em quanto tempo recupero o investimento?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Com apenas <span className="text-green-500 font-semibold">2 ou 3 vendas de ticket médio alto</span> (combos de R$ 300-500), 
                o sistema já se pagou no mês. Considerando que você economiza 25% em taxas em cada venda, 
                o ROI é praticamente imediato.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Seção 7: Footer e CTA Final */}
      <section 
        ref={ctaRef.ref}
        className={`py-16 md:py-24 bg-gradient-to-br from-green-500/10 via-background to-orange-500/10 dark:from-green-500/5 dark:to-orange-500/5 transition-all duration-700 ${ctaRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-6">
            Chegou a hora de{' '}
            <span className="text-green-600 dark:text-green-400">profissionalizar o seu lucro</span>
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8">
            Pare de deixar dinheiro na mesa dos marketplaces. 
            Recupere sua margem e construa uma base de clientes fiéis.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700 text-lg px-8 py-6">
                <MessageCircle className="h-5 w-5" />
                FALAR COM UM CONSULTOR AGORA
              </Button>
            </a>
          </div>

          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-6 py-3">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              Configuração em até 48 horas • Sem fidelidade • Cancele quando quiser
            </span>
          </div>
        </div>
      </section>

      <DashboardFooter />
    </div>
  );
}
