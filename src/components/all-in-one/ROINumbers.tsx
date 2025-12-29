import { AnimatedCounter } from './AnimatedCounter';
import { Clock, Users, TrendingUp, CheckCircle } from 'lucide-react';

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
  return (
    <section className="py-20 bg-secondary/30 relative overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container relative z-10">
        {/* Title */}
        <div className="text-center mb-16">
          <p className="text-primary font-semibold mb-3">RESULTADOS COMPROVADOS</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            Economia Real.{' '}
            <span className="text-primary">Crescimento Exponencial.</span>
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
                className="text-center group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:shadow-[0_0_30px_rgba(var(--primary),0.4)] transition-shadow duration-300">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                
                {/* Value */}
                <div className="mb-3">
                  {stat.isZero ? (
                    <span className="font-display font-black text-5xl md:text-6xl text-primary">
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
                </div>
                
                {/* Label */}
                <h3 className="font-display font-bold text-lg text-foreground mb-1">
                  {stat.label}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>
        
        {/* Bottom note */}
        <div className="mt-16 text-center">
          <div className="inline-block p-6 bg-background/80 backdrop-blur-sm border border-primary/20 rounded-2xl">
            <p className="text-lg text-muted-foreground">
              <span className="text-foreground font-semibold">Resultado:</span>{' '}
              O pedido feito no Totem é{' '}
              <span className="text-primary font-bold">exatamente</span>{' '}
              o pedido entregue na mão do cliente
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
