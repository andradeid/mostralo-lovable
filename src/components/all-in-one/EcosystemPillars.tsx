import { Smartphone, MonitorPlay, TabletSmartphone, BarChart3 } from 'lucide-react';
import { PillarCard } from './PillarCard';
import { useEffect, useState, useRef } from 'react';

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
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 50%)',
          }}
        />
        
        {/* Floating orbs */}
        <div 
          className="absolute top-10 right-10 w-40 h-40 rounded-full animate-float-orb"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)',
          }}
        />
        <div 
          className="absolute bottom-10 left-10 w-28 h-28 rounded-full animate-float-orb-reverse"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
          }}
        />
      </div>
      
      <div className="container relative z-10">
        {/* Title */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-primary font-semibold mb-3 tracking-wider uppercase animate-pulse">O Ecossistema</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            Os 4 Pilares do{' '}
            <span className="text-primary relative">
              Sucesso
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 8" fill="none" preserveAspectRatio="none">
                <path 
                  d="M2 6C25 2 75 2 98 6" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  className={isVisible ? 'animate-draw-line' : ''}
                  strokeDasharray="100"
                  strokeDashoffset="100"
                />
              </svg>
            </span>
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
              className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${200 + index * 150}ms` }}
            >
              <PillarCard {...pillar} delay={isVisible ? 0.2 + index * 0.15 : 0} />
            </div>
          ))}
        </div>
        
        {/* Integration note with animated icons */}
        <div className={`mt-12 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '800ms' }}>
          <div className="inline-flex items-center gap-4 px-6 py-4 bg-secondary/50 backdrop-blur-sm border border-primary/20 rounded-full hover:shadow-[0_0_30px_rgba(var(--primary),0.15)] transition-all duration-500">
            {/* Animated icons */}
            <div className="flex -space-x-3">
              {pillars.map((pillar, i) => {
                const Icon = pillar.icon;
                return (
                  <div 
                    key={i}
                    className="w-9 h-9 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center transition-all duration-300 hover:scale-110 hover:z-10"
                    style={{ 
                      animation: isVisible ? `iconPop 0.4s ${i * 0.1}s ease-out forwards` : 'none',
                      opacity: 0,
                      transform: 'scale(0)',
                    }}
                  >
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-muted-foreground text-sm">
                Todos <span className="text-primary font-semibold">sincronizados em tempo real</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes draw-line {
          to { stroke-dashoffset: 0; }
        }
        .animate-draw-line {
          animation: draw-line 1s ease-out 0.3s forwards;
        }

        @keyframes float-orb {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-25px, 20px); }
        }
        .animate-float-orb {
          animation: float-orb 10s ease-in-out infinite;
        }
        .animate-float-orb-reverse {
          animation: float-orb 12s ease-in-out infinite reverse;
        }

        @keyframes iconPop {
          0% { opacity: 0; transform: scale(0); }
          70% { transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </section>
  );
};
