import { Plug, Zap, TrendingUp } from 'lucide-react';

const steps = [
  {
    icon: Plug,
    step: '01',
    title: 'Conecte',
    description: 'Conecte seu WhatsApp Web ao Mostralo Chat em menos de 2 minutos. Sem instalar nada, sem configurações complicadas.'
  },
  {
    icon: Zap,
    step: '02',
    title: 'Automatize',
    description: 'A IA começa a trabalhar imediatamente: transcreve áudios, busca produtos, cria pedidos e responde clientes. Seus funcionários nem percebem.'
  },
  {
    icon: TrendingUp,
    step: '03',
    title: 'Lucre',
    description: 'Acompanhe em tempo real o ROI, a economia de horas e o ranking dos atendentes. Tome decisões com dados, não com achismo.'
  }
];

export function MostraloChatHowItWorks() {
  return (
    <section className="py-16 md:py-24 bg-[#F8F9FA]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold text-[#F0702E] bg-[#F0702E]/10 px-4 py-1.5 rounded-full mb-4">
            COMO FUNCIONA
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
            3 passos para a <span className="text-[#F0702E]">transformação</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="relative mx-auto w-20 h-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                <s.icon className="w-8 h-8 text-[#F0702E]" />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#F0702E] text-white text-xs font-bold flex items-center justify-center">
                  {s.step}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{s.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>

        {/* Connector lines (desktop) */}
        <div className="hidden md:flex justify-center mt-[-180px] mb-[120px] max-w-4xl mx-auto px-20">
          <div className="flex-1 border-t-2 border-dashed border-[#F0702E]/30 mt-10" />
          <div className="flex-1 border-t-2 border-dashed border-[#F0702E]/30 mt-10" />
        </div>
      </div>
    </section>
  );
}
