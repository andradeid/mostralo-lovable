import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PromotionBanner } from '@/components/coupons/PromotionBanner';
import { PhoneMockup } from '@/components/promo/PhoneMockup';
import { LeadChatFormLight } from '@/components/leads/LeadChatFormLight';
import { 
  Bot,
  MessageSquare,
  ShoppingBag,
  Smartphone,
  ClipboardList,
  CheckCircle2,
  Sparkles,
  Zap
} from 'lucide-react';

interface HeroSectionProps {
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  hidePrimaryButton?: boolean;
}

export const HeroSection = ({ 
  secondaryButtonText = "Ver Demonstração",
  secondaryButtonLink = "/users-demo",
  hidePrimaryButton = false
}: HeroSectionProps) => {
  return (
    <section className="relative py-12 md:py-20 lg:py-24 w-full overflow-hidden">
      {/* Background Tecnológico */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      <div className="relative container px-4 md:px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Conteúdo Textual */}
          <div className="flex flex-col space-y-6 text-center lg:text-left">
            <Badge className="w-fit mx-auto lg:mx-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm px-4 py-2 border-0">
              <Sparkles className="w-4 h-4 mr-2" />
              IA Mais Inteligente do Brasil
            </Badge>
            
            <div className="space-y-4">
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white">
                Atendimento com
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 mt-2">
                  Inteligência Artificial
                </span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-300 max-w-xl mx-auto lg:mx-0">
                Nossa IA faz <strong className="text-orange-400">todo o atendimento</strong> do seu delivery, 
                evitando erros na hora do pedido e aumentando suas vendas em até <strong className="text-green-400">40%</strong>.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <ShoppingBag className="w-5 h-5 text-orange-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white text-sm">Pedidos de Delivery</h3>
                  <p className="text-xs text-zinc-400">Zero erros, 100% automático</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Smartphone className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white text-sm">Cardápio Digital</h3>
                  <p className="text-xs text-zinc-400">QR Code + Link próprio</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <ClipboardList className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white text-sm">Gestor de Pedidos</h3>
                  <p className="text-xs text-zinc-400">Painel completo em tempo real</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Bot className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white text-sm">Atendente IA</h3>
                  <p className="text-xs text-zinc-400">24h/7 dias, sem pausas</p>
                </div>
              </div>
            </div>

            {/* Benefícios */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-zinc-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Sem erros de pedido</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Atendimento instantâneo</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Funciona 24 horas</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {!hidePrimaryButton && (
                <Link to="/registro">
                  <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all">
                    <Zap className="mr-2 h-5 w-5" />
                    Testar Grátis
                  </Button>
                </Link>
              )}
              <Link to={secondaryButtonLink} className={hidePrimaryButton ? "w-full sm:w-auto" : ""}>
                <Button size="lg" className={`text-lg h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all ${hidePrimaryButton ? "w-full sm:w-auto sm:min-w-[320px] px-12" : "w-full sm:w-auto px-8"}`}>
                  <MessageSquare className="mr-2 h-5 w-5" />
                  {secondaryButtonText}
                </Button>
              </Link>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="flex justify-center lg:justify-end mt-8 lg:mt-0">
            <PhoneMockup>
              <LeadChatFormLight />
            </PhoneMockup>
          </div>
        </div>

        {/* Banner de Cupons */}
        <div className="mt-12 w-full max-w-4xl mx-auto">
          <PromotionBanner />
        </div>
      </div>
    </section>
  );
};
