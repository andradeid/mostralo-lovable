import { Mic, Clock, ShieldAlert } from 'lucide-react';

const problems = [
  {
    icon: Mic,
    title: 'O Caos do Áudio',
    description: 'Ninguém aguenta ouvir áudios de 2 minutos no horário de pico. Pedidos se perdem, clientes irritados e dinheiro escorrendo pelo ralo.',
    color: 'orange'
  },
  {
    icon: Clock,
    title: 'A Fuga de Clientes',
    description: 'Demora no atendimento é venda perdida para o concorrente. Cada minuto de espera é um cliente que desiste e nunca mais volta.',
    color: 'red'
  },
  {
    icon: ShieldAlert,
    title: 'A Barreira Tecnológica',
    description: 'Funcionários que não usam o sistema porque "é difícil". Você paga pela ferramenta, mas ela fica abandonada.',
    color: 'purple'
  }
];

const colorMap: Record<string, { bg: string; icon: string }> = {
  orange: { bg: 'bg-orange-500/20', icon: 'text-orange-400' },
  red: { bg: 'bg-red-500/20', icon: 'text-red-400' },
  purple: { bg: 'bg-purple-500/20', icon: 'text-purple-400' },
};

export function MostraloChatProblems() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-zinc-900" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-full mb-4">
            O PROBLEMA
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
            Você reconhece essas <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">dores</span>?
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Se você gerencia um delivery ou e-commerce pelo WhatsApp, provavelmente sofre com pelo menos um desses problemas todos os dias.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {problems.map((problem, i) => {
            const colors = colorMap[problem.color];
            return (
              <div key={i} className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 text-center space-y-4 hover:border-orange-500/40 transition-colors">
                <div className={`mx-auto w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center`}>
                  <problem.icon className={`w-8 h-8 ${colors.icon}`} />
                </div>
                <h3 className="text-lg font-bold text-white">{problem.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{problem.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
