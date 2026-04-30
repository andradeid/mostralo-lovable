import { usePageSEO } from '@/hooks/useSEO';
import { WhatsAppLeadButton } from '@/components/leads/WhatsAppLeadButton';
import { MainFooter } from '@/components/MainFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Scissors, Beer, Calendar, Clock, Calculator,
  CheckCircle, Smartphone, ArrowRight, Store, CreditCard,
  Zap, DollarSign, Target, Star, Shield, Trophy, BarChart3,
  AlertTriangle, XCircle, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Constantes de Estilo V2 (Premium & Clean)
const PREMIUM_BG = "bg-[#FCFCFA]"; // Off-white/Bege suave
const ORANGE_MOSTRLO = "bg-[#FF5C00]"; // Laranja Mostralo para CTAs
const TEXT_DARK = "text-[#1A1A1A]";
const TEXT_MUTED = "text-[#666666]";

const V2CTA = ({ text = "Comece Agora", className = "" }: { text?: string; className?: string }) => (
  <div className={cn("flex flex-col items-center gap-3", className)}>
    <Link to="/signup" className="w-full sm:w-auto">
      <Button 
        size="lg" 
        className="w-full sm:w-auto bg-[#FF5C00] hover:bg-[#E65200] text-white px-10 py-7 rounded-full font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
      >
        {text}
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </Link>
    <div className="flex items-center gap-4 text-xs font-medium text-gray-400 mt-2">
      <span className="flex items-center gap-1">✓ <span className="hidden sm:inline">30 dias grátis</span><span className="sm:hidden">Grátis</span></span>
      <span className="flex items-center gap-1">✓ <span className="hidden sm:inline">Sem cartão</span><span className="sm:hidden">Seguro</span></span>
      <span className="flex items-center gap-1">✓ <span className="hidden sm:inline">Suporte humanizado</span><span className="sm:hidden">Suporte</span></span>
    </div>
  </div>
);

const HeroSectionV2 = () => (
  <section className={cn("relative pt-8 pb-16 md:pt-20 md:pb-16 overflow-hidden", PREMIUM_BG)}>
    <div className="container mx-auto px-4 relative z-10">
      <div className="flex justify-center lg:justify-start mb-8 md:mb-12">
        <Link to="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:rotate-3 transition-transform">
            <Store className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          <span className={cn("text-2xl md:text-3xl font-black tracking-tighter", TEXT_DARK)}>
            Mostra<span className="text-orange-500">lo</span>
          </span>
        </Link>
      </div>
        <div className="flex flex-col items-center lg:grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
        <div className="text-center lg:text-left space-y-6 md:space-y-8 order-2 lg:order-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#FF5C00] text-sm font-bold border border-orange-100">
            <Zap className="w-4 h-4" />
            Software Premium para Barbearias
          </div>
          
          <h1 className={cn("text-3xl md:text-6xl font-extrabold tracking-tight leading-[1.1]", TEXT_DARK)}>
            Sua agenda cheia,<br className="hidden md:block" />
            <span className="text-[#FF5C00]">sem esforço.</span>
          </h1>
          
          <p className={cn("text-base md:text-xl font-medium max-w-xl", TEXT_MUTED)}>
            O sistema de gestão que transforma sua barbearia em um negócio moderno, organizado e altamente lucrativo.
          </p>
          
          <V2CTA text="Agende uma Demonstração" className="lg:items-start" />
          
          <div className="pt-8 border-t border-gray-100 hidden md:block">
            <p className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">Barbearias Parceiras</p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-8 opacity-40 grayscale">
               <div className="font-black text-xl italic">BARBER.SHOP</div>
               <div className="font-black text-xl italic">VINTAGE</div>
               <div className="font-black text-xl italic">THE.CUT</div>
               <div className="font-black text-xl italic">CLASSIC</div>
            </div>
          </div>
        </div>
        
        <div className="relative flex justify-center order-1 lg:order-2 mb-8 md:mb-0">
          <div className="relative w-full max-w-[280px] md:max-w-[320px] aspect-[9/18] bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl border-[8px] border-gray-900 overflow-hidden">
            <div className="h-full w-full bg-white flex flex-col">
              <div className="p-4 md:p-6 pt-8 md:pt-12 space-y-4 md:space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Scissors className="w-5 h-5 md:w-6 md:h-6 text-gray-900" />
                  </div>
                  <div>
                    <p className="font-bold text-xs md:text-sm">Corte & Barba</p>
                    <p className="text-[10px] md:text-xs text-gray-400">Próximo cliente: 14:30h</p>
                  </div>
                </div>
                
                <div className="space-y-2 md:space-y-3">
                  <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-orange-50 border border-orange-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] md:text-[10px] font-bold text-orange-600 uppercase">Confirmado</span>
                      <span className="text-[9px] md:text-[10px] text-gray-400">R$ 75,00</span>
                    </div>
                    <p className="font-bold text-xs md:text-sm text-gray-900">Marcos Silva</p>
                  </div>
                  
                  <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="font-bold text-xs md:text-sm text-gray-400">15:15h - Disponível</p>
                  </div>

                  <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="font-bold text-xs md:text-sm text-gray-400">16:00h - Disponível</p>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-8 p-3 md:p-4 bg-green-50 rounded-xl md:rounded-2xl border border-green-100">
                  <p className="text-[9px] md:text-[10px] font-bold text-green-600 uppercase">PIX Recebido</p>
                  <p className="text-base md:text-lg font-black text-gray-900">R$ 15,00</p>
                  <p className="text-[9px] md:text-[10px] text-gray-400">Sinal de Agendamento</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-orange-500/5 rounded-full blur-3xl" />
        </div>
        </div>
    </div>
  </section>
);

const DisorganizationCostSection = () => (
  <section className="py-16 md:py-24 bg-gray-50 border-y border-gray-100 overflow-hidden relative">
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16 space-y-4">
        <Badge className="bg-red-50 text-red-600 border-red-100 px-4 py-2 font-bold mb-4">
          <AlertTriangle className="w-4 h-4 mr-2" />
          O CUSTO DA DESORGANIZAÇÃO
        </Badge>
        <h2 className={cn("text-2xl md:text-5xl font-black tracking-tight px-2", TEXT_DARK)}>
          Quanto dinheiro você <span className="text-red-600 underline decoration-red-200 underline-offset-8">joga fora</span> por mês?
        </h2>
        <p className={cn("text-base md:text-lg font-medium", TEXT_MUTED)}>
          A desorganização não custa apenas tempo, ela drena seu lucro todos os dias.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto mb-12 md:mb-16">
        {[
          {
            title: 'No-show',
            calc: '2 faltas/dia',
            loss: 'R$ 2.160',
            desc: 'Cadeira parada.',
            icon: XCircle
          },
          {
            title: 'WhatsApp',
            calc: '2h digitando/dia',
            loss: 'R$ 3.360',
            desc: 'Menos cortes.',
            icon: Clock
          },
          {
            title: 'Esquecimentos',
            calc: 'Adicionais não pagos',
            loss: 'R$ 720',
            desc: 'Furo no caixa.',
            icon: Beer
          },
          {
            title: 'Comissão',
            calc: 'Erros e retrabalho',
            loss: 'R$ 800',
            desc: 'Caos financeiro.',
            icon: Calculator
          }
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <Card key={i} className="border-none shadow-sm bg-white group hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 md:p-6 space-y-2 md:space-y-4 text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                </div>
                <h3 className={cn("text-sm md:text-lg font-bold truncate", TEXT_DARK)}>{item.title}</h3>
                <div className="py-1 md:py-2 border-y border-gray-50">
                  <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.calc}</p>
                  <p className="text-lg md:text-2xl font-black text-red-600 mt-0.5 md:mt-1">{item.loss}</p>
                  <p className="text-[8px] md:text-[10px] text-gray-400">/mês</p>
                </div>
                <p className="hidden md:block text-xs text-gray-500">{item.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-[#1A1A1A] rounded-2xl md:rounded-[2.5rem] p-6 md:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative z-10 space-y-2 md:space-y-4">
            <p className="text-red-500 font-bold tracking-widest uppercase text-[10px] md:text-sm">Prejuízo Total Estimado</p>
            <h3 className="text-3xl md:text-6xl font-black text-white">
              R$ 7.040<span className="text-red-500">/mês</span>
            </h3>
            <p className="text-gray-400 text-sm md:text-xl">
              Pare de perder dinheiro. A Mostralo custa menos que <span className="text-white font-bold">2 cortes por mês</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const BenefitsSection = () => (
  <section className="py-16 md:py-24 bg-white">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16 space-y-4">
        <h2 className={cn("text-2xl md:text-5xl font-bold tracking-tight px-4", TEXT_DARK)}>
          Tudo o que sua barbearia precisa,<br className="hidden md:block" /> em um só lugar.
        </h2>
        <p className={cn("text-base md:text-lg", TEXT_MUTED)}>
          Funcionalidades desenhadas para quem busca alta performance e organização.
        </p>
      </div>
      
      <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto px-2 sm:px-0">
        {[
          {
            icon: Target,
            title: "Garantia de Receita",
            desc: "Receba pagamentos na hora, sem burocracia. Envie cobranças de sinal automáticas via WhatsApp.",
            color: "text-green-600",
            bg: "bg-green-50"
          },
          {
            icon: Shield,
            title: "Agenda Blindada",
            desc: "Preencha sua agenda automaticamente e evite cancelamentos de última hora com lembretes inteligentes.",
            color: "text-blue-600",
            bg: "bg-blue-50"
          },
          {
            icon: Trophy,
            title: "Faturamento Recorrente",
            desc: "Crie clubes de assinatura e garanta a fidelidade dos seus clientes com pagamentos mensais automáticos.",
            color: "text-purple-600",
            bg: "bg-purple-50"
          },
          {
            icon: BarChart3,
            title: "Dashboard de Gestão",
            desc: "Controle total do seu faturamento, comissões e estoque em uma interface limpa e intuitiva.",
            color: "text-orange-600",
            bg: "bg-orange-50"
          }
        ].map((benefit, i) => {
          const Icon = benefit.icon;
          return (
            <Card key={i} className="border-none shadow-sm bg-gray-50/50 hover:bg-white hover:shadow-md sm:hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 sm:p-6 md:p-8 flex flex-row sm:flex-col items-start gap-4 sm:gap-4">
                <div className={cn("shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center", benefit.bg)}>
                  <Icon className={cn("w-5 h-5 md:w-6 md:h-6", benefit.color)} />
                </div>
                <div className="space-y-1 sm:space-y-4">
                  <h3 className={cn("text-base sm:text-lg md:text-xl font-bold", TEXT_DARK)}>{benefit.title}</h3>
                  <p className={cn("text-xs sm:text-sm leading-relaxed", TEXT_MUTED)}>{benefit.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  </section>
);

const TestimonialsSection = () => (
  <section className="py-24 bg-gray-50 overflow-hidden">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
        <Badge className="bg-orange-50 text-orange-600 border-orange-100 px-4 py-2 font-bold mb-4">
          PROVA SOCIAL
        </Badge>
        <h2 className={cn("text-3xl md:text-5xl font-black tracking-tight", TEXT_DARK)}>
          Quem usa, <span className="text-[#FF5C00]">recomenda.</span>
        </h2>
        <p className={cn("text-lg font-medium", TEXT_MUTED)}>
          Veja o que barbeiros de todo o Brasil estão falando sobre a Mostralo.
        </p>
      </div>

      <div className="flex overflow-x-auto pb-8 gap-6 no-scrollbar snap-x snap-mandatory">
        {[
          {
            name: "Ricardo Oliveira",
            role: "Dono da Barber Classic",
            image: "https://images.unsplash.com/photo-1581333100576-b73bbe79a05b?w=400&h=400&fit=crop",
            text: "O sistema mudou minha vida. Antes eu perdia horas no WhatsApp, hoje os clientes agendam sozinhos e eu recebo o sinal na hora."
          },
          {
            name: "Felipe Santos",
            role: "Mestre Barbeiro",
            image: "https://images.unsplash.com/photo-1503910361347-3c39aa7455a6?w=400&h=400&fit=crop",
            text: "A funcionalidade de clube de assinaturas é fantástica. Garantiu meu faturamento fixo todo mês e fidelizou meus melhores clientes."
          },
          {
            name: "Gustavo Mendes",
            role: "Rede Gold Barber",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
            text: "Gerenciar 3 unidades era um caos. Com a Mostralo, tenho visão total de comissões e estoque em tempo real pelo celular."
          }
        ].map((testimonial, i) => (
          <Card key={i} className="min-w-[300px] md:min-w-[400px] snap-center border-none shadow-sm hover:shadow-xl transition-all bg-white">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-orange-100"
                />
                <div>
                  <h4 className={cn("font-bold text-lg", TEXT_DARK)}>{testimonial.name}</h4>
                  <p className="text-sm text-[#FF5C00] font-medium">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />)}
              </div>
              <p className={cn("italic leading-relaxed", TEXT_MUTED)}>
                "{testimonial.text}"
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

const PricingSectionV2 = () => (
  <section className={cn("py-16 md:py-24", PREMIUM_BG)}>
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16 space-y-4">
        <h2 className={cn("text-2xl md:text-5xl font-bold tracking-tight px-4", TEXT_DARK)}>
          Planos que crescem com você
        </h2>
        <p className={cn("text-base md:text-lg", TEXT_MUTED)}>
          Escolha a opção ideal para o momento do seu negócio.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {[
          {
            name: 'Essencial',
            price: '97',
            desc: 'Recursos essenciais para pequenos negócios.',
            features: ['Agenda Online 24h', 'Gestão de Clientes', 'Catálogo de Serviços', 'Relatórios Básicos'],
            premium: false
          },
          {
            name: 'Profissional',
            price: '197',
            desc: 'A solução completa para barbearias em crescimento.',
            features: ['Tudo do Essencial', 'WhatsApp Automático', 'Sinal PIX Anti No-Show', 'Comissões Automáticas', 'Clube de Assinaturas'],
            premium: true
          },
          {
            name: 'Empresarial',
            price: 'Sob consulta',
            desc: 'Para redes de barbearias e grandes operações.',
            features: ['Múltiplas Unidades', 'Gestão Centralizada', 'API de Integração', 'Suporte Prioritário'],
            premium: false
          }
        ].map((plan, i) => (
          <Card key={i} className={cn(
            "relative border-none shadow-lg transition-all duration-300",
            plan.premium 
              ? "bg-white ring-2 ring-[#FF5C00] scale-[1.02] shadow-xl z-10" 
              : "bg-white hover:-translate-y-2"
          )}>
            {plan.premium && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FF5C00] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                Mais Escolhido
              </div>
            )}
            <CardHeader className="p-6 md:p-8 text-center space-y-2">
              <h3 className={cn("text-xl md:text-2xl font-bold", TEXT_DARK)}>{plan.name}</h3>
              <p className={cn("text-xs md:text-sm", TEXT_MUTED)}>{plan.desc}</p>
              <div className="pt-4">
                {plan.price.includes('Sob') ? (
                  <span className={cn("text-xl md:text-2xl font-black", TEXT_DARK)}>{plan.price}</span>
                ) : (
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-gray-400 text-base md:text-lg">R$</span>
                    <span className={cn("text-4xl md:text-5xl font-black", TEXT_DARK)}>{plan.price}</span>
                    <span className="text-gray-400">/mês</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0 space-y-6 md:space-y-8">
              <ul className="space-y-3 md:space-y-4">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-[#666]">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 shrink-0" />
                    <span className="flex items-center gap-2">
                      {feature}
                      {feature === 'WhatsApp Automático' && (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-green-500 rounded-full shadow-sm animate-pulse">
                          <MessageSquare className="w-3 h-3 text-white fill-current" />
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <Button 
                className={cn(
                  "w-full py-6 md:py-7 rounded-full font-bold transition-all min-h-[48px]",
                  plan.premium 
                    ? "bg-[#FF5C00] hover:bg-[#E65200] text-white shadow-lg shadow-orange-500/20" 
                    : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                )}
              >
                {plan.price.includes('Sob') ? 'Falar com Consultor' : 'Começar Agora'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

const ConversionSection = () => (
  <section className="py-16 md:py-24 bg-white text-center">
    <div className="container mx-auto px-6 md:px-8">
      <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
        <h2 className={cn("text-2xl md:text-5xl font-bold tracking-tight", TEXT_DARK)}>
          Sua barbearia merece o <span className="text-[#FF5C00]">melhor sistema.</span>
        </h2>
        <p className={cn("text-base md:text-lg", TEXT_MUTED)}>
          Junte-se a centenas de barbeiros que profissionalizaram sua gestão e multiplicaram seus lucros com a Mostralo.
        </p>
        <V2CTA text="QUERO TESTAR 30 DIAS GRÁTIS AGORA" />
      </div>
    </div>
  </section>
);

const NichoBarbeariasV2Page = () => {
  usePageSEO({
    title: 'Sistema para Barbearias | Agenda Cheia & Gestão Premium | Mostralo',
    description: 'Transforme sua barbearia com o software de gestão mais moderno do mercado. Agenda online, pagamentos via PIX, clube de assinaturas e gestão completa. Teste grátis 30 dias.',
    keywords: 'sistema barbearia, agenda barbearia, software barbershop, gestão barbearia, comanda digital, clube assinatura barbearia',
  });

  return (
    <div className="min-h-screen selection:bg-orange-100 selection:text-orange-900">
      <HeroSectionV2 />
      <DisorganizationCostSection />
      <BenefitsSection />
      <TestimonialsSection />
      <PricingSectionV2 />
      <ConversionSection />
      
      {/* Footer & Buttons */}
      <MainFooter variant="light" />
      <WhatsAppLeadButton />
    </div>
  );
};

export default NichoBarbeariasV2Page;