import { Eye, Brain, Pause, BarChart3, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Eye,
    title: 'Atendimento Híbrido Invisível',
    description: 'O funcionário usa o WhatsApp Web que já conhece, mas com botões inteligentes de "Tirar Pedido" e "Buscar Produto" injetados na tela. Zero curva de aprendizado.',
    highlight: 'INVISÍVEL'
  },
  {
    icon: Brain,
    title: 'IA que Fecha Vendas',
    description: 'A inteligência artificial entende áudios longos, busca fotos no catálogo, sugere combos e monta o carrinho sozinha. Seu atendente vira um vendedor de elite.',
    highlight: 'INTELIGENTE'
  },
  {
    icon: Pause,
    title: 'Botão de Pausa Estratégica',
    description: 'O controle é sempre do humano. Pause a IA com um clique para intervenções personalizadas. Atendimento VIP quando você quiser.',
    highlight: 'CONTROLE'
  },
  {
    icon: BarChart3,
    title: 'Dashboard de Gestão (BI do Dono)',
    description: 'Relatórios de ROI, tempo economizado, inteligência de mercado e insights de vendas. Tudo em tempo real no seu painel de gestão profissional.',
    highlight: 'DADOS'
  },
  {
    icon: Trophy,
    title: 'Ranking de Elite',
    description: 'Saiba quem são seus melhores atendentes com métricas de conversão, tempo de resposta e agilidade. Gamifique e premie a excelência.',
    highlight: 'NOVO'
  }
];

export function MostraloChatSolution() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold text-[#F0702E] bg-[#F0702E]/10 px-4 py-1.5 rounded-full mb-4">
            A SOLUÇÃO
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
            Conheça o <span className="text-[#F0702E]">Mostralo Chat</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            O sistema que transforma o WhatsApp do seu negócio em uma máquina de vendas — sem mudar nada na rotina da sua equipe.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <Card key={i} className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all rounded-2xl group hover:border-[#F0702E]/30">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-[#F0702E]/10 rounded-xl flex items-center justify-center group-hover:bg-[#F0702E]/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-[#F0702E]" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    feature.highlight === 'NOVO' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-[#F0702E]/10 text-[#F0702E]'
                  }`}>
                    {feature.highlight}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
