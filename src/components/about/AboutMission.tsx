import { Target, Eye, Blocks, Building2, PiggyBank, Percent, Calendar } from "lucide-react";

const stats = [
  {
    icon: Calendar,
    value: "8+",
    label: "Anos de Experiência",
    description: "Desde 2016 no mercado",
  },
  {
    icon: Blocks,
    value: "28+",
    label: "Módulos Ativos",
    description: "Funcionalidades integradas",
  },
  {
    icon: Building2,
    value: "16+",
    label: "Nichos Atendidos",
    description: "De food a serviços",
  },
  {
    icon: PiggyBank,
    value: "R$ 90 mil",
    label: "Economia/Ano",
    description: "Potencial de economia",
  },
  {
    icon: Percent,
    value: "0%",
    label: "Taxa por Pedido",
    description: "Zero comissões",
  },
];

export const AboutMission = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container px-4 md:px-6">
        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto mb-16">
          {/* Mission */}
          <div className="bg-card border rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-3">
                Nossa Missão
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Dar <strong className="text-foreground">autonomia aos negócios locais</strong> para 
                competir com grandes redes sem depender de marketplaces caros e limitantes. 
                Queremos que cada empreendedor tenha as mesmas ferramentas das grandes empresas.
              </p>
            </div>
          </div>

          {/* Vision */}
          <div className="bg-card border rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-3">
                Nossa Visão
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Ser a <strong className="text-foreground">plataforma mais completa do Brasil</strong> para 
                gestão de negócios locais. Uma solução que cresce junto com o empreendedor, 
                desde o primeiro pedido até a expansão para múltiplas unidades.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-card border rounded-xl p-4 md:p-6 text-center hover:border-primary/50 transition-colors"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-display font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base font-medium text-foreground mb-0.5">
                  {stat.label}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {stat.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
