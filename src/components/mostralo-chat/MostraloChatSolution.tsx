import { Eye, Brain, Pause, BarChart3, Trophy } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'Atendimento Híbrido Invisível',
    description: 'O funcionário usa o WhatsApp Web que já conhece, mas com botões inteligentes de "Tirar Pedido" e "Buscar Produto" injetados na tela. Zero curva de aprendizado.',
    highlight: 'INVISÍVEL',
    color: 'orange'
  },
  {
    icon: Brain,
    title: 'IA que Fecha Vendas',
    description: 'A inteligência artificial entende áudios longos, busca fotos no catálogo, sugere combos e monta o carrinho sozinha. Seu atendente vira um vendedor de elite.',
    highlight: 'INTELIGENTE',
    color: 'blue'
  },
  {
    icon: Pause,
    title: 'Botão de Pausa Estratégica',
    description: 'O controle é sempre do humano. Pause a IA com um clique para intervenções personalizadas. Atendimento VIP quando você quiser.',
    highlight: 'CONTROLE',
    color: 'purple'
  },
  {
    icon: BarChart3,
    title: 'Dashboard de Gestão (BI do Dono)',
    description: 'Relatórios de ROI, tempo economizado, inteligência de mercado e insights de vendas. Tudo em tempo real no seu painel de gestão profissional.',
    highlight: 'DADOS',
    color: 'green'
  },
  {
    icon: Trophy,
    title: 'Ranking de Elite',
    description: 'Saiba quem são seus melhores atendentes com métricas de conversão, tempo de resposta e agilidade. Gamifique e premie a excelência.',
    highlight: 'NOVO',
    color: 'yellow'
  }
];

const colorMap: Record<string, { bg: string; icon: string; badge: string }> = {
  orange: { bg: 'bg-orange-500/20', icon: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-400' },
  blue: { bg: 'bg-blue-500/20', icon: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400' },
  purple: { bg: 'bg-purple-500/20', icon: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400' },
  green: { bg: 'bg-green-500/20', icon: 'text-green-400', badge: 'bg-green-500/20 text-green-400' },
  yellow: { bg: 'bg-emerald-500/20', icon: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400' },
};

export function MostraloChatSolution() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />

      <div className="relative container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-full mb-4">
            A SOLUÇÃO
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
            Conheça o <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Mostralo Chat</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            O sistema que transforma o WhatsApp do seu negócio em uma máquina de vendas — sem mudar nada na rotina da sua equipe.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, i) => {
            const colors = colorMap[feature.color];
            return (
              <div key={i} className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 space-y-4 hover:border-orange-500/40 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${colors.badge}`}>
                    {feature.highlight}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
