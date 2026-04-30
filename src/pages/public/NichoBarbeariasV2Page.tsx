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
  Zap, DollarSign, Target, Star, Shield, Trophy, BarChart3
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
    <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
      <span>✓ 30 dias grátis</span>
      <span>✓ Sem cartão</span>
      <span>✓ Suporte humanizado</span>
    </div>
  </div>
);

const HeroSectionV2 = () => (
  <section className={cn("relative pt-20 pb-16 overflow-hidden", PREMIUM_BG)}>
    <div className="container mx-auto px-4 relative z-10">
      <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
        <div className="text-center lg:text-left space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#FF5C00] text-sm font-bold border border-orange-100">
            <Zap className="w-4 h-4" />
            Software Premium para Barbearias
          </div>
          
          <h1 className={cn("text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]", TEXT_DARK)}>
            Sua agenda cheia,<br />
            <span className="text-[#FF5C00]">sem esforço.</span>
          </h1>
          
          <p className={cn("text-lg md:text-xl font-medium max-w-xl", TEXT_MUTED)}>
            O sistema de gestão que transforma sua barbearia em um negócio moderno, organizado e altamente lucrativo.
          </p>
          
          <V2CTA text="Agende uma Demonstração" className="lg:items-start" />
          
          <div className="pt-8 border-t border-gray-100">
            <p className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">Barbearias Parceiras</p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-8 opacity-40 grayscale">
               <div className="font-black text-xl italic">BARBER.SHOP</div>
               <div className="font-black text-xl italic">VINTAGE</div>
               <div className="font-black text-xl italic">THE.CUT</div>
               <div className="font-black text-xl italic">CLASSIC</div>
            </div>
          </div>
        </div>
        
        <div className="relative flex justify-center">
          <div className="relative w-full max-w-[320px] aspect-[9/18] bg-white rounded-[3rem] shadow-2xl border-[8px] border-gray-900 overflow-hidden">
            {/* Mockup simplificado e limpo */}
            <div className="h-full w-full bg-white flex flex-col">
              <div className="p-6 pt-12 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Scissors className="w-6 h-6 text-gray-900" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Corte & Barba</p>
                    <p className="text-xs text-gray-400">Próximo cliente: 14:30h</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-orange-600 uppercase">Confirmado</span>
                      <span className="text-[10px] text-gray-400">R$ 75,00</span>
                    </div>
                    <p className="font-bold text-sm text-gray-900">Marcos Silva</p>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="font-bold text-sm text-gray-400">15:15h - Disponível</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="font-bold text-sm text-gray-400">16:00h - Disponível</p>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-green-50 rounded-2xl border border-green-100">
                  <p className="text-[10px] font-bold text-green-600 uppercase">PIX Recebido</p>
                  <p className="text-lg font-black text-gray-900">R$ 15,00</p>
                  <p className="text-[10px] text-gray-400">Sinal de Agendamento</p>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-orange-500/5 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  </section>
);

const BenefitsSection = () => (
  <section className="py-24 bg-white">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
        <h2 className={cn("text-3xl md:text-5xl font-bold tracking-tight", TEXT_DARK)}>
          Tudo o que sua barbearia precisa,<br />em um só lugar.
        </h2>
        <p className={cn("text-lg", TEXT_MUTED)}>
          Funcionalidades desenhadas para quem busca alta performance e organização.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
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
            <Card key={i} className="border-none shadow-sm bg-gray-50/50 hover:bg-white hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8 space-y-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", benefit.bg)}>
                  <Icon className={cn("w-6 h-6", benefit.color)} />
                </div>
                <h3 className={cn("text-xl font-bold", TEXT_DARK)}>{benefit.title}</h3>
                <p className={cn("text-sm leading-relaxed", TEXT_MUTED)}>{benefit.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  </section>
);

const PricingSectionV2 = () => (
  <section className={cn("py-24", PREMIUM_BG)}>
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
        <h2 className={cn("text-3xl md:text-5xl font-bold tracking-tight", TEXT_DARK)}>
          Planos que crescem com você
        </h2>
        <p className={cn("text-lg", TEXT_MUTED)}>
          Escolha a opção ideal para o momento do seu negócio.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
            "relative border-none shadow-lg transition-all duration-300 hover:-translate-y-2",
            plan.premium ? "bg-white ring-2 ring-[#FF5C00]" : "bg-white"
          )}>
            {plan.premium && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FF5C00] text-white text-xs font-bold rounded-full uppercase tracking-wider">
                Mais Escolhido
              </div>
            )}
            <CardHeader className="p-8 text-center space-y-2">
              <h3 className={cn("text-2xl font-bold", TEXT_DARK)}>{plan.name}</h3>
              <p className={cn("text-sm", TEXT_MUTED)}>{plan.desc}</p>
              <div className="pt-4">
                {plan.price.includes('Sob') ? (
                  <span className={cn("text-2xl font-black", TEXT_DARK)}>{plan.price}</span>
                ) : (
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-gray-400 text-lg">R$</span>
                    <span className={cn("text-5xl font-black", TEXT_DARK)}>{plan.price}</span>
                    <span className="text-gray-400">/mês</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              <ul className="space-y-4">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-[#666]">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                className={cn(
                  "w-full py-6 rounded-full font-bold transition-all",
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

const NichoBarbeariasV2Page = () => {
  usePageSEO({
    title: 'Mostralo - Gestão Premium para Barbearias',
    description: 'Transforme sua barbearia com o software de gestão mais moderno do mercado. Agenda online, pagamentos via PIX e muito mais.',
    keywords: 'sistema barbearia premium, agenda barbearia moderna, gestão barbearia clean',
  });

  return (
    <div className="min-h-screen selection:bg-orange-100 selection:text-orange-900">
      <HeroSectionV2 />
      <BenefitsSection />
      <PricingSectionV2 />
      
      {/* Footer & Buttons */}
      <MainFooter variant="light" />
      <WhatsAppLeadButton />
    </div>
  );
};

export default NichoBarbeariasV2Page;
