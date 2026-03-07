import { Clock, DollarSign, TrendingUp, Users } from 'lucide-react';

const metrics = [
  { icon: Clock, value: '40h', label: 'de trabalho manual economizadas/mês', color: '#F0702E' },
  { icon: DollarSign, value: 'R$ 4.200', label: 'economia média mensal', color: '#16a34a' },
  { icon: TrendingUp, value: '3x', label: 'mais pedidos atendidos', color: '#2563eb' },
  { icon: Users, value: '0min', label: 'de treinamento necessário', color: '#7c3aed' }
];

export function MostraloChatROI() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold text-[#F0702E] bg-[#F0702E]/10 px-4 py-1.5 rounded-full mb-4">
            PROVA DE VALOR
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
            Resultados que <span className="text-[#F0702E]">falam por si</span>
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Números reais de negócios que transformaram seu WhatsApp com o Mostralo Chat.
          </p>
        </div>

        {/* ROI Card */}
        <div className="max-w-3xl mx-auto bg-[#F8F9FA] rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {metrics.map((m, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${m.color}15` }}>
                  <m.icon className="w-6 h-6" style={{ color: m.color }} />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{m.value}</p>
                <p className="text-xs text-gray-500">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 italic">
              "Este sistema economizou <strong className="text-[#F0702E]">40 horas de trabalho manual</strong> para nossos clientes apenas este mês."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
