import { Check, X, Clock, Ban, TrendingUp, AlertCircle } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

const comparisons = [
  {
    item: 'Custo mensal',
    employee: 'R$ 2.500+',
    totem: 'R$ 297/mês',
    employeeIcon: AlertCircle,
    totemIcon: Check,
  },
  {
    item: 'Disponibilidade',
    employee: '8h/dia',
    totem: '24h/dia',
    employeeIcon: Clock,
    totemIcon: Check,
  },
  {
    item: 'Erros de pedido',
    employee: 'Frequentes',
    totem: 'Zero',
    employeeIcon: X,
    totemIcon: Check,
  },
  {
    item: 'Upsell consistente',
    employee: 'Depende do humor',
    totem: 'Sempre oferece',
    employeeIcon: Ban,
    totemIcon: TrendingUp,
  },
  {
    item: 'Férias/Faltas',
    employee: 'Custos extras',
    totem: 'Não se aplica',
    employeeIcon: X,
    totemIcon: Check,
  },
  {
    item: 'Treinamento',
    employee: 'Recorrente',
    totem: 'Uma vez',
    employeeIcon: AlertCircle,
    totemIcon: Check,
  },
];

export const CostComparisonTable = () => {
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
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="container relative z-10">
        {/* Header */}
        <div className={`
          text-center mb-12 transition-all duration-700
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}>
          <p className="text-primary font-semibold mb-3 tracking-wider uppercase">Comparativo</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            Funcionário vs.{' '}
            <span className="text-primary">Totem Mostralo</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Veja o impacto real na sua operação
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Table */}
          <div className={`
            bg-secondary/30 rounded-2xl border border-border/50 overflow-hidden
            transition-all duration-700 delay-100
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `}>
            {/* Header */}
            <div className="grid grid-cols-3 bg-secondary/50 p-4 border-b border-border/50">
              <div className="text-muted-foreground font-medium">Item</div>
              <div className="text-center text-muted-foreground font-medium">Funcionário</div>
              <div className="text-center">
                <span className="text-primary font-bold animate-pulse">Totem Mostralo</span>
              </div>
            </div>

            {/* Rows with staggered animation */}
            {comparisons.map((row, index) => {
              const EmployeeIcon = row.employeeIcon;
              const TotemIcon = row.totemIcon;
              
              return (
                <div 
                  key={row.item}
                  className={`
                    grid grid-cols-3 p-4 items-center group transition-all duration-500
                    hover:bg-primary/5
                    ${index !== comparisons.length - 1 ? 'border-b border-border/30' : ''}
                    ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}
                  `}
                  style={{ 
                    transitionDelay: `${200 + index * 100}ms`,
                  }}
                >
                  {/* Item name */}
                  <div className="font-medium text-foreground group-hover:text-primary transition-colors duration-300">
                    {row.item}
                  </div>
                  
                  {/* Employee column */}
                  <div className="text-center flex items-center justify-center gap-2">
                    <div className="p-1 rounded-full bg-destructive/10 group-hover:scale-110 transition-transform duration-300">
                      <EmployeeIcon className="w-4 h-4 text-destructive" />
                    </div>
                    <span className="text-muted-foreground text-sm">{row.employee}</span>
                  </div>
                  
                  {/* Totem column */}
                  <div className="text-center flex items-center justify-center gap-2">
                    <div className="p-1 rounded-full bg-primary/10 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(var(--primary),0.4)] transition-all duration-300">
                      <TotemIcon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-primary font-semibold text-sm">{row.totem}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom summary */}
          <div className={`
            mt-8 text-center transition-all duration-700
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `} style={{ transitionDelay: '800ms' }}>
            <div className="inline-block p-6 bg-primary/10 border border-primary/30 rounded-xl hover:shadow-[0_0_40px_rgba(var(--primary),0.2)] transition-all duration-500 group cursor-default">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <p className="text-primary font-bold text-xl">ROI em 3 meses</p>
              </div>
              <p className="text-foreground">
                O Totem se paga e começa a gerar lucro rapidamente
              </p>
              
              {/* Animated arrow */}
              <div className="mt-4 flex justify-center">
                <TrendingUp className="w-8 h-8 text-primary animate-bounce-subtle" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 1.5s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};
