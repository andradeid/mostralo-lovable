import { User, Globe, Calendar, Award } from "lucide-react";

const founderStats = [
  {
    icon: Calendar,
    value: "30+",
    label: "Anos de experiência",
  },
  {
    icon: Globe,
    value: "Internacional",
    label: "Trajetória global",
  },
  {
    icon: Award,
    value: "2016",
    label: "Fundou o Mostralo",
  },
];

export const AboutFounder = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
      <div className="container px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <User className="w-4 h-4" />
              Conheça o Fundador
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground">
              A Mente Por Trás do <span className="text-primary">Mostralo</span>
            </h2>
          </div>

          {/* Founder Card */}
          <div className="bg-card border rounded-2xl shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr]">
              {/* Photo Section */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 flex flex-col items-center justify-center">
                {/* Avatar Placeholder */}
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl ring-4 ring-primary/20 mb-4">
                  <span className="text-4xl md:text-5xl font-display font-bold text-primary-foreground">
                    MA
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-display font-bold text-foreground text-center">
                  Marcos Andrade
                </h3>
                <p className="text-primary font-medium">Fundador & CEO</p>
                
                {/* Stats */}
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  {founderStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="text-center">
                        <div className="w-10 h-10 rounded-lg bg-background/80 flex items-center justify-center mx-auto mb-1">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-sm font-bold text-foreground">{stat.value}</div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bio Section */}
              <div className="p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                <div className="relative">
                  {/* Quote decoration */}
                  <div className="absolute -top-4 -left-2 text-6xl text-primary/10 font-serif leading-none">
                    "
                  </div>
                  
                  <div className="space-y-4 text-muted-foreground leading-relaxed pl-6">
                    <p>
                      Com <strong className="text-foreground">mais de 30 anos de experiência internacional</strong> em 
                      tecnologia e gestão, fundei o Mostralo em 2016 — originalmente como <em>linkcardmenu</em> — 
                      com uma visão clara: <strong className="text-primary">dar autonomia tecnológica aos pequenos negócios locais</strong>.
                    </p>
                    
                    <p>
                      Minha trajetória inclui passagens por empresas de tecnologia na Europa e América do Norte, 
                      onde desenvolvi expertise em automação comercial e sistemas de gestão. Essa experiência 
                      me mostrou que os pequenos empreendedores mereciam as mesmas ferramentas das grandes corporações.
                    </p>
                    
                    <p>
                      Hoje, lidero a missão de <strong className="text-foreground">democratizar o acesso à tecnologia de ponta</strong> para 
                      empreendedores brasileiros, ajudando-os a competir de igual para igual com grandes redes e marketplaces.
                    </p>
                  </div>

                  {/* Quote decoration end */}
                  <div className="absolute -bottom-8 right-0 text-6xl text-primary/10 font-serif leading-none">
                    "
                  </div>
                </div>

                {/* Vision highlight */}
                <div className="mt-10 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-sm text-muted-foreground italic">
                    <strong className="text-foreground not-italic">Minha visão desde 2016:</strong>{" "}
                    "Todo negócio local merece tecnologia de ponta. Não para competir com os grandes, 
                    mas para ter a mesma chance de sucesso."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
