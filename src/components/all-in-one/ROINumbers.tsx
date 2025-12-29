import { AnimatedCounter } from './AnimatedCounter';
import { Clock, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

const stats = [
  {
    icon: Clock,
    value: 40,
    prefix: '-',
    suffix: '%',
    label: 'Tempo de espera',
    description: 'Na percepção do cliente',
  },
  {
    icon: Users,
    value: 15,
    prefix: '-',
    suffix: '%',
    label: 'Custos de mão de obra',
    description: 'Automação do caixa',
  },
  {
    icon: TrendingUp,
    value: 20,
    prefix: '+',
    suffix: '%',
    label: 'Faturamento',
    description: 'Upsell automático no Totem',
  },
  {
    icon: CheckCircle,
    value: 0,
    prefix: '',
    suffix: '',
    label: 'Erro Zero',
    description: 'Pedido feito = pedido entregue',
    isZero: true,
  },
];

export const ROINumbers = () => {
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
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-secondary/30 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full animate-pulse-glow"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 60%)',
          }}
        />
      </div>
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at center, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />
      
      <div className="container relative z-10">
        {/* Title */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-primary font-semibold mb-3 tracking-wider uppercase animate-pulse">Resultados Comprovados</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            Economia Real.{' '}
            <span className="text-primary relative">
              Crescimento Exponencial.
              <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" />
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Números baseados em operações reais de clientes Mostralo
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={stat.label}
                className={`
                  group text-center p-6 rounded-2xl bg-background/50 backdrop-blur-sm 
                  border border-border/30 hover:border-primary/50
                  transition-all duration-700 hover:shadow-[0_0_40px_rgba(var(--primary),0.2)]
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
                `}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {/* Icon */}
                <div className="relative w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center transition-all duration-500 group-hover:bg-primary/20 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(var(--primary),0.4)]">
                  {/* Pulse on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDuration: '2s' }} />
                  <Icon className="relative z-10 w-8 h-8 text-primary" />
                </div>
                
                {/* Value */}
                <div className="mb-3 relative">
                  {stat.isZero ? (
                    <span className="font-display font-black text-5xl md:text-6xl text-primary animate-glow">
                      ZERO
                    </span>
                  ) : (
                    <span className="font-display font-black text-5xl md:text-6xl text-primary">
                      <AnimatedCounter 
                        to={stat.value} 
                        prefix={stat.prefix} 
                        suffix={stat.suffix}
                        duration={2500}
                      />
                    </span>
                  )}
                  
                  {/* Value glow effect */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-24 h-24 bg-primary/15 rounded-full blur-2xl" />
                  </div>
                </div>
                
                {/* Label */}
                <h3 className="font-display font-bold text-lg text-foreground mb-1 transition-colors duration-300 group-hover:text-primary">
                  {stat.label}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {stat.description}
                </p>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary group-hover:w-2/3 transition-all duration-500" />
              </div>
            );
          })}
        </div>
        
        {/* Bottom note */}
        <div className={`mt-16 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '600ms' }}>
          <div className="inline-block p-6 bg-background/80 backdrop-blur-sm border border-primary/20 rounded-2xl hover:shadow-[0_0_40px_rgba(var(--primary),0.15)] transition-all duration-500 group cursor-default">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
              <span className="text-primary font-bold">100% de Precisão</span>
            </div>
            <p className="text-muted-foreground">
              O pedido feito no Totem é{' '}
              <span className="text-primary font-semibold">exatamente</span>{' '}
              o pedido entregue ao cliente
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 15px hsl(var(--primary) / 0.5); }
          50% { text-shadow: 0 0 35px hsl(var(--primary) / 0.8), 0 0 60px hsl(var(--primary) / 0.4); }
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};
