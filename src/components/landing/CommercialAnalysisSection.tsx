import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  TrendingDown,
  Eye,
  Clock,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Brain,
  Target,
  Zap,
  MessageCircle,
  ShieldAlert
} from 'lucide-react';

const painPoints = [
  {
    icon: TrendingDown,
    stat: '73%',
    title: 'das vendas perdidas são invisíveis',
    description: 'O cliente perguntou, demonstrou interesse... e sumiu. Você nem sabe que perdeu dinheiro.'
  },
  {
    icon: Clock,
    stat: '47min',
    title: 'é o tempo médio pra responder',
    description: 'Enquanto seu atendente demora, o concorrente já fechou. E você? Nem sabia que estava perdendo.'
  },
  {
    icon: AlertTriangle,
    stat: 'R$ 12k',
    title: 'escapam pelo WhatsApp todo mês',
    description: 'Vendas feitas fora do sistema, sem registro, sem controle. Dinheiro que entra e some no escuro.'
  }
];

const features = [
  {
    icon: Brain,
    title: 'IA que lê cada conversa',
    description: 'Analisa automaticamente intenção de compra, objeções, valor estimado e se o atendente converteu ou perdeu.'
  },
  {
    icon: DollarSign,
    title: 'Faturamento invisível revelado',
    description: 'Descubra quanto entra pelo WhatsApp sem passar pelo sistema. Veja o impacto real no seu caixa.'
  },
  {
    icon: Target,
    title: 'Ranking de oportunidades perdidas',
    description: 'Conversas com intenção mas sem fechamento, ordenadas por valor. Saiba exatamente onde focar.'
  },
  {
    icon: Eye,
    title: 'Funil de conversão real',
    description: 'Veja quantas conversas chegam, quantas demonstram interesse, quantas fecham — e onde você perde.'
  },
  {
    icon: ShieldAlert,
    title: 'Alertas inteligentes',
    description: '"Você perde mais vendas às 19h" • "Terça tem mais intenção mas menos conversão" • Insights automáticos.'
  },
  {
    icon: BarChart3,
    title: 'Tempo de resposta monitorado',
    description: 'Compare velocidade humano vs IA. Saiba se a demora está custando vendas — com números reais.'
  }
];

const niches = [
  'Restaurantes', 'Barbearias', 'Pet Shops', 'Farmácias',
  'Clínicas', 'Lojas', 'Prestadores de Serviço', 'Delivery'
];

export const CommercialAnalysisSection = () => {
  const headerReveal = useScrollReveal();
  const painReveal = useScrollReveal();
  const featuresReveal = useScrollReveal();
  const ctaReveal = useScrollReveal();

  return (
    <section
      id="analise-comercial"
      className="relative py-12 md:py-20 lg:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 dark:from-violet-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative container px-4 md:px-6">
        {/* === ATENÇÃO (A) === */}
        <div
          ref={headerReveal.ref}
          className={cn(
            "text-center mb-12 md:mb-16 transition-all duration-700",
            headerReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="inline-flex items-center gap-2 bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 rounded-full px-4 py-2 mb-6">
            <Brain className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
              Inteligência Artificial de Vendas
            </span>
          </div>

          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Você sabe quanto dinheiro{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400">
              escapa pelo seu WhatsApp?
            </span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            A verdade que ninguém te conta: seu WhatsApp é uma <strong className="text-foreground">mina de ouro sem mapa</strong>. 
            Vendas acontecem, se perdem, e você continua no escuro.{' '}
            <span className="text-violet-600 dark:text-violet-400 font-semibold">Até agora.</span>
          </p>
        </div>

        {/* === INTERESSE (I) - Dor com números === */}
        <div
          ref={painReveal.ref}
          className={cn(
            "grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 transition-all duration-700",
            painReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {painPoints.map((point, index) => (
            <Card
              key={index}
              className="relative p-6 bg-background/80 backdrop-blur-sm border-border/50 hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300 hover:shadow-lg group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                  <point.icon className="h-5 w-5" />
                </div>
                <span className="text-2xl md:text-3xl font-black text-red-600 dark:text-red-400">
                  {point.stat}
                </span>
              </div>
              <h3 className="font-bold text-foreground mb-2">{point.title}</h3>
              <p className="text-sm text-muted-foreground">{point.description}</p>
            </Card>
          ))}
        </div>

        {/* === DESEJO (D) - A solução === */}
        <div
          ref={featuresReveal.ref}
          className={cn(
            "transition-all duration-700",
            featuresReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="text-center mb-10">
            <h3 className="text-xl md:text-3xl font-bold text-foreground mb-3">
              <Zap className="inline h-6 w-6 text-violet-600 dark:text-violet-400 mr-2" />
              Análise Comercial com IA:{' '}
              <span className="text-violet-600 dark:text-violet-400">
                raio-X completo das suas vendas
              </span>
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A IA lê cada conversa do seu WhatsApp e transforma em inteligência de vendas. 
              Sem achismo. Sem planilha. Sem depender de feeling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 bg-background/80 backdrop-blur-sm border-border/50 hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300 hover:shadow-lg group"
              >
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-foreground mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>

          {/* Nichos compatíveis */}
          <div className="text-center mb-10">
            <p className="text-sm text-muted-foreground mb-3 font-medium">
              <MessageCircle className="inline h-4 w-4 mr-1" />
              Funciona para qualquer negócio que vende pelo WhatsApp:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {niches.map((niche) => (
                <span
                  key={niche}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700"
                >
                  {niche}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* === AÇÃO (A) === */}
        <div
          ref={ctaReveal.ref}
          className={cn(
            "text-center transition-all duration-700",
            ctaReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <Card className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-violet-600 to-purple-700 text-white border-0 shadow-2xl">
            <h3 className="text-xl md:text-2xl font-bold mb-3">
              Pare de adivinhar. Comece a decidir com dados.
            </h3>
            <p className="text-violet-100 mb-6">
              Enquanto seu concorrente ainda conta vendas no papel, você vai ter um dashboard de inteligência 
              comercial que mostra cada real que entra, sai e escapa pelo WhatsApp.
            </p>
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-white text-violet-700 hover:bg-violet-50 font-bold text-base px-8 gap-2"
              >
                QUERO ENXERGAR MINHAS VENDAS REAIS
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <p className="text-xs text-violet-200 mt-4">
              Sem compromisso • Setup em minutos • IA analisa automaticamente
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};
