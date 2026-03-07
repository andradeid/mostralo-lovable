import { Plug, Zap, TrendingUp } from 'lucide-react';

const steps = [
  {
    icon: Plug,
    step: '01',
    title: 'Conecte',
    description: 'Conecte seu WhatsApp Web ao Mostralo Chat em menos de 2 minutos. Sem instalar nada, sem configurações complicadas.',
    color: 'orange'
  },
  {
    icon: Zap,
    step: '02',
    title: 'Automatize',
    description: 'A IA começa a trabalhar imediatamente: transcreve áudios, busca produtos, cria pedidos e responde clientes. Seus funcionários nem percebem.',
    color: 'green'
  },
  {
    icon: TrendingUp,
    step: '03',
    title: 'Lucre',
    description: 'Acompanhe em tempo real o ROI, a economia de horas e o ranking dos atendentes. Tome decisões com dados, não com achismo.',
    color: 'blue'
  }
];

const colorMap: Record<string, { bg: string; icon: string }> = {
  orange: { bg: 'bg-orange-500/20', icon: 'text-orange-400' },
  green: { bg: 'bg-green-500/20', icon: 'text-green-400' },
  blue: { bg: 'bg-blue-500/20', icon: 'text-blue-400' },
};

export function MostraloChatHowItWorks() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-zinc-900" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-full mb-4">
            COMO FUNCIONA
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
            3 passos para a <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">transformação</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((s, i) => {
            const colors = colorMap[s.color];
            return (
              <div key={i} className="text-center space-y-4">
                <div className="relative mx-auto w-20 h-20 bg-zinc-800/60 rounded-2xl border border-zinc-700 flex items-center justify-center">
                  <s.icon className={`w-8 h-8 ${colors.icon}`} />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">{s.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{s.description}</p>
              </div>
            );
          })}
        </div>

        {/* Connector lines (desktop) */}
        <div className="hidden md:flex justify-center mt-[-180px] mb-[120px] max-w-4xl mx-auto px-20">
          <div className="flex-1 border-t-2 border-dashed border-orange-500/30 mt-10" />
          <div className="flex-1 border-t-2 border-dashed border-orange-500/30 mt-10" />
        </div>
      </div>
    </section>
  );
}
