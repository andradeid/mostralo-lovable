import { Store, Rocket, TrendingUp, Zap, Layers } from "lucide-react";

const timelineItems = [
  {
    year: "2023",
    title: "Cardápio Digital",
    description: "Início como sistema de cardápio digital para delivery",
    icon: Store,
  },
  {
    year: "2024",
    title: "Pedidos + Entregadores",
    description: "Sistema completo de gestão de pedidos e app para entregadores",
    icon: Rocket,
  },
  {
    year: "2024",
    title: "WhatsApp + SENTINELA",
    description: "Marketing automatizado e recompra inteligente via WhatsApp",
    icon: TrendingUp,
  },
  {
    year: "2025",
    title: "PDV, Comandas, KDS",
    description: "Totem, comandas eletrônicas e tela da cozinha",
    icon: Zap,
  },
  {
    year: "2025",
    title: "Multi-Nicho",
    description: "Plataforma completa para food, varejo e serviços",
    icon: Layers,
  },
];

export const AboutHero = () => {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      
      <div className="container px-4 md:px-6 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Store className="w-4 h-4" />
            Nossa História
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            De Cardápio Digital a{" "}
            <span className="text-primary">Plataforma Completa</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Conheça a evolução do Mostralo e como nos tornamos a solução all-in-one 
            para negócios locais em todo o Brasil.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-1/2" />

          <div className="space-y-8 md:space-y-12">
            {timelineItems.map((item, index) => {
              const Icon = item.icon;
              const isEven = index % 2 === 0;
              
              return (
                <div
                  key={item.year}
                  className={`relative flex items-start gap-4 md:gap-8 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Content */}
                  <div className={`flex-1 ml-12 md:ml-0 ${isEven ? "md:text-right" : "md:text-left"}`}>
                    <div
                      className={`inline-block bg-card border rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow ${
                        isEven ? "md:mr-8" : "md:ml-8"
                      }`}
                    >
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold mb-2">
                        {item.year}
                      </span>
                      <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center shadow-lg z-10">
                    <Icon className="w-4 h-4 md:w-6 md:h-6 text-primary-foreground" />
                  </div>

                  {/* Spacer for desktop */}
                  <div className="hidden md:block flex-1" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
