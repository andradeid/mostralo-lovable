import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { WhatsAppMarketingMockups } from './WhatsAppMarketingMockups';
import { cn } from '@/lib/utils';
import {
  MessageCircle,
  Users,
  Tag,
  Shield,
  FileText,
  Calendar,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  Zap,
  Crown,
  ArrowRight,
  Radar
} from 'lucide-react';

// Componente do ícone SENTINELA com animação de radar
const SentinelaIcon = ({ className, size = "w-4 h-4" }: { className?: string; size?: string }) => (
  <div className={cn("relative inline-flex items-center justify-center", className)}>
    {/* Ondas de radar - múltiplas camadas com delay */}
    <span className="absolute inset-0 rounded-full bg-orange-500/40 animate-radar-ping" />
    <span className="absolute inset-0 rounded-full bg-orange-500/30 animate-radar-ping [animation-delay:0.5s]" />
    <span className="absolute inset-0 rounded-full bg-orange-500/20 animate-radar-ping [animation-delay:1s]" />
    
    {/* Ícone do escudo com glow */}
    <Shield className={cn(size, "relative z-10 animate-shield-glow")} />
  </div>
);

const problemStats = [
  {
    value: '68%',
    label: 'dos clientes nunca mais voltam',
    description: 'Sem comunicação ativa, clientes esquecem de você'
  },
  {
    value: 'R$ 2.400',
    label: 'em vendas perdidas/mês',
    description: 'Restaurante médio que não faz remarketing'
  },
  {
    value: '15 dias',
    label: 'é o tempo médio de "esquecimento"',
    description: 'Depois disso, cliente já foi pro concorrente'
  }
];

const features = [
  {
    icon: Shield,
    title: 'SENTINELA - Recuperação Automática',
    description: 'O Sentinela monitora seus clientes 24h. Identifica inativos e envia mensagens personalizadas automaticamente.',
    isFeatured: true
  },
  {
    icon: Users,
    title: 'Gestão de Contatos',
    description: 'Sincronize automaticamente todos os contatos do WhatsApp. Veja foto, nome e histórico de compras.'
  },
  {
    icon: Tag,
    title: 'Etiquetas Coloridas',
    description: 'Organize clientes: VIP, Novo, Inativo, Frequente. Segmente campanhas com precisão.'
  },
  {
    icon: FileText,
    title: 'Templates Inteligentes',
    description: 'Crie mensagens com variáveis dinâmicas: {nome}, {último_pedido}, {valor_desconto}.'
  },
  {
    icon: Calendar,
    title: 'Campanhas Agendadas',
    description: 'Programe envios em massa com horários específicos, limites diários e pausas automáticas.'
  },
  {
    icon: BarChart3,
    title: 'Métricas em Tempo Real',
    description: 'Acompanhe: mensagens enviadas, clientes recuperados, vendas geradas por campanha.'
  }
];

const results = [
  { icon: TrendingUp, value: '23%', label: 'dos clientes inativos voltam a comprar' },
  { icon: Zap, value: 'R$ 2.400', label: 'aumento médio em vendas/mês' },
  { icon: Clock, value: '8h', label: 'economizadas por mês em trabalho manual' }
];

export const WhatsAppMarketingSection = () => {
  const headerReveal = useScrollReveal();
  const statsReveal = useScrollReveal();
  const mockupsReveal = useScrollReveal();
  const featuresReveal = useScrollReveal();
  const resultsReveal = useScrollReveal();
  const ctaReveal = useScrollReveal();

  return (
    <section 
      id="whatsapp-marketing" 
      className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/20 dark:via-green-950/20 dark:to-teal-950/20 overflow-hidden"
    >
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div
          ref={headerReveal.ref}
          className={cn(
            "text-center mb-12 md:mb-16 transition-all duration-700",
            headerReveal.isVisible 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-8"
          )}
        >
          <Badge className="mb-4 text-base px-4 py-2 bg-orange-500/20 text-orange-500 border-orange-500/30 hover:bg-orange-500/30">
            <SentinelaIcon size="w-4 h-4" className="mr-2" />
            SENTINELA
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Ative o <span className="text-orange-500">SENTINELA</span> e
            <br className="hidden md:inline" />
            <span className="text-[#25D366]"> Nunca Mais Perca um Cliente</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            68% dos clientes que compram uma vez nunca mais voltam. 
            Com o <strong className="text-orange-500">SENTINELA</strong>, você recupera até <strong className="text-[#25D366]">23% deles automaticamente</strong>.
          </p>
        </div>

        {/* Problem Stats */}
        <div
          ref={statsReveal.ref}
          className="grid md:grid-cols-3 gap-4 md:gap-6 mb-16"
        >
          {problemStats.map((stat, index) => (
            <Card
              key={index}
              className={cn(
                "p-6 text-center bg-white/80 dark:bg-emerald-950/30 border-red-200/50 dark:border-red-800/30 transition-all duration-700",
                statsReveal.isVisible 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <p className="text-3xl md:text-4xl font-bold text-destructive mb-2">
                {stat.value}
              </p>
              <p className="font-semibold text-foreground mb-1">{stat.label}</p>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </Card>
          ))}
        </div>

        {/* WhatsApp Mockups */}
        <div
          ref={mockupsReveal.ref}
          className={cn(
            "mb-16 md:mb-20 transition-all duration-1000",
            mockupsReveal.isVisible 
              ? "opacity-100 scale-100" 
              : "opacity-0 scale-95"
          )}
        >
          <h3 className="text-center text-xl md:text-2xl font-bold mb-8">
            Veja como funciona na prática
          </h3>
          <WhatsAppMarketingMockups isVisible={mockupsReveal.isVisible} />
        </div>

        {/* Features Grid */}
        <div
          ref={featuresReveal.ref}
          className="mb-16"
        >
          <h3 className="text-center text-xl md:text-2xl font-bold mb-8">
            Tudo que você precisa para vender mais
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={cn(
                  "p-6 transition-all duration-500 relative overflow-hidden",
                  (feature as any).isFeatured 
                    ? "bg-gradient-to-br from-orange-500/10 to-orange-600/5 dark:from-orange-500/20 dark:to-orange-600/10 border-orange-500/40 hover:border-orange-500/70 hover:shadow-lg hover:shadow-orange-500/20 ring-1 ring-orange-500/20" 
                    : "bg-white/80 dark:bg-emerald-950/30 border-[#25D366]/20 hover:border-[#25D366]/50 hover:shadow-lg hover:shadow-[#25D366]/10",
                  featuresReveal.isVisible 
                    ? "opacity-100 translate-y-0" 
                    : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {(feature as any).isFeatured && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-orange-500 text-white text-xs px-2 py-0.5 animate-pulse">
                      <Radar className="w-3 h-3 mr-1" />
                      NOVO
                    </Badge>
                  </div>
                )}
                {(feature as any).isFeatured ? (
                  <SentinelaIcon size="h-10 w-10" className="mb-4 text-orange-500" />
                ) : (
                  <feature.icon className="h-10 w-10 mb-4 text-[#25D366]" />
                )}
                <h4 className="text-lg font-bold mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Results Card */}
        <div
          ref={resultsReveal.ref}
          className={cn(
            "mb-12 transition-all duration-700",
            resultsReveal.isVisible 
              ? "opacity-100 scale-100" 
              : "opacity-0 scale-95"
          )}
        >
          <Card className="p-8 bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 border-[#25D366]/30 shadow-xl max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <Badge className="bg-[#25D366] text-white text-lg px-6 py-2 mb-4">
                <TrendingUp className="w-5 h-5 mr-2" />
                RESULTADOS COMPROVADOS
              </Badge>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className="text-center"
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <result.icon className="h-8 w-8 text-[#25D366] mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-[#25D366]">
                    {result.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{result.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-[#25D366]/20">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-[#25D366]" />
                <span className="font-semibold">SEM CUSTO ADICIONAL</span>
              </div>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground" />
              <div className="flex items-center gap-2 text-sm">
                <Crown className="h-5 w-5 text-orange-500" />
                <span className="font-semibold text-orange-500">Módulo Premium</span>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA */}
        <div
          ref={ctaReveal.ref}
          className={cn(
            "text-center transition-all duration-700",
            ctaReveal.isVisible 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-8"
          )}
        >
          <p className="text-lg text-muted-foreground mb-6">
            Pare de perder clientes. Comece a recuperar vendas hoje.
          </p>
          <Link to="/signup">
            <Button 
              size="lg" 
              className="text-lg h-14 px-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl hover:shadow-orange-500/25 group"
            >
              <SentinelaIcon size="h-5 w-5" className="mr-2 text-white" />
              Ativar o SENTINELA Agora
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
