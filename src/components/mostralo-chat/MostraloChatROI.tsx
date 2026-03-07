import { Clock, DollarSign, TrendingUp, Users } from 'lucide-react';

const metrics = [
  { icon: Clock, value: '40h', label: 'de trabalho manual economizadas/mês', color: 'orange' },
  { icon: DollarSign, value: 'R$ 4.200', label: 'economia média mensal', color: 'green' },
  { icon: TrendingUp, value: '3x', label: 'mais pedidos atendidos', color: 'blue' },
  { icon: Users, value: '0min', label: 'de treinamento necessário', color: 'purple' }
];

const colorMap: Record<string, { bg: string; icon: string }> = {
  orange: { bg: 'bg-orange-500/20', icon: 'text-orange-400' },
  green: { bg: 'bg-green-500/20', icon: 'text-green-400' },
  blue: { bg: 'bg-blue-500/20', icon: 'text-blue-400' },
  purple: { bg: 'bg-purple-500/20', icon: 'text-purple-400' },
};

export function MostraloChatROI() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent" />

      <div className="relative container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-full mb-4">
            PROVA DE VALOR
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
            Resultados que <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">falam por si</span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Números reais de negócios que transformaram seu WhatsApp com o Mostralo Chat.
          </p>
        </div>

        {/* ROI Card */}
        <div className="max-w-3xl mx-auto bg-zinc-800/50 rounded-2xl border border-zinc-700 p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {metrics.map((m, i) => {
              const colors = colorMap[m.color];
              return (
                <div key={i} className="text-center space-y-2">
                  <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg}`}>
                    <m.icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-white">{m.value}</p>
                  <p className="text-xs text-zinc-500">{m.label}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-700 text-center">
            <p className="text-sm text-zinc-400 italic">
              "Este sistema economizou <strong className="text-orange-400">40 horas de trabalho manual</strong> para nossos clientes apenas este mês."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
