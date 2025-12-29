import { Check, X, Clock, Ban, TrendingUp, AlertCircle } from 'lucide-react';

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
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <p className="text-primary font-semibold mb-3">COMPARATIVO</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            Funcionário vs. Totem Mostralo
          </h2>
          <p className="text-muted-foreground text-lg">
            Veja o impacto real na sua operação
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-secondary/30 rounded-2xl border border-border/50 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-secondary/50 p-4 border-b border-border/50">
              <div className="text-muted-foreground font-medium">Item</div>
              <div className="text-center text-muted-foreground font-medium">Funcionário</div>
              <div className="text-center text-primary font-bold">Totem Mostralo</div>
            </div>

            {/* Rows */}
            {comparisons.map((row, index) => {
              const EmployeeIcon = row.employeeIcon;
              const TotemIcon = row.totemIcon;
              
              return (
                <div 
                  key={row.item}
                  className={`grid grid-cols-3 p-4 items-center ${
                    index !== comparisons.length - 1 ? 'border-b border-border/30' : ''
                  }`}
                >
                  <div className="font-medium text-foreground">{row.item}</div>
                  <div className="text-center flex items-center justify-center gap-2">
                    <EmployeeIcon className="w-4 h-4 text-destructive" />
                    <span className="text-muted-foreground text-sm">{row.employee}</span>
                  </div>
                  <div className="text-center flex items-center justify-center gap-2">
                    <TotemIcon className="w-4 h-4 text-primary" />
                    <span className="text-primary font-semibold text-sm">{row.totem}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom summary */}
          <div className="mt-8 text-center">
            <div className="inline-block p-4 bg-primary/10 border border-primary/30 rounded-xl">
              <p className="text-foreground font-medium">
                <span className="text-primary font-bold">ROI em 3 meses</span> — 
                O Totem se paga e começa a gerar lucro rapidamente
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
