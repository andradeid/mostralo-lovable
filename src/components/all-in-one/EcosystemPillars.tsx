import { Smartphone, MonitorPlay, TabletSmartphone, BarChart3 } from 'lucide-react';
import { PillarCard } from './PillarCard';

const pillars = [
  {
    icon: Smartphone,
    title: 'Totem de Autoatendimento',
    subtitle: '"O Vendedor Implacável"',
    description: 'Aumenta o Ticket Médio em até 25% com sugestões inteligentes de acompanhamentos. Sem filas, sem erros, 24 horas por dia.',
    stat: '+25% Ticket Médio',
  },
  {
    icon: MonitorPlay,
    title: 'KDS (Monitor de Cozinha)',
    subtitle: '"O Maestro da Chapa"',
    description: 'Elimine papéis. Organize a produção por tempo e prioridade. Zero desperdício, máxima eficiência.',
    stat: 'Zero Papel',
  },
  {
    icon: TabletSmartphone,
    title: 'Comanda Digital Mobile',
    subtitle: '"Velocidade Amazon"',
    description: 'Sua equipe atende no salão com a mesma velocidade de um checkout da Amazon. Tudo lançado, nada esquecido.',
    stat: '3x Mais Rápido',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Global',
    subtitle: '"Gestão Big Data"',
    description: 'Tome decisões baseadas em números reais, não em achismos. Visão 360° do seu negócio em tempo real.',
    stat: 'Tempo Real',
  },
];

export const EcosystemPillars = () => {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container relative z-10">
        {/* Title */}
        <div className="text-center mb-16">
          <p className="text-primary font-semibold mb-3">O ECOSSISTEMA</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            Os 4 Pilares do{' '}
            <span className="text-primary">Sucesso</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cada componente foi desenhado para eliminar gargalos e maximizar sua receita
          </p>
        </div>
        
        {/* Pillars Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, index) => (
            <div 
              key={pillar.title}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <PillarCard {...pillar} />
            </div>
          ))}
        </div>
        
        {/* Integration note */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-secondary/50 border border-primary/20 rounded-full">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-muted-foreground text-sm">
              Todos os sistemas <span className="text-primary font-semibold">sincronizados em tempo real</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
