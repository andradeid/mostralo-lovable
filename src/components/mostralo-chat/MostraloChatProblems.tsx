import { Mic, Clock, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const problems = [
  {
    icon: Mic,
    title: 'O Caos do Áudio',
    description: 'Ninguém aguenta ouvir áudios de 2 minutos no horário de pico. Pedidos se perdem, clientes irritados e dinheiro escorrendo pelo ralo.',
    emoji: '🎤'
  },
  {
    icon: Clock,
    title: 'A Fuga de Clientes',
    description: 'Demora no atendimento é venda perdida para o concorrente. Cada minuto de espera é um cliente que desiste e nunca mais volta.',
    emoji: '⏰'
  },
  {
    icon: ShieldAlert,
    title: 'A Barreira Tecnológica',
    description: 'Funcionários que não usam o sistema porque "é difícil". Você paga pela ferramenta, mas ela fica abandonada.',
    emoji: '🚫'
  }
];

export function MostraloChatProblems() {
  return (
    <section className="py-16 md:py-24 bg-[#F8F9FA]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold text-[#F0702E] bg-[#F0702E]/10 px-4 py-1.5 rounded-full mb-4">
            O PROBLEMA
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
            Você reconhece essas <span className="text-[#F0702E]">dores</span>?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Se você gerencia um delivery ou e-commerce pelo WhatsApp, provavelmente sofre com pelo menos um desses problemas todos os dias.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {problems.map((problem, i) => (
            <Card key={i} className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-[#F0702E]/10 rounded-2xl flex items-center justify-center">
                  <problem.icon className="w-8 h-8 text-[#F0702E]" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{problem.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{problem.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
