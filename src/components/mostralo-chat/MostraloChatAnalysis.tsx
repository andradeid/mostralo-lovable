import { 
  Brain, DollarSign, Target, Eye, ShieldAlert, BarChart3, 
  TrendingDown, Clock, AlertTriangle, ArrowRight, Zap, MessageCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const painPoints = [
  {
    icon: TrendingDown,
    stat: '73%',
    title: 'das vendas perdidas são invisíveis',
    description: 'O cliente perguntou, demonstrou interesse… e sumiu. Você nem sabe que perdeu dinheiro.'
  },
  {
    icon: Clock,
    stat: '47min',
    title: 'é o tempo médio pra responder',
    description: 'Enquanto seu atendente demora, o concorrente já fechou. E você? Nem sabia.'
  },
  {
    icon: AlertTriangle,
    stat: 'R$12k',
    title: 'escapam pelo WhatsApp todo mês',
    description: 'Vendas fora do sistema, sem registro, sem controle. Dinheiro que entra e some no escuro.'
  }
];

const features = [
  {
    icon: Brain,
    title: 'IA que lê cada conversa',
    description: 'Analisa intenção de compra, objeções, valor estimado e se o atendente converteu ou perdeu.'
  },
  {
    icon: DollarSign,
    title: 'Faturamento invisível revelado',
    description: 'Descubra quanto entra pelo WhatsApp sem passar pelo sistema. Veja o impacto real no seu caixa.'
  },
  {
    icon: Target,
    title: 'Ranking de oportunidades perdidas',
    description: 'Conversas com intenção mas sem fechamento, ordenadas por valor. Saiba onde focar.'
  },
  {
    icon: Eye,
    title: 'Funil de conversão real',
    description: 'Quantas conversas chegam, quantas demonstram interesse, quantas fecham — e onde você perde.'
  },
  {
    icon: ShieldAlert,
    title: 'Alertas inteligentes',
    description: '"Você perde mais vendas às 19h" • "Terça tem mais intenção mas menos conversão".'
  },
  {
    icon: BarChart3,
    title: 'Tempo de resposta monitorado',
    description: 'Compare velocidade humano vs IA. Saiba se a demora está custando vendas — com números.'
  }
];

const niches = [
  'Restaurantes', 'Barbearias', 'Pet Shops', 'Farmácias',
  'Clínicas', 'Lojas', 'Prestadores de Serviço', 'Delivery'
];

export function MostraloChatAnalysis() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background matching MostraloChat dark theme */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-zinc-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative container mx-auto px-4">
        {/* === ATENÇÃO (A) === */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-500/30 rounded-full px-4 py-2 mb-6">
            <Brain className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-semibold text-violet-300">Análise Comercial com IA</span>
          </div>

          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 max-w-4xl mx-auto leading-tight">
            Você sabe quanto dinheiro{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
              escapa pelo seu WhatsApp?
            </span>
          </h2>

          <p className="text-lg text-zinc-400 max-w-3xl mx-auto">
            A verdade que ninguém te conta: seu WhatsApp é uma{' '}
            <strong className="text-white">mina de ouro sem mapa</strong>.
            Vendas acontecem, se perdem, e você continua no escuro.{' '}
            <span className="text-violet-400 font-semibold">Até agora.</span>
          </p>
        </div>

        {/* === INTERESSE (I) - Dor com números === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="relative p-6 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 hover:border-red-500/30 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-500/20 text-red-400 group-hover:scale-110 transition-transform">
                  <point.icon className="h-5 w-5" />
                </div>
                <span className="text-2xl md:text-3xl font-black text-red-400">
                  {point.stat}
                </span>
              </div>
              <h3 className="font-bold text-white mb-2">{point.title}</h3>
              <p className="text-sm text-zinc-400">{point.description}</p>
            </div>
          ))}
        </div>

        {/* === DESEJO (D) - A solução === */}
        <div className="text-center mb-10">
          <h3 className="text-xl md:text-3xl font-bold text-white mb-3">
            <Zap className="inline h-6 w-6 text-violet-400 mr-2" />
            Raio-X completo das suas vendas{' '}
            <span className="text-violet-400">com inteligência artificial</span>
          </h3>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            A IA lê cada conversa do seu WhatsApp e transforma em inteligência de vendas. 
            Sem achismo. Sem planilha. Sem depender de feeling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 hover:border-violet-500/30 transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400 w-fit mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-white mb-2">{feature.title}</h4>
              <p className="text-sm text-zinc-400">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Nichos */}
        <div className="text-center mb-12">
          <p className="text-sm text-zinc-500 mb-3 font-medium">
            <MessageCircle className="inline h-4 w-4 mr-1" />
            Funciona para qualquer negócio que vende pelo WhatsApp:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {niches.map((niche) => (
              <span
                key={niche}
                className="px-3 py-1 text-xs font-medium rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20"
              >
                {niche}
              </span>
            ))}
          </div>
        </div>

        {/* === AÇÃO (A) === */}
        <div className="max-w-2xl mx-auto text-center p-8 bg-gradient-to-br from-violet-600/90 to-purple-700/90 rounded-2xl border border-violet-500/30 shadow-2xl shadow-violet-900/30">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
            Pare de adivinhar. Comece a decidir com dados.
          </h3>
          <p className="text-violet-100 mb-6">
            Enquanto seu concorrente ainda conta vendas no papel, você vai ter um dashboard 
            que mostra cada real que entra, sai e escapa pelo WhatsApp.
          </p>
          <Link to="/signup">
            <Button
              size="lg"
              className="h-14 px-10 text-base font-bold rounded-xl bg-white text-violet-700 hover:bg-violet-50 shadow-lg hover:shadow-xl transition-all"
            >
              QUERO ENXERGAR MINHAS VENDAS REAIS
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-violet-200 mt-4">
            Sem compromisso • Setup em minutos • IA analisa automaticamente
          </p>
        </div>
      </div>
    </section>
  );
}
