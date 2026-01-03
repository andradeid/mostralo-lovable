import { Check, X, Zap } from "lucide-react";

const comparisons = [
  {
    title: "vs iFood e Marketplaces",
    mostralo: [
      "0% de taxa por pedido",
      "Relacionamento direto com cliente",
      "Dados são seus",
      "Marca própria",
    ],
    competitor: [
      "25-30% de comissão",
      "Cliente é do marketplace",
      "Dados limitados",
      "Sua marca some",
    ],
  },
  {
    title: "vs Sistemas Tradicionais",
    mostralo: [
      "Tudo integrado em um só lugar",
      "Atualizações automáticas",
      "Suporte via WhatsApp",
      "Sem instalação complexa",
    ],
    competitor: [
      "Várias ferramentas separadas",
      "Atualizações pagas",
      "Suporte burocrático",
      "Instalação técnica",
    ],
  },
  {
    title: "vs Fazer Manual",
    mostralo: [
      "Automação completa",
      "Relatórios em tempo real",
      "Marketing automatizado",
      "Escalável",
    ],
    competitor: [
      "Trabalho repetitivo",
      "Planilhas manuais",
      "Divulgação limitada",
      "Difícil crescer",
    ],
  },
];

export const AboutComparison = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Diferenciais
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-3">
            Por Que Escolher o Mostralo?
          </h2>
          <p className="text-muted-foreground">
            Veja como nos comparamos com outras soluções do mercado
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {comparisons.map((comparison) => (
            <div
              key={comparison.title}
              className="bg-card border rounded-2xl overflow-hidden"
            >
              <div className="bg-muted/50 p-4 border-b">
                <h3 className="font-semibold text-foreground text-center">
                  {comparison.title}
                </h3>
              </div>
              
              <div className="p-4 md:p-5">
                {/* Mostralo */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-semibold text-primary">Mostralo</span>
                  </div>
                  <ul className="space-y-2">
                    {comparison.mostralo.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Divider */}
                <div className="border-t my-4" />

                {/* Competitor */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-muted-foreground">Outros</span>
                  </div>
                  <ul className="space-y-2">
                    {comparison.competitor.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <X className="w-4 h-4 text-red-500/70 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
